# Walkthrough — Helm Charts & Bamboo 9 CI/CD Pipelines

## Summary

Added production-grade Kubernetes deployment via Helm and fully automated CI/CD pipelines using Bamboo on-prem v9 YAML Specs. **27 new files** created, **1 file modified** (docker-compose.yml). All changes committed and pushed to `https://github.com/jugash/so.git`.

---

## New Files Created

### Dockerfiles & nginx

| File | Purpose |
|---|---|
| [Dockerfile](file:///Users/jugash/home/Work/MetalStack/frontend/Dockerfile) | Multi-stage: Node 22 build → nginx 1.27-alpine runtime |
| [.dockerignore](file:///Users/jugash/home/Work/MetalStack/frontend/.dockerignore) | Excludes node_modules, dist, coverage from build context |
| [nginx.conf](file:///Users/jugash/home/Work/MetalStack/frontend/nginx.conf) | SPA fallback, gzip, security headers, `/health` endpoint |

### Helm Chart — `helm/metalstack/`

| Template | Purpose |
|---|---|
| [Chart.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/Chart.yaml) | Umbrella chart metadata (v0.1.0, appVersion 1.0.0) |
| [_helpers.tpl](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/_helpers.tpl) | Shared labels, selectors, name helpers for all components |
| [values.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/values.yaml) | Dev defaults (1 replica, debug logging, HPA off) |
| [values-staging.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/values-staging.yaml) | Staging overrides (2 replicas, HPA on, SSL redirect) |
| [values-prod.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/values-prod.yaml) | Prod overrides (3 replicas, HPA 3-5, TLS, --atomic) |
| [namespace.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/namespace.yaml) | Per-environment namespace creation |
| [backend-deployment.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/backend-deployment.yaml) | Spring Boot deployment with envFrom ConfigMap + Secret |
| [backend-service.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/backend-service.yaml) | ClusterIP on port 8080 |
| [backend-configmap.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/backend-configmap.yaml) | Non-sensitive config (CORS, profiles, logging level) |
| [backend-secret.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/backend-secret.yaml) | Credentials (DB, Keycloak URIs, mail) |
| [backend-hpa.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/backend-hpa.yaml) | Conditional HPA (v2 API, CPU-based) |
| [frontend-deployment.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/frontend-deployment.yaml) | nginx deployment with config checksum annotation |
| [frontend-service.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/frontend-service.yaml) | ClusterIP on port 80 |
| [frontend-configmap.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/frontend-configmap.yaml) | Backend service name/port for nginx |
| [ingress.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/ingress.yaml) | `/api` → backend, `/auth` → keycloak, `/` → frontend |
| [postgres-statefulset.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/postgres-statefulset.yaml) | StatefulSet with PVC for data persistence |
| [postgres-service.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/postgres-service.yaml) | ClusterIP on port 5432 |
| [postgres-secret.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/postgres-secret.yaml) | DB name, user, password |
| [keycloak-deployment.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/keycloak-deployment.yaml) | Keycloak with realm auto-import from ConfigMap |
| [keycloak-service.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/keycloak-service.yaml) | ClusterIP on port 8080 |
| [keycloak-configmap.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/keycloak-configmap.yaml) | Realm JSON embedded for auto-import |
| [test-connection.yaml](file:///Users/jugash/home/Work/MetalStack/helm/metalstack/templates/tests/test-connection.yaml) | `helm test` pod checking service connectivity |

### Bamboo 9 CI/CD

| File | Purpose |
|---|---|
| [bamboo.yml](file:///Users/jugash/home/Work/MetalStack/bamboo-specs/bamboo.yml) | 6-stage build plan (Test → Build → Docker → Dev → Staging → Prod) |
| [deployment.yml](file:///Users/jugash/home/Work/MetalStack/bamboo-specs/deployment.yml) | Deployment project with 3 environments and promotion gates |

---

## Pipeline Architecture

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Test        │──▶│  Build       │──▶│  Docker      │──▶│  Dev     │──▶│  Staging │──▶│  Prod    │
│  (parallel)  │   │  (parallel)  │   │  (parallel)  │   │  (auto)  │   │  (manual)│   │  (manual)│
│              │   │              │   │              │   │          │   │          │   │  +atomic │
│ • BE tests   │   │ • bootJar    │   │ • Jib push   │   │ helm     │   │ helm     │   │ helm     │
│ • FE tests   │   │ • npm build  │   │ • docker     │   │ upgrade  │   │ upgrade  │   │ upgrade  │
│ • coverage   │   │              │   │   push       │   │          │   │          │   │          │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────┘   └──────────┘   └──────────┘
```

## Verification Results

| Check | Result |
|---|---|
| `helm lint` | ✅ 1 chart linted, 0 failed |
| `helm template` (dev) | ✅ Renders correctly |
| `helm template` (staging) | ✅ Renders correctly |
| `helm template` (prod) | ✅ Renders correctly |
| Bamboo YAML syntax | ✅ Valid YAML |
| Git push | ✅ Pushed to `origin/main` |

## Modified Files

| File | Change |
|---|---|
| [docker-compose.yml](file:///Users/jugash/home/Work/MetalStack/docker-compose.yml) | Added backend + frontend services with health checks |
| [.gitignore](file:///Users/jugash/home/Work/MetalStack/.gitignore) | New root gitignore for the project |
