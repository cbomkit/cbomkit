/*
 * CBOMkit
 * Copyright (C) 2026 PQCA
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
package com.ibm.infrastructure.compliance;

import com.ibm.infrastructure.compliance.service.ComplianceCheckResultDTO;
import com.ibm.infrastructure.compliance.service.ICryptographicAssetPolicyResult;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;

/**
 * Builds {@link ComplianceResult} responses with fail-closed quantum-safe semantics.
 *
 * <p>{@code globalComplianceStatus} is {@code true} only when evaluation is complete and every
 * applicable asset is conclusively quantum-safe. Empty findings, missing policies, incomplete
 * coverage, unknowns, and errors never produce a quantum-safe global verdict.
 */
public final class ComplianceResultFactory {

    private ComplianceResultFactory() {}

    @Nonnull
    public static ComplianceResult fromServiceResult(
            @Nonnull String complianceServiceName,
            @Nullable String policyName,
            @Nonnull ComplianceCheckResultDTO checkResult,
            @Nonnull List<ComplianceLevel> complianceLevels,
            int defaultComplianceLevel,
            int totalCryptographicAssets) {
        if (checkResult.error()) {
            return ComplianceResult.error(complianceServiceName);
        }

        Collection<ICryptographicAssetPolicyResult> policyResults = checkResult.policyResults();
        if (policyResults == null) {
            return ComplianceResult.error(complianceServiceName);
        }

        List<ComplianceFinding> findings =
                policyResults.stream()
                        .map(
                                result ->
                                        new ComplianceFinding(
                                                result.identifier(),
                                                result.complianceLevel().id(),
                                                result.message()))
                        .toList();

        return fromFindings(
                complianceServiceName,
                policyName,
                findings,
                complianceLevels,
                defaultComplianceLevel,
                totalCryptographicAssets);
    }

    @Nonnull
    public static ComplianceResult fromFindings(
            @Nonnull String complianceServiceName,
            @Nullable String policyName,
            @Nonnull List<ComplianceFinding> findings,
            @Nonnull List<ComplianceLevel> complianceLevels,
            int defaultComplianceLevel,
            int totalCryptographicAssets) {

        Map<Integer, ComplianceLevel> levelsById = new HashMap<>();
        for (ComplianceLevel level : complianceLevels) {
            levelsById.put(level.id(), level);
        }

        int vulnerable = 0;
        int unknown = 0;
        int quantumSafe = 0;
        int notApplicable = 0;

        for (ComplianceFinding finding : findings) {
            ComplianceLevel level = levelsById.get(finding.levelId());
            if (level == null) {
                unknown++;
                continue;
            }
            switch (level.icon()) {
                case WARNING, ERROR -> vulnerable++;
                case UNKNOWN -> unknown++;
                case CHECKMARK, CHECKMARK_SECURE -> quantumSafe++;
                case NOT_APPLICABLE -> notApplicable++;
                default -> unknown++;
            }
        }

        int evaluatedAssets = findings.size();
        int applicableAssets = evaluatedAssets - notApplicable;
        ComplianceEvaluationSummary summary =
                new ComplianceEvaluationSummary(
                        totalCryptographicAssets,
                        Math.max(applicableAssets, 0),
                        evaluatedAssets,
                        quantumSafe,
                        vulnerable,
                        unknown,
                        notApplicable);

        EvaluationStatus status;
        boolean globalComplianceStatus = false;

        if (totalCryptographicAssets <= 0) {
            status = EvaluationStatus.NOT_APPLICABLE;
        } else if (findings.isEmpty()) {
            // Missing policy, empty OPA result, or no findings key — never quantum-safe.
            status = EvaluationStatus.NOT_EVALUATED;
        } else if (applicableAssets <= 0) {
            status = EvaluationStatus.NOT_APPLICABLE;
        } else if (evaluatedAssets < totalCryptographicAssets) {
            status = EvaluationStatus.PARTIAL;
        } else if (vulnerable > 0 || unknown > 0) {
            status = EvaluationStatus.EVALUATED;
        } else {
            status = EvaluationStatus.EVALUATED;
            globalComplianceStatus = true;
        }

        return new ComplianceResult(
                complianceServiceName,
                policyName,
                findings,
                complianceLevels,
                defaultComplianceLevel,
                globalComplianceStatus,
                false,
                status,
                summary);
    }
}
