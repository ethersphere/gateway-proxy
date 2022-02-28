FROM node:lts-bullseye-slim as base

WORKDIR /app

COPY . .

RUN npm ci

RUN npm run build

FROM node:lts-bullseye-slim

WORKDIR /app
COPY --from=base --chown=nobody:nogroup /app/dist dist
COPY --from=base --chown=nobody:nogroup /app/public public
COPY --from=base --chown=nobody:nogroup /app/node_modules node_modules
USER nobody
EXPOSE 3000

ENTRYPOINT [ "node", "dist/index.js"]
