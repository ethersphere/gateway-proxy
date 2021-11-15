# gateway-proxy

[![Tests](https://github.com/ethersphere/gateway-proxy/actions/workflows/tests.yaml/badge.svg)](https://github.com/ethersphere/gateway-proxy/actions/workflows/tests.yaml)
[![Dependency Status](https://david-dm.org/ethersphere/gateway-proxy.svg?style=flat-square)](https://david-dm.org/ethersphere/gateway-proxy)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fethersphere%2Fgateway-proxy.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fethersphere%2Fgateway-proxy?ref=badge_shield)
[![](https://img.shields.io/badge/made%20by-Swarm-blue.svg?style=flat-square)](https://swarm.ethereum.org/)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D6.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D12.0.0-orange.svg?style=flat-square)

> Proxy to you bee node which aims to work as a personal gateway or to be used in CI for uploading to Swarm.

**Warning: This project is in beta state. There might (and most probably will) be changes in the future to its API and
working. Also, no guarantees can be made about its stability, efficiency, and security at this stage.**

This project is intended to be used with
**Bee&nbsp;version&nbsp;<!-- SUPPORTED_BEE_START -->1.2.0-29eb9414<!-- SUPPORTED_BEE_END -->**. Using it with older or
newer Bee versions is not recommended and may not work. Stay up to date by joining the [official Discord](https://discord.gg/GU22h2utj6) and by
keeping an eye on the [releases tab](https://github.com/ethersphere/gateway-proxy/releases).

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Maintainers](#maintainers)
- [License](#license)

## Install

```sh
git clone https://github.com/ethersphere/gateway-proxy.git
cd gateway-proxy
```

## Usage

```sh
export AUTH_SECRET="this_is_some_secret_string"

npm run start
```

| Name                    | Default Value               | Description                                                                                             |
| ----------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| BEE_API_URL             | http://localhost:1633       | URL of the Bee node API                                                                                 |
| AUTH_SECRET             | undefined                   | Authentication secret, disabled if not set                                                              |
| HOST                    | 127.0.0.1                   | Hostname of the proxy                                                                                   |
| PORT                    | 3000                        | Port of the proxy                                                                                       |
| POSTAGE_STAMP           | undefined                   | Postage stamp that should be used for all upload requests. If provided, the autobuy feature is disabled |
| POSTAGE_DEPTH           | undefined                   | Postage stamp depth to be used when buying new stamps or selecting existing stamps                      |
| POSTAGE_AMOUNT          | undefined                   | Postage stamp amount to be used when buying new stamps or selecting existing stamps                     |
| POSTAGE_USAGE_THRESHOLD | 0.7                         | Utilization percentage at which new postage stamp will be bought (value between 0 and 1)                |
| POSTAGE_USAGE_MAX       | 0.9                         | Utilization percentage at which existing postage stamp should not be considered viable ( values 0 to 1) |
| POSTAGE_TTL_MIN         | 5 \* POSTAGE_REFRESH_PERIOD | Minimal time to live for the postage stamps to still be considered for upload (in seconds)              |
| POSTAGE_REFRESH_PERIOD  | 60                          | How frequently are the postage stamps checked in seconds                                                |

### Curl

Upload a file

```sh
curl \
  -X POST http://localhost:3000/bzz \
  -H "Accept: application/json, text/plain, */*" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "swarm-postage-batch-id: f1e4ff753ea1cb923269ed0cda909d13a10d624719edf261e196584e9e764e50" \
  -H "authorization: this_is_some_secret_string"
```

```sh
{"reference":"a30e9c3ecbe68450924b20a7d46f745fa04289f7381826bdd51289aee4ad32f6"}
```

Download

```sh
curl \
  -L http://localhost:3000/bzz/a30e9c3ecbe68450924b20a7d46f745fa04289f7381826bdd51289aee4ad32f6 \
  -H "authorization: this_is_some_secret_string" \
  --output -
```

## API

| Endpoint                | Response code     | Response text                                                                                             |
| ----------------------- | ----------------- | --------------------------------------------------------------------------------------------------------- |
| `GET /health`           | `200`             | `OK`                                                                                                      |
|                         | `403`             | `Forbidden`                                                                                               |
| `GET /readiness`        | `200`             | `OK`                                                                                                      |
|                         | `403`             | `Forbidden`                                                                                               |
|                         | `502`             | `Bad Gateway` when can not connect to Bee node                                                            |
| `GET /bzz/:swarmhash`   | `200`, `403`, ... | See official [bee documentation](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz~1{reference}/get)     |
| `POST /bzz`             | `201`, `403`, ... | See official [bee documentation](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)                 |
| `GET /bytes/:swarmhash` | `200`, `403`, ... | See official [bee documentation](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes~1{reference}/get) |

## Contribute

There are some ways you can make this module better:

- Consult our [open issues](https://github.com/ethersphere/gateway-proxy/issues) and take on one of them
- Help our tests reach 100% coverage!
- Join us in our [Discord chat](https://discord.gg/wdghaQsGq5) in the #develop-on-swarm channel if you have questions or
  want to give feedback

## Maintainers

- [vojtechsimetka](https://github.com/vojtechsimetka)
- [auhau](https://github.com/auhau)

## License

[BSD-3-Clause](./LICENSE)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fethersphere%2Fgateway-proxy.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fethersphere%2Fgateway-proxy?ref=badge_large)
