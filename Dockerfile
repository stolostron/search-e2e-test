# Copyright (c) 2020 Red Hat, Inc.

# FROM mikefarah/yq:4 as builder
FROM registry.access.redhat.com/ubi8/nodejs-14:1

USER root

COPY --from=builder /usr/bin/yq /usr/local/bin/yq

RUN mkdir -p /opt/app-root/src/search-e2e/cypress_cache
ENV CYPRESS_CACHE_FOLDER=/opt/app-root/src/search-e2e/cypress_cache

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
RUN npm install \
    cypress@8.3.0 \
    cypress-grep \
    cypress-multi-reporters \
    cypress-terminal-report \
    cypress-wait-until \
    @cypress/code-coverage \
    mocha \
    mocha-junit-reporter \
    mochawesome \
    mochawesome-merge

RUN sh download-clis.sh

RUN ["chmod", "+x", "start-tests.sh"]

ENTRYPOINT ["./start-tests.sh"]
