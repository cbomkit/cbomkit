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
package com.ibm.infrastructure.scanning.repositories;

import static org.assertj.core.api.Assertions.assertThat;

import com.ibm.domain.scanning.Commit;
import com.ibm.domain.scanning.GitUrl;
import com.ibm.domain.scanning.LanguageScan;
import com.ibm.domain.scanning.ScanAggregate;
import com.ibm.domain.scanning.ScanId;
import com.ibm.domain.scanning.ScanMetadata;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import java.util.Optional;
import org.cyclonedx.model.Bom;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.pqca.scanning.CBOM;
import org.pqca.scanning.Language;

@QuarkusTest
class ScanResultLanguagePersistenceTest {

    @Inject ScanRepository repository;

    /**
     * Deliberately iterates {@link Language#values()} instead of listing languages, so that a
     * language added to cbomkit-lib fails here rather than in production. See issue #345: an
     * ordinal enum mapping left a stale {@code scanresult_language_check} constraint behind that
     * rejected every scan once a third language existed.
     */
    @Test
    @DisplayName("every language supported by cbomkit-lib can be persisted and read back")
    void everyLanguageRoundTrips() throws Exception {
        final ScanId scanId = new ScanId();
        // reconstruct instead of requestScan: this test is about persistence and should not
        // emit the domain events that kick off an actual scan
        final ScanAggregate scanAggregate =
                ScanAggregate.reconstruct(
                        scanId,
                        new GitUrl("https://github.com/pqca/cbomkit"),
                        null,
                        ScanAggregate.REVISION_MAIN,
                        null,
                        new Commit("0000000000000000000000000000000000000000"),
                        null);

        for (Language language : Language.values()) {
            scanAggregate.reportScanResults(
                    new LanguageScan(
                            language, new ScanMetadata(0L, 1L, 2, 3), new CBOM(new Bom())));
        }

        try {
            repository.save(scanAggregate);

            final Optional<ScanAggregate> reloaded = repository.read(scanId);
            assertThat(reloaded).isPresent();
            assertThat(reloaded.get().getLanguageScans()).isPresent();
            assertThat(reloaded.get().getLanguageScans().get())
                    .extracting(LanguageScan::language)
                    .containsExactlyInAnyOrder(Language.values());
        } finally {
            repository.delete(scanId);
        }
    }
}
