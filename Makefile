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
	-e CYPRESS_OPTIONS_HUB_BASEDOMAIN=$(OPTIONS_HUB_BASEDOMAIN) \
	-e CYPRESS_OPTIONS_HUB_USER=$(OPTIONS_HUB_USER) \
	-e CYPRESS_OPTIONS_HUB_PASSWORD=$(OPTIONS_HUB_PASSWORD) \
	-e CYPRESS_OPTIONS_MANAGED_BASEDOMAIN=$(OPTIONS_MANAGED_BASEDOMAIN) \
	-e CYPRESS_OPTIONS_MANAGED_USER=$(OPTIONS_MANAGED_USER) \
	-e CYPRESS_OPTIONS_MANAGED_PASSWORD=$(OPTIONS_MANAGED_PASSWORD) \
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
