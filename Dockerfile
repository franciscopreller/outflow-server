FROM node:7.8-alpine
MAINTAINER Francisco Preller <francisco.preller@gmail.com>

## Setup userspace
RUN rm /home/app -rf
RUN mkdir -p /home/app/
WORKDIR /home/app

# Install app dependencies
RUN npm install -g forever@0.14.2

# Load Package JSON
ADD ./package.json /home/app/package.json
ADD ./yarn.lock /home/app/yarn.lock
RUN yarn install --production

# Load the source into the docker image
ADD . /home/app

# Run the init
EXPOSE 8080
ENTRYPOINT ["/usr/bin/node"]
CMD ["src/index.js"]
