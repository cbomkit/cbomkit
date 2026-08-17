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

import com.fasterxml.jackson.databind.JsonNode;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import jakarta.persistence.Cacheable;
import jakarta.persistence.Entity;
import java.sql.Timestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.pqca.scanning.Language;

@Entity
@Cacheable
class ScanResult extends PanacheEntity {
    /**
     * Holds {@link Language#name()} and is deliberately <em>not</em> mapped as an enum: Hibernate
     * emits a check constraint listing the known values for every enum typed attribute, whether it
     * is stored as an ordinal, as {@code @Enumerated(STRING)} or through an {@code
     * AttributeConverter} (see {@code EnumJavaType#getCheckCondition}). Since {@code
     * quarkus.hibernate-orm.schema-management.strategy=update} never rewrites an existing check
     * constraint, adding a language to cbomkit-lib would make every insert fail on databases that
     * were created before that language existed. Storing plain text keeps the set of supported
     * languages out of the schema.
     */
    @Nonnull public String language;

    @Nonnull public Timestamp startTime;
    @Nonnull public Timestamp endTime;
    public int numberOfScannedLines;
    public int numberOfScannedFiles;

    protected ScanResult() {}

    @Nonnull
    @JdbcTypeCode(SqlTypes.JSON)
    public JsonNode cbom;

    public ScanResult(
            @Nonnull Language language,
            long startTime,
            long endTime,
            int numberOfScannedLines,
            int numberOfScannedFiles,
            @Nonnull JsonNode cbom) {
        this.language = language.name();
        this.startTime = new Timestamp(startTime);
        this.endTime = new Timestamp(endTime);
        this.numberOfScannedLines = numberOfScannedLines;
        this.numberOfScannedFiles = numberOfScannedFiles;
        this.cbom = cbom;
    }

    /**
     * @return the stored language, or {@code null} if this row was written by a version of
     *     cbomkit-lib that supported a language this version no longer knows.
     */
    @Nullable Language language() {
        try {
            return Language.valueOf(this.language);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
