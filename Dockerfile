# Copyright (c) 2020 Red Hat, Inc.

FROM registry.access.redhat.com/ubi8/nodejs-14:1

# FROM mikefarah/yq:4 as builder
# FROM cypress/included:8.3.0 as production

USER root

# COPY --from=builder /usr/bin/yq /usr/local/bin/yq

RUN mkdir -p /search-e2e/cypress_cache
ENV CYPRESS_CACHE_FOLDER=/search-e2e/cypress_cache

COPY package.json .
COPY package-lock.json .
COPY cypress.json .
COPY jest.config.js .
COPY start-tests.sh .
COPY download-clis.sh .
COPY config ./config
COPY tests ./tests
COPY build/rbac-setup.sh .
COPY build/rbac-clean.sh .

RUN npm ci
RUN sh download-clis.sh

RUN ["chmod", "+x", "start-tests.sh"]

ENTRYPOINT ["./start-tests.sh"]
