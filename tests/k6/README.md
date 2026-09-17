# k6 Scale Testing

Load testing for ACM Search using [k6](https://k6.io) with Grafana dashboards.

## Prerequisites

- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) installed locally
- [Docker Compose](https://docs.docker.com/compose/install/) for the monitoring stack
- Access to an OpenShift cluster with ACM Search deployed

## Quick Start

```bash
# 1. Start the monitoring stack (Grafana + InfluxDB)
make test-k6-setup

# 2. Run a test
make test-k6-indexer TEST_VUS=3 TEST_DURATION=60s CLUSTER_PAYLOAD_SIZE=100k
make test-k6-api TEST_VUS=5 TEST_DURATION=60s
make test-k6-subscriptions TEST_VUS=2 TEST_DURATION=60s

# 3. Run all three simultaneously
make test-k6-combined TEST_DURATION=120s CLUSTER_PAYLOAD_SIZE=150k

# 4. View results at http://localhost:3000 (Grafana, no login required)

# 5. Tear down when done
make test-k6-teardown
```

## Scripts

| Script | What it tests |
|---|---|
| `scripts/indexer-sync.js` | POST sync payloads to the indexer (full state + delta updates) |
| `scripts/api-queries.js` | GraphQL queries: keyword, filter, count, autocomplete, related |
| `scripts/subscriptions.js` | WebSocket GraphQL subscriptions (graphql-transport-ws) |
| `scripts/combined.js` | All three simultaneously with independent VU counts |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `INDEXER_HOST` | from Makefile `HOST` | Indexer hostname:port |
| `API_HOST` | auto-detected from `oc get route` | API hostname:port |
| `API_TOKEN` | `oc whoami -t` | Bearer token for API auth |
| `TEST_VUS` | `2` | Virtual users (for single-script runs) |
| `TEST_DURATION` | `60s` | Test duration |
| `CLUSTER_PAYLOAD_SIZE` | `5k` | Full-state payload size for indexer tests: `5k`, `100k`, or `150k` |
| `SUB_DURATION` | `30` | Seconds each subscription stays open |
| `INDEXER_VUS` | `3` | Indexer VUs (combined.js) |
| `API_VUS` | `5` | API query VUs (combined.js) |
| `SUB_VUS` | `2` | Subscription VUs (combined.js) |

## Grafana Dashboard

The dashboard auto-provisions when the monitoring stack starts. It shows:

- **Overview**: active VUs, total requests, error rate, data sent
- **Indexer Sync**: request duration (p50/p95) by sync type, throughput
- **API Queries**: query duration by type, throughput breakdown
- **WebSocket Subscriptions**: messages received, inter-message latency, connect time

## Running Without Grafana

k6 outputs a summary to stdout by default. To skip the monitoring stack:

```bash
TEST_VUS=2 TEST_DURATION=30s CLUSTER_PAYLOAD_SIZE=100k INDEXER_HOST=<host> k6 run tests/k6/scripts/indexer-sync.js
```
