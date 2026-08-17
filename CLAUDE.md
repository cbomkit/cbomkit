# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

CBOMkit generates, stores, views and compliance-checks **CBOMs** (Cryptography Bills of Materials, CycloneDX). Two deployables live in one repo:

- **Backend** (`src/`) — Quarkus 3 / Java 21 REST + WebSocket API, Postgres via Hibernate Panache.
- **Frontend** (`frontend/`) — Vue 2 + Carbon Design SPA. Also ships standalone as *CBOMkit-coeus* (viewer-only mode, `VUE_APP_VIEWER_ONLY=true`).

The actual source-code scanning is **not** in this repo: it comes from the `org.pqca:cbomkit-lib` dependency (indexing + scanner services for Java/Python/Go, aka CBOMkit-hyperion / sonar-cryptography). This repo orchestrates clone → index → scan → persist → serve.

## Build prerequisite

`org.pqca:cbomkit-lib` is hosted on **GitHub Packages**, so Maven needs a `~/.m2/settings.xml` with a `github` server entry (username + PAT with `read:packages`). Without it every build fails at dependency resolution — that is the first thing to check on a resolution error, not the pom.

## Commands

```shell
# backend
./mvnw quarkus:dev                       # dev mode, port 8081 (needs Postgres, see below)
./mvnw clean package                     # build (runs spotless+checkstyle+tests)
./mvnw test                              # tests only
./mvnw test -Dtest=GitServiceTest        # single test class
./mvnw test -Dtest=GitServiceTest#method # single test method
./mvnw spotless:apply                    # format + insert license headers
./mvnw spotless:check
./mvnw checkstyle:check

# frontend (cd frontend/)
npm ci
npm run serve      # dev server on :8001
npm run build
npm run lint

# environments (docker-compose profiles; ENGINE=podman also works)
make dev           # postgres only          -> run backend + frontend locally
make dev-backend   # postgres + frontend    -> run backend locally
make dev-frontend  # postgres + backend     -> run frontend locally
make production    # full stack
make ext-compliance# full stack + OPA container serving opa/*.rego
make coeus         # frontend only (viewer)
```

**Tests need a running Postgres.** All meaningful tests are `@QuarkusTest` and boot the app against `jdbc:postgresql://localhost:5432/postgres` (user/pass `cbomkit`). Start `make dev` first, or `mvn package` will fail on DB connect. Some tests (`GitServiceTest`, `PurlResolverTest`, `MavenPackageFinderService`) also hit the network.

`make` targets resolve `VERSION` by curling the **latest GitHub release tag**, not the pom version — so `make production` runs released images, and `make build-backend-image` tags the locally built jar with the latest release tag.

## Formatting is enforced at build time

The spotless plugin binds `apply` (not `check`) to the `validate` phase, and checkstyle binds `check` there too. Any `./mvnw` invocation will silently reformat your Java sources (google-java-format, **AOSP style**, 4-space indent) and inject the Apache/PQCA license header. New `.java` files without the header are fixed automatically; don't hand-write it.

## Architecture

Layered DDD + CQRS, built on the `app.bootstrap.core` library (`AggregateRoot`, `Repository`, `ICommandBus`, `ProcessManager`, `Projector`, `DomainEventHandler`).

```
presentation/  JAX-RS resources + WebSocket endpoint  (com.ibm.presentation.api.v1)
usecases/      commands, queries, handlers, process managers, projectors, services
domain/        aggregates, value objects, domain events — no framework deps
infrastructure/ buses, Panache entities, read models, compliance services, config
```

**ArchUnit enforces domain isolation** (`src/test/java/com/ibm/architecture/DomainTest.java`). `com.ibm.domain` may only depend on an explicit allowlist (`java..`, `app.bootstrap.core.ddd..`, `jakarta.annotation/inject`, `org.cyclonedx.model..`, `com.github.packageurl..`, `org.pqca.scanning..`). Adding any other import to a domain class breaks the build — either move the code to `usecases`/`infrastructure` or deliberately extend the allowlist.

### Scan flow (the core of the system)

1. `ScanningResource` (POST `/api/v1/scan`) or `WebsocketScanningResource` (`/v1/scan/{clientId}`) creates a `ScanId`, instantiates a **per-scan** `ScanProcessManager`, and registers it on the `CommandBus` for the scan's command types. The WebSocket path passes a `WebSocketProgressDispatcher` so the UI gets live progress; the REST path uses `EmptyProgressDispatcher`.
2. `RequestScanCommandHandler` builds the `ScanAggregate`, which emits `ScanRequestedEvent` (git URL) or `PurlScanRequestedEvent` (PURL).
3. `ScanEventHandler` turns those domain events into the first command (`CloneGitRepositoryCommand` / `ResolvePurlCommand`).
4. `ScanProcessManager` is the saga: resolve PURL → clone (JGit) → identify package folder → index modules → scan, sending the next command to itself via the bus after each step and persisting aggregate state in between. Every handler starts with `if (this.scanId != command.id()) return;` because *all* registered process managers see every command. On failure it dispatches an `ERROR` progress message and calls `compensate`.
5. `ScanFinishedEvent` → `CBOMProjector` writes the read model.

Because process managers are registered per scan on a shared singleton `CommandBus`, and both buses dispatch on cached thread pools, scans run concurrently and asynchronously — nothing here is request-scoped.

### Persistence: write model vs. read model

- Write side: `ScanAggregate` ⇄ `Scan` Panache entity (`infrastructure/scanning/repositories`). This is a **state snapshot**, not an event store — events are only in-memory signals published on the `DomainEventBus`.
- Read side: `CBOMReadModel` (`infrastructure/database/readmodels`) stores the serialized CBOM as a Postgres JSON column, keyed by `projectIdentifier` (a PURL, e.g. `pkg:github/keycloak/keycloak@<commit>`). This is what `/api/v1/cbom/**` serves.
- Schema is managed by `quarkus.hibernate-orm.schema-management.strategy=update` — no migration tool.

### Compliance

`Configuration.getComplianceService()` picks the implementation once and caches it statically: if `cbomkit.ext-policies.opa-api-base` (`CBOMKIT_OPA_API_BASE`) is set **and** reachable, it uses `OPAComplianceService`, otherwise it falls back to the built-in `BasicQuantumSafeComplianceService` (OID/name whitelists). Because the choice is cached in a static field, changing the env var requires a restart.

OPA policies live in `opa/*.rego`, package `policies`, rules named `<policy_name>.findings contains finding if ...`, where `<policy_name>` must equal the frontend's `VUE_APP_POLICY_NAME` (default `quantum_safe`). Each finding needs `bom-ref`, `result` (`quantum-safe|quantum-vulnerable|na|unknown`) and `rule`; a malformed finding makes CBOMkit fall back to the internal service. See README for the full contract.

Note the frontend *also* has its own client-side quantum-safe check, used in coeus/viewer mode.

### API surface

`/api` (status), `/api/v1/scan` (POST), `/api/v1/cbom/last/{limit}`, `/api/v1/cbom/{projectIdentifier}` (GET/POST/DELETE), `/api/v1/compliance/check` (GET by project identifier, POST with a CBOM body), WebSocket `/v1/scan/{clientId}`. `openapi.yaml`/`openapi.json` at the repo root are generated by SmallRye (`quarkus.smallrye-openapi.store-schema-directory=./`) — regenerate rather than hand-edit.

## Configuration

Everything is env-driven through `src/main/resources/application.properties`: `CBOMKIT_PORT`, `CBOMKIT_DB_*`, `CBOMKIT_FRONTEND_URL_CORS`, `CBOMKIT_CLONEDIR` (temp clone dir, defaults to `~/.cbomkit`), `CBOMKIT_JAVA_JAR_DIR` (BouncyCastle jars in `src/main/resources/java/scan/`, used to resolve Java crypto symbols), `CBOMKIT_OPA_API_BASE`. Frontend uses `VUE_APP_*` (`frontend/.env.development`, `.env.production`).

## Conventions worth matching

- `jakarta.annotation.Nonnull` / `Nullable` on essentially every field, parameter and return — the codebase treats these as mandatory documentation.
- Java 21 pattern-matching `switch` over sealed-ish command/event hierarchies in handlers; `default -> { // nothing }`.
- Domain errors are dedicated exception classes under `domain/scanning/errors` and `usecases/*/errors`, not generic exceptions.
- `final class` + constructor injection (no field `@Inject`).
- Git credentials (PAT or user/password) are passed through commands to JGit and never logged or persisted; clones are deleted after the scan.
