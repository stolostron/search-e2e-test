# Copyright (c) 2020 Red Hat, Inc

# Bootstrap (pull) the build harness

# GITHUB_USER containing '@' char must be escaped with '%40'
GITHUB_USER := $(shell echo $(GITHUB_USER) | sed 's/@/%40/g')
GITHUB_TOKEN ?=


USE_VENDORIZED_BUILD_HARNESS ?= 

ifndef USE_VENDORIZED_BUILD_HARNESS
-include $(shell curl -s -H 'Authorization: token ${GITHUB_TOKEN}' -H 'Accept: application/vnd.github.v4.raw' -L https://api.github.com/repos/stolostron/build-harness-extensions/contents/templates/Makefile.build-harness-bootstrap -o .build-harness-bootstrap; echo .build-harness-bootstrap)
else
-include vbh/.build-harness-vendorized
endif

# Only use git commands if it exists
ifdef GIT
GIT_COMMIT      = $(shell git rev-parse --short HEAD)
GIT_REMOTE_URL  = $(shell git config --get remote.origin.url)
VCS_REF     = $(if $(shell git status --porcelain),$(GIT_COMMIT)-$(BUILD_DATE),$(GIT_COMMIT))
endif

SHORT_COMMIT_NAME := $(shell git rev-parse --short HEAD)
SEMVERSION ?= $(shell cat COMPONENT_VERSION)-${SHORT_COMMIT_NAME}

ifdef TRAVIS_PULL_REQUEST
	ifneq ($(TRAVIS_PULL_REQUEST),false)
		SEMVERSION = $(shell cat COMPONENT_VERSION)-PR${TRAVIS_PULL_REQUEST}-${SHORT_COMMIT_NAME}
	endif
endif

ifndef TRAVIS
	SEMVERSION = $(shell cat COMPONENT_VERSION)-$(shell whoami)-${SHORT_COMMIT_NAME}
endif

DOCKER_NAMESPACE := stolostron
DOCKER_REGISTRY := quay.io

TEST_IMAGE_TAG ?= $(COMPONENT_VERSION)$(COMPONENT_TAG_EXTENSION)

install:
	npm install

.PHONY: build-test-image
build-test-image:
	@echo "Building $(COMPONENT_DOCKER_REPO)/$(COMPONENT_NAME):$(TEST_IMAGE_TAG)"
	docker build . \
	-t $(COMPONENT_DOCKER_REPO)/$(COMPONENT_NAME):$(TEST_IMAGE_TAG)

.PHONY: run-test-image
run-test-image:
	npm run test:clean-reports
	docker run \
	--volume $(shell pwd)/options.yaml:/resources/options.yaml \
	--volume $(shell pwd)/results:/results \
	quay.io/stolostron/search-e2e:$(TEST_IMAGE_TAG)

.PHONY: run-test-image-pr
run-test-image-pr:
	# make a directory to mount our results into
	mkdir search-test-results

	docker run \
	-v /var/run/docker.sock:/var/run/docker.sock \
	-e USER=$(shell git log -1 --format='%ae') \
	-e GITHUB_TOKEN=$(GITHUB_TOKEN) \
	-e TRAVIS_BUILD_WEB_URL=$(TRAVIS_BUILD_WEB_URL) \
	-e TRAVIS_REPO_SLUG=$(TRAVIS_REPO_SLUG) \
	-e TRAVIS_PULL_REQUEST=$(TRAVIS_PULL_REQUEST) \
	-e OPTIONS_HUB_BASEDOMAIN=$(OPTIONS_HUB_BASEDOMAIN) \
	-e OPTIONS_HUB_USER=$(OPTIONS_HUB_USER) \
	-e OPTIONS_HUB_PASSWORD=$(OPTIONS_HUB_PASSWORD) \
	-e OPTIONS_MANAGED_BASEDOMAIN=$(OPTIONS_MANAGED_BASEDOMAIN) \
	-e OPTIONS_MANAGED_USER=$(OPTIONS_MANAGED_USER) \
	-e OPTIONS_MANAGED_PASSWORD=$(OPTIONS_MANAGED_PASSWORD) \
	--volume $(shell pwd)/search-test-results:/results \
	$(COMPONENT_DOCKER_REPO)/$(COMPONENT_NAME):$(TEST_IMAGE_TAG)

.PHONY: push
push:: docker/tag docker/login
	make docker/push

# --- k6 scale testing ---
# Note: env vars prefixed K6_ are reserved by k6 as CLI overrides.
# Use TEST_ prefix for our variables to avoid collisions.
TEST_VUS ?= 2
TEST_DURATION ?= 60s
CLUSTER_PAYLOAD_SIZE ?= 5k
INDEXER_HOST ?= $(shell oc get route search-indexer -n open-cluster-management -o jsonpath='{.spec.host}' 2>/dev/null || echo "localhost:3010")
API_HOST ?= $(shell oc get route search-api -n open-cluster-management -o jsonpath='{.spec.host}' 2>/dev/null || echo "localhost:4010")
API_TOKEN ?= $(shell oc whoami -t 2>/dev/null)
THANOS_HOST ?= $(shell oc get route thanos-querier -n openshift-monitoring -o jsonpath='{.spec.host}' 2>/dev/null || echo "localhost:9091")
K6_INFLUX ?= http://localhost:8086/k6
COMPOSE ?= $(shell which podman-compose 2>/dev/null || which docker-compose 2>/dev/null || echo "podman compose")

check-k6: ## Checks if k6 is installed in the system.
ifeq (,$(shell which k6))
	@echo k6 is required but not found.
	@echo Install k6 to continue. For more info visit: https://grafana.com/docs/k6/latest/set-up/install-k6/
	exit 1
endif

test-k6-setup: ## Start Grafana + InfluxDB monitoring stack for k6.
	THANOS_HOST=$(THANOS_HOST) API_TOKEN=$(API_TOKEN) envsubst < tests/k6/grafana-datasource.yml.tpl > tests/k6/grafana-datasource.yml
	cd tests/k6 && $(COMPOSE) up -d
	@echo "Grafana available at http://localhost:3000 (admin/admin)"

test-k6-indexer: check-k6 ## Run k6 indexer sync load test.
	TEST_VUS=$(TEST_VUS) TEST_DURATION=$(TEST_DURATION) CLUSTER_PAYLOAD_SIZE=$(CLUSTER_PAYLOAD_SIZE) INDEXER_HOST=$(INDEXER_HOST) \
		k6 run --out influxdb=$(K6_INFLUX) tests/k6/scripts/indexer-sync.js

test-k6-api: check-k6 ## Run k6 API query load test.
	TEST_VUS=$(TEST_VUS) TEST_DURATION=$(TEST_DURATION) API_HOST=$(API_HOST) API_TOKEN=$(API_TOKEN) \
		k6 run --out influxdb=$(K6_INFLUX) tests/k6/scripts/api-queries.js

test-k6-subscriptions: check-k6 ## Run k6 WebSocket subscription load test.
	TEST_VUS=$(TEST_VUS) TEST_DURATION=$(TEST_DURATION) API_HOST=$(API_HOST) API_TOKEN=$(API_TOKEN) \
		k6 run --out influxdb=$(K6_INFLUX) tests/k6/scripts/subscriptions.js

test-k6-combined: check-k6 ## Run all k6 load tests simultaneously.
	INDEXER_HOST=$(INDEXER_HOST) API_HOST=$(API_HOST) API_TOKEN=$(API_TOKEN) CLUSTER_PAYLOAD_SIZE=$(CLUSTER_PAYLOAD_SIZE) \
	TEST_DURATION=$(TEST_DURATION) \
		k6 run --out influxdb=$(K6_INFLUX) tests/k6/scripts/combined.js

test-k6-teardown: ## Stop and remove k6 monitoring stack.
	cd tests/k6 && $(COMPOSE) down -v
