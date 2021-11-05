FROM node:lts

WORKDIR /usr/src/app

COPY . .

RUN npm ci

RUN npm run build

EXPOSE 3000

ENTRYPOINT [ "node", "dist/index.js"]
