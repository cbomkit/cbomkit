import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Load the unchanged ES module without changing the Vue project's module type.
const source = await readFile(
    new URL("../src/helpers/compliance-local.js", import.meta.url), "utf8"
);
const { createLocalComplianceReport } = await import(
    "data:text/javascript;base64," + Buffer.from(source).toString("base64")
);

function asset(name, ref, primitive) {
    return {
        type: "cryptographic-asset",
        name,
        "bom-ref": ref,
        cryptoProperties: {
            assetType: "algorithm",
            algorithmProperties: { primitive }
        }
    };
}

const rsa = () => asset("RSA", "rsa", "signature");
const mlkem = () => asset("ML-KEM-768", "mlkem", "kem");
const library = (components, ref = "library") => ({
    type: "library", name: ref, "bom-ref": ref, components
});

const cases = [
    {
        name: "evaluates top-level RSA",
        components: [rsa()],
        findings: [["rsa", 1]],
        safe: false
    },
    {
        name: "evaluates RSA inside a library",
        components: [library([rsa()])],
        findings: [["rsa", 1]],
        safe: false
    },
    {
        name: "evaluates RSA nested multiple levels deep",
        components: [library([library([rsa()], "inner")])],
        findings: [["rsa", 1]],
        safe: false
    },
    {
        name: "nested RSA prevents a safe verdict alongside top-level ML-KEM",
        components: [mlkem(), library([rsa()])],
        findings: [["mlkem", 3], ["rsa", 1]],
        safe: false
    },
    {
        name: "produces a finding for nested quantum-safe algorithms",
        components: [library([mlkem()])],
        findings: [["mlkem", 3]],
        safe: true
    }
];

for (const scenario of cases) {
    test(scenario.name, () => {
        const cbom = {
            bomFormat: "CycloneDX",
            specVersion: "1.6",
            version: 1,
            components: scenario.components
        };
        const original = JSON.stringify(cbom);
        const report = createLocalComplianceReport(cbom);

        assert.equal(report.error, false);
        assert.deepEqual(
            report.findings.map(finding => [finding.bomRef, finding.levelId]),
            scenario.findings
        );
        assert.equal(report.globalComplianceStatus, scenario.safe);
        assert.equal(JSON.stringify(cbom), original);
    });
}
