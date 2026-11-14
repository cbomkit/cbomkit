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
package com.ibm.domain.scanning;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class GitUrlTest {

    @Test
    void preservesRepositoryNamesEndingInGit() {
        assertThat(new GitUrl("https://example.com/owner/legit").value())
                .isEqualTo("https://example.com/owner/legit");
        assertThat(new GitUrl("https://example.com/owner/mygit").value())
                .isEqualTo("https://example.com/owner/mygit");
    }

    @Test
    void removesLiteralGitSuffix() {
        assertThat(new GitUrl("https://example.com/owner/repo.git").value())
                .isEqualTo("https://example.com/owner/repo");
        assertThat(new GitUrl("https://example.com/owner/legit.git").value())
                .isEqualTo("https://example.com/owner/legit");
    }

    @Test
    void preservesGitWithinRepositoryName() {
        assertThat(new GitUrl("https://example.com/owner/repo.git.backup").value())
                .isEqualTo("https://example.com/owner/repo.git.backup");
    }

    @Test
    void addsHttpsWhenSchemeIsMissing() {
        assertThat(new GitUrl("example.com/owner/legit").value())
                .isEqualTo("https://example.com/owner/legit");
    }
}
