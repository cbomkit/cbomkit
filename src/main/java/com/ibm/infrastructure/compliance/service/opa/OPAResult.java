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
package com.ibm.infrastructure.compliance.service.opa;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;
import com.ibm.infrastructure.compliance.ComplianceLevel;
import jakarta.annotation.Nonnull;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public enum OPAResult {
    @JsonProperty
    QUANTUMM_SAFE("quantum-safe"),
    @JsonProperty
    QUANTUM_VULNERABLE("quantum-vulnerable"),
    @JsonProperty
    NA("na"),
    @JsonProperty
    UNKNOWN("unknown");

    private static final Logger LOGGER = LoggerFactory.getLogger(OPAResult.class);

    @Nonnull
    private static final Map<OPAResult, ComplianceLevel> complianceLevels =
            Map.of(
                    OPAResult.QUANTUM_VULNERABLE,
                    new ComplianceLevel(
                            1,
                            "Not Quantum Safe",
                            null,
                            "#fac532",
                            ComplianceLevel.ComplianceIcon.WARNING,
                            true),
                    OPAResult.UNKNOWN,
                    new ComplianceLevel(
                            2,
                            "Unknown",
                            "Unknown Compliance",
                            "#17a9d1",
                            ComplianceLevel.ComplianceIcon.UNKNOWN,
                            true),
                    OPAResult.QUANTUMM_SAFE,
                    new ComplianceLevel(
                            3,
                            "Quantum Safe",
                            null,
                            "green",
                            ComplianceLevel.ComplianceIcon.CHECKMARK_SECURE,
                            false),
                    OPAResult.NA,
                    new ComplianceLevel(
                            4,
                            "Not Applicable",
                            "Not Applicable: we only categorize asymmetric algorithms",
                            "gray",
                            ComplianceLevel.ComplianceIcon.NOT_APPLICABLE,
                            false));

    public static List<ComplianceLevel> getComplianceLevels() {
        return new ArrayList<>(complianceLevels.values());
    }

    public static ComplianceLevel getComplianceLevel(OPAResult result) {
        return complianceLevels.get(result);
    }

    private final String value;

    private OPAResult(final String value) {
        this.value = value;
    }

    @JsonValue
    final String value() {
        return this.value;
    }

    @JsonCreator
    public static OPAResult forValue(String value) {
        return Arrays.stream(OPAResult.values())
                .filter(op -> op.value().equalsIgnoreCase(value))
                .findFirst()
                .orElseGet(
                        () -> {
                            LOGGER.error("Illegal result value '{}', assuming unknown", value);
                            return UNKNOWN;
                        });
    }
}
