# Copyright (c) 2020 Red Hat, Inc.

FROM node:12.16.3-stretch as production

USER root

# Install Firefox
RUN apt-get update && apt-get install -y firefox-esr
# Install Chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install

WORKDIR .
ADD . .

RUN sh download-clis.sh
RUN npm install

CMD ["npm", "run", "test:e2e-headless"]