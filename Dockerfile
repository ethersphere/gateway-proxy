FROM node:alpine

WORKDIR /usr/src/app

COPY package*.json .
COPY tsconfig.json .
COPY src src
COPY public public

RUN npm install

EXPOSE 4000

RUN mkdir /usr/src/config

CMD [ "node", "dist/index.js", "/usr/src/config/config.yaml" ]

