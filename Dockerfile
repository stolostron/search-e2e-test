# Copyright (c) 2020 Red Hat, Inc.

# FROM mikefarah/yq:4 as builder
FROM cypress/included:8.3.0 as production

USER root

COPY --from=builder /usr/bin/yq /usr/local/bin/yq

RUN mkdir -p /opt/app-root/src/grc-ui/cypress_cache
ENV CYPRESS_CACHE_FOLDER=/opt/app-root/src/grc-ui/cypress_cache

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
