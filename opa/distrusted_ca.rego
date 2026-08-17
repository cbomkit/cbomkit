package policies

##################
# Distrusted CA policy
#
# Flags CycloneDX cryptographic-asset components of assetType "certificate"
# whose issuerName matches a known-distrusted or known-malicious Certificate
# Authority (e.g. CAs that have been removed from major root programs).
#
# Result vocabulary:
#   "distrusted"  - issuer matched the distrusted list
#   "trusted"     - certificate has an issuer and none of the patterns matched
#   "unknown"     - certificate has no issuerName to evaluate
#
# Match strategy: case-insensitive substring match on the issuer DN against
# distinguishing tokens (organization name, common name fragments). RDN order
# and quoting vary across emitters, so substring is more robust than equality
# on a canonicalized DN.
##################

##################
# Distrusted CA list
#
# Each entry is a case-insensitive substring matched against issuerName.
# Sources noted inline. Keep ordered by year of distrust action.
##################
distrusted_issuer_patterns := [
	# DigiNotar — compromised 2011, removed from all major root stores
	"diginotar",

	# WoSign / StartCom — distrusted by Apple, Google, Microsoft, Mozilla in 2016-2017
	"wosign",
	"startcom",
	"startssl",

	# Symantec PKI (incl. Thawte, GeoTrust, RapidSSL, VeriSign legacy) —
	# distrust phased in by Chrome/Firefox 2017-2018 for certs issued before
	# 2017-12-01. Operational CA business sold to DigiCert.
	"symantec",
	"thawte",
	"geotrust",
	"rapidssl",

	# Camerfirma — distrusted by Mozilla in 2021
	"camerfirma",

	# TrustCor — distrusted by Mozilla, Microsoft, Google in 2022
	"trustcor",

	# e-Tugra — distrusted by Chrome and Mozilla in 2023
	"e-tugra",

	# Entrust — distrusted by Chrome for TLS server auth, effective Nov 2024
	# (still trusted for other uses; flag for review)
	"entrust",
]

##################
# Helpers
##################

is_certificate(component) if {
	component.type == "cryptographic-asset"
	component.cryptoProperties.assetType == "certificate"
}

issuer_lower(component) := lower(component.cryptoProperties.certificateProperties.issuerName)

matches_distrusted(issuer) if {
	some pattern in distrusted_issuer_patterns
	contains(issuer, pattern)
}

classify(issuer) := "distrusted" if {
	matches_distrusted(issuer)
} else := "trusted"

##################
# Rules
##################

# Certificates with an issuer name — classify against the distrusted list.
distrusted_ca.findings contains finding if {
	some component in input.components
	is_certificate(component)
	component.cryptoProperties.certificateProperties.issuerName

	issuer := issuer_lower(component)

	finding := {
		"rule": "distrusted_ca_issuer",
		"result": classify(issuer),
		"value": component.cryptoProperties.certificateProperties.issuerName,
		"referenceList": distrusted_issuer_patterns,
		"bom-ref": component["bom-ref"],
		"property": "certificateProperties.issuerName",
	}
}

# Certificates without an issuer name — unknown.
distrusted_ca.findings contains finding if {
	some component in input.components
	is_certificate(component)
	not component.cryptoProperties.certificateProperties.issuerName

	finding := {
		"rule": "distrusted_ca_issuer",
		"result": "unknown",
		"value": "",
		"referenceList": distrusted_issuer_patterns,
		"bom-ref": component["bom-ref"],
		"property": "certificateProperties.issuerName",
	}
}
