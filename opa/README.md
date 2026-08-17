# OPA Policies

CBOMkit's external compliance service evaluates CBOMs against Rego policies
loaded into an [Open Policy Agent](https://www.openpolicyagent.org/) server.
All policies live in the `policies` package and expose a `<name>.findings`
set of finding objects keyed by CBOM `bom-ref`.

## Policies

| File | Policy name | Asset type | Result vocabulary |
|---|---|---|---|
| `quantum_safe.rego` | `quantum_safe` | algorithm | `quantum-safe` / `quantum-vulnerable` / `unknown` / `na` |
| `distrusted_ca.rego` | `distrusted_ca` | certificate | `distrusted` / `trusted` / `unknown` |

## Finding shape

Each rule emits findings with the following shape (see `OPAFinding.java`):

```json
{
  "rule": "string — rule that fired",
  "result": "string — one of the policy's result values",
  "value": "string — the value that triggered the rule",
  "referenceList": ["..."],
  "referenceValue": 0,
  "bom-ref": "string — CBOM component bom-ref",
  "property": "string — JSON path to the triggering property"
}
```

`bom-ref` is required; the rest are optional depending on the rule.

## Local development

Start a local OPA instance and upload all policies:

```bash
docker run -p 8181:8181 openpolicyagent/opa:latest run --server

./upload_quantum_safe.sh
./upload_distrusted_ca.sh
```

Test a policy against a sample CBOM:

```bash
curl -X POST http://localhost:8181/v1/data/policies/distrusted_ca \
  -H 'Content-Type: application/json' \
  --data-binary '@testdata/distrusted_ca_input.json'
```

Configure CBOMkit to use the local OPA via `application.properties` or env:

```
CBOMKIT_EXT-POLICIES_OPA-API-BASE=http://localhost:8181
```

## Notes on `distrusted_ca`

The list of distrusted issuer patterns is **baked into the Rego file** and
matched case-insensitively as substrings against
`cryptoProperties.certificateProperties.issuerName`. Substring matching is
robust against RDN ordering and quoting differences between CBOM emitters.

Adding a new distrusted CA: append a lowercase distinguishing token to
`distrusted_issuer_patterns` in `distrusted_ca.rego` and re-upload. Prefer
the organization name (e.g. `"trustcor"`) over a full DN.

### Result-vocabulary in the Java layer

`OPAResult` recognizes both vocabularies:
`quantum-safe / quantum-vulnerable / na / distrusted / trusted / unknown`.
Each maps to a `ComplianceLevel` with a severity rank, icon, and color
consumed by the frontend (see `OPAResult.java`). `DISTRUSTED` is ranked 0
(most severe) and uses the red `ERROR` icon.
