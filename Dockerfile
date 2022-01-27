# Copyright (c) 2020 Red Hat, Inc.

FROM mikefarah/yq:4 as builder
FROM cypress/included:9.2.0 as production

USER root

RUN mkdir -p /search-e2e/cypress_cache
# ENV CYPRESS_CACHE_FOLDER=/search-e2e/cypress_cache
WORKDIR /search-e2e

COPY --from=builder /usr/bin/yq /usr/local/bin/yq

COPY package.json .
COPY package-lock.json .
COPY cypress.json .
COPY jest.config.js .
COPY start-tests.sh .
COPY download-clis.sh .
COPY config ./config
COPY tests ./tests
COPY build ./build
COPY cicd-scripts/run-prow-e2e.sh .
COPY cicd-scripts/run-prow-unit.sh .
RUN npm i

RUN sh download-clis.sh

RUN chmod -R go+w /search-e2e

RUN ["chmod", "+x", "start-tests.sh"]

ENTRYPOINT ["./start-tests.sh"]
