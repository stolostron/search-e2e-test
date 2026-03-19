# Copyright (c) 2020 Red Hat, Inc.

FROM mikefarah/yq:4.32.2 as builder
# Should match cypress version in package.json
FROM cypress/included:13.17.0 AS production

USER root

COPY --from=builder /usr/bin/yq /usr/local/bin/yq

# Resolve issue with invalid public key during apt-get update
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | tee /etc/apt/trusted.gpg.d/google.asc >/dev/null
RUN apt-get update && apt-get install -y jq

RUN mkdir -p /search-e2e/cypress_cache
ENV CYPRESS_CACHE_FOLDER=/search-e2e/cypress_cache
WORKDIR /search-e2e

COPY package.json .
COPY package-lock.json .
COPY cypress.config.js .
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
