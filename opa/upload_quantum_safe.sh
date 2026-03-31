#!/bin/bash

OPA_URL=http://localhost:8181
if [ $# -gt 0 ]; then
  OPA_URL=$1
fi

curl --data-binary '@quantum_safe.rego' -H 'Content-Type: text/plain' -X PUT $OPA_URL/v1/policies/quantum_safe

