# Copyright (c) 2020 Red Hat, Inc.

# FROM cypress/included:8.3.0 as production
FROM registry.ci.openshift.org/open-cluster-management/builder:nodejs14-linux as builder

USER root

RUN mkdir -p /search-e2e-test/cypress_cache
ENV CYPRESS_CACHE_FOLDER=/search-e2e-test/cypress_cache

WORKDIR /search-e2e-test

# Make the directory writable by non-root users
RUN chmod -R go+w /search-e2e-test

COPY package.json ./
COPY package-lock.json ./
COPY cypress.json ./
COPY jest.config.js ./
COPY start-tests.sh ./
COPY download-clis.sh ./
COPY config ./config
COPY tests ./tests
COPY build/rbac-setup.sh ./
COPY build/rbac-clean.sh ./

RUN npm install -g --unsafe-perm=true --allow-root cypress@8.4.1
RUN npm install cypress-grep \
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
