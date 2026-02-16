/*
 * CBOMkit
 * Copyright (C) 2024 PQCA
 *
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to you under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.ibm.usecases.scanning.processmanager;

import app.bootstrap.core.cqrs.ICommand;
import app.bootstrap.core.cqrs.ICommandBus;
import app.bootstrap.core.cqrs.ProcessManager;
import app.bootstrap.core.ddd.IRepository;
import com.github.packageurl.PackageURL;
import com.ibm.domain.scanning.Commit;
import com.ibm.domain.scanning.GitUrl;
import com.ibm.domain.scanning.LanguageScan;
import com.ibm.domain.scanning.ScanAggregate;
import com.ibm.domain.scanning.ScanId;
import com.ibm.domain.scanning.ScanMetadata;
import com.ibm.domain.scanning.errors.ScanResultForLanguageAlreadyExists;
import com.ibm.infrastructure.errors.EntityNotFoundById;
import com.ibm.infrastructure.scanning.IScanConfiguration;
import com.ibm.usecases.scanning.commands.CloneGitRepositoryCommand;
import com.ibm.usecases.scanning.commands.IdentifyPackageFolderCommand;
import com.ibm.usecases.scanning.commands.IndexModulesCommand;
import com.ibm.usecases.scanning.commands.RequestScanCommand;
import com.ibm.usecases.scanning.commands.ResolvePurlCommand;
import com.ibm.usecases.scanning.commands.ScanCommand;
import com.ibm.usecases.scanning.errors.GitCloneFailed;
import com.ibm.usecases.scanning.errors.GitCloneResultNotAvailable;
import com.ibm.usecases.scanning.errors.NoCommitProvided;
import com.ibm.usecases.scanning.errors.NoGitUrlSpecifiedForScan;
import com.ibm.usecases.scanning.errors.NoIndexForProject;
import com.ibm.usecases.scanning.errors.NoProjectDirectoryProvided;
import com.ibm.usecases.scanning.errors.NoPurlSpecifiedForScan;
import com.ibm.usecases.scanning.services.git.CloneResultDTO;
import com.ibm.usecases.scanning.services.git.GitService;
import com.ibm.usecases.scanning.services.pkg.MavenPackageFinderService;
import com.ibm.usecases.scanning.services.pkg.PypiPackageFinderService;
import com.ibm.usecases.scanning.services.resolve.DepsDevService;
import com.ibm.usecases.scanning.services.resolve.GithubPurlResolver;
import com.ibm.usecases.scanning.services.resolve.PurlResolver;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import java.io.File;
import java.nio.file.Path;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.apache.commons.io.FileUtils;
import org.pqca.errors.CBOMSerializationFailed;
import org.pqca.errors.ClientDisconnected;
import org.pqca.indexing.IndexingService;
import org.pqca.indexing.ProjectModule;
import org.pqca.indexing.go.GoIndexService;
import org.pqca.indexing.java.JavaIndexService;
import org.pqca.indexing.python.PythonIndexService;
import org.pqca.progress.IProgressDispatcher;
import org.pqca.progress.ProgressMessage;
import org.pqca.progress.ProgressMessageType;
import org.pqca.scanning.Language;
import org.pqca.scanning.ScanResultDTO;
import org.pqca.scanning.ScannerService;
import org.pqca.scanning.go.GoScannerService;
import org.pqca.scanning.java.JavaScannerService;
import org.pqca.scanning.python.PythonScannerService;

public final class ScanProcessManager extends ProcessManager<ScanId, ScanAggregate> {

    @Nonnull private final ScanId scanId;
    @Nonnull private final IProgressDispatcher progressDispatcher;
    @Nonnull private final String baseCloneDirPath;

    @Nullable private File projectDirectory;
    @Nonnull private final Map<Language, List<ProjectModule>> index;
    @Nullable private final String javaJarsDirPath;

    public ScanProcessManager(
            @Nonnull ScanId scanId,
            @Nonnull ICommandBus commandBus,
            @Nonnull IRepository<ScanId, ScanAggregate> repository,
            @Nonnull IProgressDispatcher progressDispatcher,
            @Nonnull IScanConfiguration iScanConfiguration) {
        super(commandBus, repository);
        this.scanId = scanId;
        this.progressDispatcher = progressDispatcher;
        this.baseCloneDirPath = iScanConfiguration.getBaseCloneDirPath();
        this.index = new EnumMap<>(Language.class);
        this.javaJarsDirPath = iScanConfiguration.getJavaDependencyJARSPath();
    }

    @Override
    public void handle(@Nonnull ICommand command) throws Exception {
        switch (command) {
            case ResolvePurlCommand resolvePurlCommand ->
                    this.handleResolvePurlCommand(resolvePurlCommand);
            case CloneGitRepositoryCommand cloneGitRepositoryCommand ->
                    this.handleCloneGitRepositoryCommand(cloneGitRepositoryCommand);
            case IdentifyPackageFolderCommand identifyPackageFolderCommand ->
                    this.handleSetPackageFolderCommand(identifyPackageFolderCommand);
            case IndexModulesCommand indexModulesCommand ->
                    this.handleIndexModulesCommand(indexModulesCommand);
            case ScanCommand scanCommand -> this.handleScanCommand(scanCommand);
            default -> {
                // nothing
            }
        }
    }

    private void handleResolvePurlCommand(@Nonnull ResolvePurlCommand command) throws Exception {
        if (this.scanId != command.id()) {
            return;
        }
        final Optional<ScanAggregate> possibleScanAggregate = this.repository.read(command.id());
        final ScanAggregate scanAggregate =
                possibleScanAggregate.orElseThrow(() -> new EntityNotFoundById(command.id()));
        final PackageURL purl =
                scanAggregate.getPurl().orElseThrow(() -> new NoPurlSpecifiedForScan(scanId));

        try {
            final PurlResolver resolver =
                    purl.getType().equals(PackageURL.StandardTypes.GITHUB)
                            ? new GithubPurlResolver()
                            : new DepsDevService();
            final GitUrl gitUrl = resolver.resolve(purl);

            // update aggregate
            scanAggregate.setResolvedGitUrl(gitUrl);

            if (purl.getType().equals(PackageURL.StandardTypes.GITHUB)) {
                scanAggregate.setCommitHash(new Commit(purl.getVersion()));
                this.progressDispatcher.send(
                        new ProgressMessage(ProgressMessageType.REVISION_HASH, purl.getVersion()));

                if (purl.getSubpath() != null) {
                    scanAggregate.setPackageFolder(Path.of(purl.getSubpath()));
                }
            }

            this.repository.save(scanAggregate);

            this.commandBus.send(
                    new CloneGitRepositoryCommand(command.id(), command.credentials()));
        } catch (Exception e) {
            this.progressDispatcher.send(
                    new ProgressMessage(ProgressMessageType.ERROR, e.getMessage()));
            this.compensate(command.id());
            throw e;
        }
    }

    private void handleCloneGitRepositoryCommand(@Nonnull CloneGitRepositoryCommand command)
            throws Exception {
        if (this.scanId != command.id()) {
            return;
        }
        final Optional<ScanAggregate> possibleScanAggregate = this.repository.read(command.id());
        final ScanAggregate scanAggregate =
                possibleScanAggregate.orElseThrow(() -> new EntityNotFoundById(command.id()));
        final GitUrl gitUrl =
                scanAggregate
                        .getGitUrl()
                        .orElseThrow(() -> new NoGitUrlSpecifiedForScan(command.id()));
        try {
            this.progressDispatcher.send(
                    new ProgressMessage(ProgressMessageType.GITURL, gitUrl.value()));
            this.progressDispatcher.send(
                    new ProgressMessage(
                            ProgressMessageType.BRANCH, scanAggregate.getRevision().value()));

            // clone git repository
            final GitService gitService =
                    new GitService(
                            this.progressDispatcher, this.baseCloneDirPath, command.credentials());
            final CloneResultDTO cloneResultDTO =
                    gitService.clone(
                            gitUrl,
                            scanAggregate.getRevision(),
                            scanAggregate.getCommit().orElse(null));
            this.projectDirectory = cloneResultDTO.directory();
            // update aggregate
            if (scanAggregate.getCommit().isEmpty()) {
                this.progressDispatcher.send(
                        new ProgressMessage(
                                ProgressMessageType.REVISION_HASH, cloneResultDTO.commit().hash()));
                scanAggregate.setCommitHash(cloneResultDTO.commit());
            }
            this.repository.save(scanAggregate);
            // set subfolder
            this.commandBus.send(new IdentifyPackageFolderCommand(command.id()));
        } catch (GitCloneFailed gitCloneFailed) {
            // if previous attempted failed with `main`, try `master`
            if (scanAggregate.getRevision().equals(ScanAggregate.REVISION_MAIN)) {
                // delete old aggregate
                this.repository.delete(scanId);
                // emit new scan command with `master` branch
                this.commandBus.send(
                        new RequestScanCommand(
                                this.scanId,
                                gitUrl.value(),
                                "master",
                                scanAggregate.getPackageFolder().map(Path::toString).orElse(null),
                                command.credentials()));
            } else {
                this.progressDispatcher.send(
                        new ProgressMessage(
                                ProgressMessageType.ERROR, gitCloneFailed.getMessage()));
                this.compensate(command.id());
                throw gitCloneFailed;
            }
        } catch (Exception e) {
            this.progressDispatcher.send(
                    new ProgressMessage(ProgressMessageType.ERROR, e.getMessage()));
            this.compensate(command.id());
            throw e;
        }
    }

    private void handleSetPackageFolderCommand(@Nonnull IdentifyPackageFolderCommand command)
            throws Exception {
        if (this.scanId != command.id()) {
            return;
        }

        try {
            final Optional<ScanAggregate> possibleScanAggregate =
                    this.repository.read(command.id());
            final ScanAggregate scanAggregate =
                    possibleScanAggregate.orElseThrow(() -> new EntityNotFoundById(command.id()));
            final File dir =
                    Optional.ofNullable(this.projectDirectory)
                            .orElseThrow(GitCloneResultNotAvailable::new);
            // Determine source code location related to PURL in a repository with multiple
            // projects/packages/modules
            final Optional<PackageURL> optionalPackageURL = scanAggregate.getPurl();
            if (optionalPackageURL.isPresent()) {
                final PackageURL purl = optionalPackageURL.get();
                Optional<Path> packagePath = Optional.empty();
                if (purl.getType().equals(PackageURL.StandardTypes.MAVEN)) {
                    // java
                    packagePath = new MavenPackageFinderService(dir).findPackage(purl);
                } else if (purl.getType().equals(PackageURL.StandardTypes.PYPI)) {
                    // python
                    packagePath = new PypiPackageFinderService(dir).findPackage(purl);
                }
                // update aggregate
                if (packagePath.isPresent()) {
                    scanAggregate.setPackageFolder(packagePath.get());
                    this.repository.save(scanAggregate);
                    // send data to frontend
                    this.progressDispatcher.send(
                            new ProgressMessage(
                                    ProgressMessageType.FOLDER, packagePath.get().toString()));
                }
            }
            // start indexing
            this.commandBus.send(new IndexModulesCommand(command.id()));
        } catch (Exception e) {
            this.progressDispatcher.send(
                    new ProgressMessage(ProgressMessageType.ERROR, e.getMessage()));
            this.compensate(command.id());
            throw e;
        }
    }

    private void handleIndexModulesCommand(@Nonnull IndexModulesCommand command) throws Exception {
        if (this.scanId != command.id()) {
            return;
        }

        try {
            final Optional<ScanAggregate> possibleScanAggregate =
                    this.repository.read(command.id());
            final ScanAggregate scanAggregate =
                    possibleScanAggregate.orElseThrow(() -> new EntityNotFoundById(command.id()));
            final File projectDir =
                    Optional.ofNullable(this.projectDirectory)
                            .orElseThrow(GitCloneResultNotAvailable::new);

            // set up scanners
            final Map<Language, IndexingService> indexers = new HashMap<>();
            // java
            indexers.put(Language.JAVA, new JavaIndexService(this.progressDispatcher, projectDir));
            // python
            indexers.put(
                    Language.PYTHON, new PythonIndexService(this.progressDispatcher, projectDir));
            // go
            indexers.put(Language.GO, new GoIndexService(this.progressDispatcher, projectDir));

            // run indexers
            for (Language language : Language.values()) {
                if (!indexers.containsKey(language)) continue;

                final IndexingService indexer = indexers.get(language);
                final List<ProjectModule> languageIndex =
                        indexer.index(scanAggregate.getPackageFolder().orElse(null));
                this.index.put(language, languageIndex);
            }

            // continue with scan
            this.commandBus.send(new ScanCommand(command.id()));
        } catch (Exception e) {
            this.progressDispatcher.send(
                    new ProgressMessage(ProgressMessageType.ERROR, e.getMessage()));
            this.compensate(command.id());
            throw e;
        }
    }

    private void handleScanCommand(@Nonnull ScanCommand command)
            throws EntityNotFoundById,
                    NoProjectDirectoryProvided,
                    NoIndexForProject,
                    NoCommitProvided,
                    ScanResultForLanguageAlreadyExists,
                    ClientDisconnected,
                    CBOMSerializationFailed,
                    NoGitUrlSpecifiedForScan {
        if (this.scanId != command.id()) {
            return;
        }

        try {
            final Optional<ScanAggregate> possibleScanAggregate =
                    this.repository.read(command.id());
            final ScanAggregate scanAggregate =
                    possibleScanAggregate.orElseThrow(() -> new EntityNotFoundById(command.id()));
            final GitUrl gitUrl =
                    scanAggregate
                            .getGitUrl()
                            .orElseThrow(() -> new NoGitUrlSpecifiedForScan(scanId));
            final Commit commit = scanAggregate.getCommit().orElseThrow(NoCommitProvided::new);
            Optional.of(this.index).filter(m -> !m.isEmpty()).orElseThrow(NoIndexForProject::new);
            Optional.ofNullable(this.projectDirectory).orElseThrow(NoProjectDirectoryProvided::new);

            // set up scanners
            final Map<Language, ScannerService> scanners = new HashMap<>();

            // java
            final JavaScannerService javaScannerService =
                    new JavaScannerService(this.progressDispatcher, this.projectDirectory);
            javaScannerService.setRequireBuild(false);
            javaScannerService.addJavaDependencyJar(this.javaJarsDirPath);

            scanners.put(Language.JAVA, javaScannerService);

            // python
            final PythonScannerService pythonScannerService =
                    new PythonScannerService(this.progressDispatcher, this.projectDirectory);
            scanners.put(Language.PYTHON, pythonScannerService);

            // go
            final GoScannerService goScannerService =
                    new GoScannerService(this.progressDispatcher, this.projectDirectory);
            scanners.put(Language.GO, goScannerService);

            // progress scan statistics
            final long startTime = System.currentTimeMillis();
            int numberOfScannedLine = 0;
            int numberOfScannedFiles = 0;

            // run scanners
            for (Language language : Language.values()) {
                if (!scanners.containsKey(language)) continue;

                final ScannerService scanner = scanners.get(language);
                final ScanResultDTO scanResultDTO = scanner.scan(this.index.get(language));

                // update statistics
                numberOfScannedLine += scanResultDTO.numberOfScannedLines();
                numberOfScannedFiles += scanResultDTO.numberOfScannedFiles();

                if (scanResultDTO.cbom() != null) {
                    // add metadata
                    scanResultDTO
                            .cbom()
                            .addMetadata(
                                    gitUrl.value(),
                                    scanAggregate.getRevision().value(),
                                    commit.hash(),
                                    scanAggregate
                                            .getPackageFolder()
                                            .map(Path::toString)
                                            .orElse(null));
                    // update statistics
                    scanAggregate.reportScanResults(
                            new LanguageScan(
                                    language,
                                    new ScanMetadata(
                                            scanResultDTO.startTime(),
                                            scanResultDTO.endTime(),
                                            scanResultDTO.numberOfScannedLines(),
                                            scanResultDTO.numberOfScannedFiles()),
                                    scanResultDTO.cbom()));
                }
            }

            // publish scan finished and save state
            scanAggregate.scanFinished();
            this.repository.save(scanAggregate);

            this.progressDispatcher.send(
                    new ProgressMessage(
                            ProgressMessageType.SCANNED_DURATION,
                            String.valueOf((System.currentTimeMillis() - startTime) / 1000)));
            this.progressDispatcher.send(
                    new ProgressMessage(
                            ProgressMessageType.SCANNED_FILE_COUNT,
                            String.valueOf(numberOfScannedFiles)));
            this.progressDispatcher.send(
                    new ProgressMessage(
                            ProgressMessageType.SCANNED_NUMBER_OF_LINES,
                            String.valueOf(numberOfScannedLine)));
            this.progressDispatcher.send(
                    new ProgressMessage(
                            ProgressMessageType.CBOM,
                            Optional.ofNullable(scanAggregate.getConsolidatedCBOM())
                                    .orElseThrow(CBOMSerializationFailed::new)
                                    .toJSON()
                                    .toString()));
            this.progressDispatcher.send(
                    new ProgressMessage(ProgressMessageType.LABEL, "Finished"));
        } catch (Exception | NoSuchMethodError e) { // catch NoSuchMethodError: see issue #138
            this.progressDispatcher.send(
                    new ProgressMessage(ProgressMessageType.ERROR, e.getMessage()));
            throw e;
        } finally {
            this.compensate(command.id());
        }
    }

    @Override
    public void compensate(@Nonnull ScanId id) {
        // unregister process manager
        this.commandBus.unregister(
                this,
                List.of(
                        ResolvePurlCommand.class,
                        CloneGitRepositoryCommand.class,
                        IdentifyPackageFolderCommand.class,
                        IndexModulesCommand.class,
                        ScanCommand.class));
        // remove cloned repo
        Optional.ofNullable(this.projectDirectory)
                .ifPresent(
                        dir -> {
                            try {
                                FileUtils.deleteDirectory(dir);
                            } catch (Exception ignored) {
                                // ignore
                            }
                        });
    }
}
