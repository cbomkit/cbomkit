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

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ibm.infrastructure.compliance.ComplianceLevel;
import com.ibm.infrastructure.compliance.service.ICryptographicAssetPolicyResult;
import jakarta.annotation.Nonnull;
import java.util.Set;

public class OPAFinding implements ICryptographicAssetPolicyResult {

    /** name of triggered rule */
    @JsonProperty(required = true)
    @Nonnull
    private String rule;

    /** rule evaluation result */
    @JsonProperty(required = true)
    @Nonnull
    private OPAResult result;

    /** value that triggered the rule */
    private String value;

    /** whitelist values */
    private Set<String> referenceList;

    /** threshold value */
    private Float referenceValue;

    /** CBOM bom-ref of non-compliant component */
    @JsonProperty(required = true, value = "bom-ref")
    @Nonnull
    private String bomRef;

    /** JSON path to triggering property */
    private String property;

    public OPAFinding() {}

    public String getRule() {
        return rule;
    }

    public void setRule(String rule) {
        this.rule = rule;
    }

    public OPAResult getResult() {
        return result;
    }

    public void setResult(OPAResult result) {
        this.result = result;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public Set<String> getReferenceList() {
        return referenceList;
    }

    public void setReferenceList(Set<String> referenceList) {
        this.referenceList = referenceList;
    }

    public Float getReferenceValue() {
        return referenceValue;
    }

    public void setReferenceValue(Float referenceValue) {
        this.referenceValue = referenceValue;
    }

    public String getBomRef() {
        return bomRef;
    }

    public void setBomRef(String bomRef) {
        this.bomRef = bomRef;
    }

    public String getProperty() {
        return property;
    }

    public void setProperty(String property) {
        this.property = property;
    }

    @Override
    public String toString() {
        return "OpaFinding{"
                + rule
                + ","
                + result
                + ","
                + value
                + ","
                + referenceList
                + ","
                + referenceValue
                + ","
                + bomRef
                + ","
                + property
                + '}';
    }

    @Override
    public String identifier() {
        return bomRef;
    }

    @Override
    public ComplianceLevel complianceLevel() {
        return OPAResult.getComplianceLevel(result);
    }

    @Override
    public String message() {
        StringBuffer message = new StringBuffer("Rule '" + rule + "' fired");
        if (property != null) {
            message.append(" on asset property '" + property + "'");
            if (value != null) {
                message.append("='" + value + "'");
            }
        }
        return message.toString();
    }
}
