# Licensed Materials - Property of IBM
# (c) Copyright IBM Corporation 2018, 2019. All Rights Reserved.
# Copyright (c) 2020 Red Hat, Inc
# Note to U.S. Government Users Restricted Rights:
# Use, duplication or disclosure restricted by GSA ADP Schedule
# Contract with IBM Corp.

#!/bin/bash
set -e

export DOCKER_IMAGE_AND_TAG=${1}
make build
