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
package com.ibm.usecases.scanning.services.git;

import static org.assertj.core.api.Assertions.assertThat;

import com.ibm.domain.scanning.GitUrl;
import com.ibm.domain.scanning.Revision;
import java.io.File;
import java.nio.file.Files;
import org.apache.commons.io.FileUtils;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.revwalk.RevCommit;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Regression test for issue #339: when cloning by tag revision with no commit hash (the Maven PURL
 * path), the working tree must be checked out to the tagged commit, not left at the default-branch
 * HEAD.
 */
class GitServiceRevisionCheckoutTest {

    @Test
    @DisplayName(
            "clone by tag revision (commit==null) checks out the tagged commit, not"
                    + " default-branch HEAD")
    void testCloneByTagRevisionCheckoutsTaggedCommit() throws Exception {
        File sourceDir = Files.createTempDirectory("cbomkit-source-").toFile();
        File baseCloneDir = Files.createTempDirectory("cbomkit-clones-").toFile();
        String commitAFullHash;
        try {
            // Build a two-commit local repo:
            //   commit A  →  tagged as "v1.0.0"  (only file-a.txt)
            //   commit B  →  default-branch HEAD  (adds file-b.txt)
            try (Git source = Git.init().setDirectory(sourceDir).call()) {
                new File(sourceDir, "file-a.txt").createNewFile();
                source.add().addFilepattern("file-a.txt").call();
                RevCommit commitA =
                        source.commit()
                                .setAuthor("Test", "test@test.com")
                                .setCommitter("Test", "test@test.com")
                                .setMessage("Commit A")
                                // never sign: a global commit.gpgsign=true would otherwise fail
                                // here
                                .setSign(false)
                                .call();
                commitAFullHash = commitA.name();

                // lightweight tag on commit A
                source.tag().setName("v1.0.0").setObjectId(commitA).setAnnotated(false).call();

                new File(sourceDir, "file-b.txt").createNewFile();
                source.add().addFilepattern("file-b.txt").call();
                source.commit()
                        .setAuthor("Test", "test@test.com")
                        .setCommitter("Test", "test@test.com")
                        .setMessage("Commit B")
                        .setSign(false)
                        .call();
            }

            // Clone using the tag revision only — no commit hash supplied.
            // This is the path taken for Maven PURLs (e.g. guava@33.0.0-jre).
            GitService gitService = new GitService(baseCloneDir.getAbsolutePath(), null);
            GitUrl gitUrl = new GitUrl("file://" + sourceDir.getAbsolutePath());
            CloneResultDTO result = gitService.clone(gitUrl, new Revision("v1.0.0"), null);

            try {
                // file-b.txt was introduced after the v1.0.0 tag.
                // A correct clone must NOT contain it in the working tree.
                // If it does exist, the working tree was left at default-branch HEAD (commit B)
                // instead of being checked out to the tagged commit (commit A).
                assertThat(new File(result.directory(), "file-b.txt"))
                        .as(
                                "file-b.txt must not exist: working tree must reflect v1.0.0"
                                        + " (commit A), not default-branch HEAD (commit B)")
                        .doesNotExist();

                // Cross-check: HEAD in the cloned repo must equal commit A.
                try (Git cloned = Git.open(result.directory())) {
                    ObjectId head = cloned.getRepository().resolve("HEAD");
                    assertThat(head.name())
                            .as("HEAD in cloned repo must be the tagged commit A, not commit B")
                            .isEqualTo(commitAFullHash);
                }
            } finally {
                FileUtils.deleteDirectory(result.directory());
            }
        } finally {
            FileUtils.deleteDirectory(sourceDir);
            FileUtils.deleteDirectory(baseCloneDir);
        }
    }
}
