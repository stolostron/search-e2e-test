FROM node:12.16.3-stretch as production

USER root
# Install yq
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys CC86BB64
RUN add-apt-repository ppa:rmescandon/yq
RUN apt update
RUN apt install yq -y

# Install Firefox
RUN apt-get update && apt-get install -y firefox-esr
# Install Chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install



WORKDIR /usr/src/app

#Add source files
RUN mkdir -p /opt/app-root/search-e2e
WORKDIR /opt/app-root/search-e2e
COPY . /opt/app-root/search-e2e

RUN chmod u+x ./download-clis.sh && ./download-clis.sh
RUN npm install
RUN chmod u+x ./start.sh

CMD ["./start.sh"]
