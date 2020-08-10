#!/bin/bash

# Copyright (c) 2020 Red Hat, Inc

set -e

export DOCKER_IMAGE_AND_TAG=${1}
make build
