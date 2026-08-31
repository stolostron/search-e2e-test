# Copyright (c) 2020 Red Hat, Inc.

FROM mikefarah/yq:4.32.2 as builder
FROM registry.redhat.io/ubi9/nodejs-24-minimal:latest AS production

USER root

COPY --from=builder /usr/bin/yq /usr/local/bin/yq

RUN microdnf install -y jq && microdnf clean all

WORKDIR /search-e2e

COPY package.json .
COPY package-lock.json .
COPY jest.config.js .
COPY start-tests.sh .
COPY config ./config
COPY tests ./tests
COPY build ./build
COPY scripts ./scripts
COPY cicd-scripts/run-prow-e2e.sh .

RUN npm ci
RUN sh ./scripts/install-dependencies.sh

RUN chmod -R go+w /search-e2e

RUN ["chmod", "+x", "start-tests.sh"]

ENTRYPOINT ["./start-tests.sh"]
