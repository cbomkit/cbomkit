package policies_test

# Tests for opa/quantum_safe.rego
#
# Run with: opa test opa/ -v
#
# test_ecdh_* and test_x25519_* fail if the asymmetric primitives list
# uses "keyagree" instead of the CycloneDX value "key-agree".
# test_aes_* and test_mlkem_* are regression checks for the symmetric
# and KEM paths.

import data.policies.quantum_safe

# ---------------------------------------------------------------------------
# Shared test components
# ---------------------------------------------------------------------------

# A classical key-agreement algorithm (ECDH, secp256r1).
# CycloneDX 1.6 schema enum value is "key-agree" (with hyphen).
# The bug used "keyagree" (no hyphen), so this component fell through to
# the symmetric_na rule and was silently marked NA instead of quantum-vulnerable.
ecdh_component := {
	"type": "cryptographic-asset",
	"bom-ref": "alg-ecdh",
	"name": "ECDH",
	"cryptoProperties": {
		"assetType": "algorithm",
		"algorithmProperties": {
			"primitive": "key-agree",
			"curve": "secp256r1",
			"cryptoFunctions": ["keygen", "keyderive"],
		},
	},
}

# X25519 — another key-agreement algorithm, different curve.
# Included to confirm the fix covers the whole primitive, not just one name.
x25519_component := {
	"type": "cryptographic-asset",
	"bom-ref": "alg-x25519",
	"name": "X25519",
	"cryptoProperties": {
		"assetType": "algorithm",
		"algorithmProperties": {
			"primitive": "key-agree",
			"curve": "x25519",
			"cryptoFunctions": ["keygen", "keyderive"],
		},
	},
}

# ---------------------------------------------------------------------------
# Test 1: ECDH must be classified quantum-vulnerable, not NA
#
# Before fix: is_asymmetric() returns false for primitive "key-agree"
#             → symmetric_na fires → result "NA"   ← WRONG
# After fix:  is_asymmetric() returns true
#             → asymmetric_quantum_safe fires → result "quantum-vulnerable" ← CORRECT
# ---------------------------------------------------------------------------
test_ecdh_is_quantum_vulnerable if {
	findings := quantum_safe.findings with input as {"components": [ecdh_component]}

	# There must be exactly one finding for this component.
	count([f | some f in findings; f["bom-ref"] == "alg-ecdh"]) == 1

	# That finding must use the asymmetric rule, not symmetric_na.
	some finding in findings
	finding["bom-ref"] == "alg-ecdh"
	finding.rule == "asymmetric_quantum_safe"
	finding.result == "quantum-vulnerable"
}

# ---------------------------------------------------------------------------
# Test 2: X25519 must also be classified quantum-vulnerable, not NA
# ---------------------------------------------------------------------------
test_x25519_is_quantum_vulnerable if {
	findings := quantum_safe.findings with input as {"components": [x25519_component]}

	count([f | some f in findings; f["bom-ref"] == "alg-x25519"]) == 1

	some finding in findings
	finding["bom-ref"] == "alg-x25519"
	finding.rule == "asymmetric_quantum_safe"
	finding.result == "quantum-vulnerable"
}

# ---------------------------------------------------------------------------
# Regression: AES-256 (symmetric) must still be NA — the fix must not
# accidentally promote symmetric algorithms into the asymmetric path.
# ---------------------------------------------------------------------------
test_aes_remains_na if {
	aes_component := {
		"type": "cryptographic-asset",
		"bom-ref": "alg-aes256",
		"name": "AES-256",
		"cryptoProperties": {
			"assetType": "algorithm",
			"algorithmProperties": {
				"primitive": "block-cipher",
				"cryptoFunctions": ["encrypt", "decrypt"],
			},
		},
	}

	findings := quantum_safe.findings with input as {"components": [aes_component]}

	some finding in findings
	finding["bom-ref"] == "alg-aes256"
	finding.rule == "symmetric_na"
	finding.result == "NA"
}

# ---------------------------------------------------------------------------
# Regression: ML-KEM-768 (post-quantum KEM) must be quantum-safe.
# The "kem" primitive was already spelled correctly; confirm it still works.
# ---------------------------------------------------------------------------
test_mlkem_is_quantum_safe if {
	mlkem_component := {
		"type": "cryptographic-asset",
		"bom-ref": "alg-mlkem768",
		"name": "ml-kem",
		"cryptoProperties": {
			"assetType": "algorithm",
			"algorithmProperties": {
				"primitive": "kem",
				"parameterSetIdentifier": "768",
				"cryptoFunctions": ["encapsulate", "decapsulate"],
			},
		},
	}

	findings := quantum_safe.findings with input as {"components": [mlkem_component]}

	some finding in findings
	finding["bom-ref"] == "alg-mlkem768"
	finding.rule == "asymmetric_quantum_safe"
	finding.result == "quantum-safe"
}

# ---------------------------------------------------------------------------
# Issue #380: parametrised post-quantum names must be quantum-safe.
#
# NIST and most scanners emit names like ML-KEM-768 and ML-DSA-65, not the
# bare stem. The name rule used exact set membership against bare stems, so a
# parametrised or differently cased name fell through to quantum-vulnerable.
# The name rule now matches a whitelist stem as a case-insensitive substring,
# the same way the internal compliance service does (lowerCaseName.contains).
# ---------------------------------------------------------------------------
pqc_component(ref, nm, prim) := {
	"type": "cryptographic-asset",
	"bom-ref": ref,
	"name": nm,
	"cryptoProperties": {
		"assetType": "algorithm",
		"algorithmProperties": {"primitive": prim},
	},
}

test_mlkem_768_parametrised_is_quantum_safe if {
	findings := quantum_safe.findings with input as {"components": [pqc_component("alg-mlkem-768", "ML-KEM-768", "kem")]}
	some finding in findings
	finding["bom-ref"] == "alg-mlkem-768"
	finding.rule == "asymmetric_quantum_safe"
	finding.result == "quantum-safe"
}

test_mldsa_65_is_quantum_safe if {
	findings := quantum_safe.findings with input as {"components": [pqc_component("alg-mldsa-65", "ML-DSA-65", "signature")]}
	some finding in findings
	finding["bom-ref"] == "alg-mldsa-65"
	finding.rule == "asymmetric_quantum_safe"
	finding.result == "quantum-safe"
}

test_slhdsa_is_quantum_safe if {
	findings := quantum_safe.findings with input as {"components": [pqc_component("alg-slhdsa", "SLH-DSA-SHAKE-256f", "signature")]}
	some finding in findings
	finding["bom-ref"] == "alg-slhdsa"
	finding.rule == "asymmetric_quantum_safe"
	finding.result == "quantum-safe"
}

test_falcon_is_quantum_safe if {
	findings := quantum_safe.findings with input as {"components": [pqc_component("alg-falcon", "Falcon-512", "signature")]}
	some finding in findings
	finding["bom-ref"] == "alg-falcon"
	finding.rule == "asymmetric_quantum_safe"
	finding.result == "quantum-safe"
}

test_mlkem_lowercase_parametrised_is_quantum_safe if {
	findings := quantum_safe.findings with input as {"components": [pqc_component("alg-mlkem-lc", "ml-kem-768", "kem")]}
	some finding in findings
	finding["bom-ref"] == "alg-mlkem-lc"
	finding.rule == "asymmetric_quantum_safe"
	finding.result == "quantum-safe"
}

# Regression: a classical asymmetric name must stay quantum-vulnerable.
# Substring matching must not approve it.
test_rsa_name_is_quantum_vulnerable if {
	findings := quantum_safe.findings with input as {"components": [pqc_component("alg-rsa", "RSA-2048", "signature")]}
	some finding in findings
	finding["bom-ref"] == "alg-rsa"
	finding.rule == "asymmetric_quantum_safe"
	finding.result == "quantum-vulnerable"
}
