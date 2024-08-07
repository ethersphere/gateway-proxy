# gateway-proxy

[![Tests](https://github.com/ethersphere/gateway-proxy/actions/workflows/tests.yaml/badge.svg)](https://github.com/ethersphere/gateway-proxy/actions/workflows/tests.yaml)
[![Dependency Status](https://david-dm.org/ethersphere/gateway-proxy.svg?style=flat-square)](https://david-dm.org/ethersphere/gateway-proxy)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fethersphere%2Fgateway-proxy.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fethersphere%2Fgateway-proxy?ref=badge_shield)
[![](https://img.shields.io/badge/made%20by-Swarm-blue.svg?style=flat-square)](https://swarm.ethereum.org/)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D6.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D12.0.0-orange.svg?style=flat-square)

> Proxy to you bee node which aims to work as a public or personal gateway or to be used in CI for uploading to Swarm.

**Warning: This project is in beta state. There might (and most probably will) be changes in the future to its API and
working. Also, no guarantees can be made about its stability, efficiency, and security at this stage.**

This project is intended to be used with
**Bee&nbsp;version&nbsp;<!-- SUPPORTED_BEE_START -->1.7.0-bbf13011<!-- SUPPORTED_BEE_END -->**. Using it with older or
newer Bee versions is not recommended and may not work. Stay up to date by joining the
[official Discord](https://discord.gg/GU22h2utj6) and by keeping an eye on the
[releases tab](https://github.com/ethersphere/gateway-proxy/releases).

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Bzz.link support](#bzzlink-support)
  - [Examples](#examples)
    - [1. No postage stamp](#1-no-postage-stamp)
    - [2. Hardcoded postage stamp](#2-hardcoded-postage-stamp)
    - [3. Autobuy postage stamps](#3-autobuy-postage-stamps)
    - [4. Extends stamps TTL](#4-extends-stamps-ttl)
    - [Enable authentication](#enable-authentication)
  - [Environment variables](#environment-variables)
  - [Curl](#curl)
- [API](#api)
- [Maintainers](#maintainers)
- [License](#license)

## Install

```sh
git clone https://github.com/ethersphere/gateway-proxy.git
cd gateway-proxy
```

## Usage

The proxy can manage postage stamps for you in 4 modes of operation:

1. It can just proxy requests without manipulating the request
2. It can add/replace the request postage stamp with one provided through environment variable `POSTAGE_STAMP`
3. It can add/replace the request postage stamp with an auto-bought stamp or existing stamp that fulfils the amount,
   depth and is not too full or about to expire. To enable this, provide at minimum `POSTAGE_DEPTH` and
   `POSTAGE_AMOUNT`.
4. It can extend the TTL of a stamp that is about to expire. To enable this, set `POSTAGE_EXTENDSTTL=true`, provide
   `POSTAGE_AMOUNT`, `POSTAGE_DEPTH` with the desired amount to use and `POSTAGE_TTL_MIN` above with a number above or
   equal to 60.

In modes 1, 2 and 3, the proxy can be configured to require authentication secret to forward the requests. Use the
`AUTH_SECRET` environment variable to enable it.

### Bzz.link support

Gateway proxy has support for Bzz.link which allows translating
[Swarm CIDs](https://github.com/ethersphere/swarm-cid-js) and ENS names placed under subdomains into `/bzz` call. This
allows to have better security model for your web applications.

In order to use Bzz.link, set the `HOSTNAME` environment variable, and either or both of `CID_SUBDOMAINS` and
`ENS_SUBDOMAINS` according to your requirements. You may also need to set up DNS with wildcard subdomain support.

### Reupload pinned content

It can reupload existing pinned content that appear as not retrievable. To enable this, provide `REAUPLOAD_PERIOD` with
the miliseconds that represent the time to periodicaly check pinned content status.

### Examples

#### 1. No postage stamp

```sh
npm run start
```

#### 2. Hardcoded postage stamp

```sh
export POSTAGE_STAMP=f1e4ff753ea1cb923269ed0cda909d13a10d624719edf261e196584e9e764e50

npm run start
```

#### 3. Autobuy postage stamps

```sh
export POSTAGE_DEPTH=20
export POSTAGE_AMOUNT=414720000
export POSTAGE_TTL_MIN=60

npm run start
```

#### 4. Extends stamps TTL

```sh
export POSTAGE_EXTENDSTTL=true
export POSTAGE_TTL_MIN=60
export POSTAGE_DEPTH=20
export POSTAGE_AMOUNT=414720000

npm run start
```

#### Reupload pinned content

```sh
export REUPLOAD_PERIOD=30000

npm run start
```

#### Enable authentication

```sh
export AUTH_SECRET="this_is_some_secret_string"

npm run start
```

### Environment variables

| Name                    | Default Value                                                    | Description                                                                                                                                                                 |
| ----------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BEE_API_URL             | http://localhost:1633                                            | URL of the Bee node API                                                                                                                                                     |
| AUTH_SECRET             | undefined                                                        | Authentication secret, disabled if not set (this secret is checked in the request header `authorization`).                                                                  |
| SOFT_AUTH               | false                                                            | Only POST requests require authentication.                                                                                                                                  |
| HOSTNAME                | localhost                                                        | Hostname of the proxy. Required for Bzz.link support.                                                                                                                       |
| PORT                    | 3000                                                             | Port of the proxy.                                                                                                                                                          |
| POSTAGE_STAMP           | undefined                                                        | Postage stamp that should be used for all upload requests. If provided, the autobuy feature is disabled.                                                                    |
| POSTAGE_DEPTH           | undefined                                                        | Postage stamp depth to be used when buying new stamps or selecting existing stamps.                                                                                         |
| POSTAGE_AMOUNT          | undefined                                                        | Postage stamp amount to be used when buying new stamps or selecting existing stamps.                                                                                        |
| POSTAGE_USAGE_THRESHOLD | 0.7                                                              | Usage percentage at which new postage stamp will be bought (value between 0 and 1).                                                                                         |
| POSTAGE_USAGE_MAX       | 0.9                                                              | Usage percentage at which existing postage stamp should not be considered viable ( values 0 to 1).                                                                          |
| POSTAGE_TTL_MIN         | `autobuy`: 5 \* POSTAGE_REFRESH_PERIOD. `extends TTL`: undefined | In `autobuy`, Minimal time to live for the postage stamps to still be considered for upload (in seconds). In `extends TTL` is mandatory and required to be above 60 seconds |
| POSTAGE_REFRESH_PERIOD  | 60                                                               | How frequently are the postage stamps checked in seconds.                                                                                                                   |
| CID_SUBDOMAINS          | false                                                            | Enables Bzz.link subdomain translation functionality for CIDs.                                                                                                              |
| ENS_SUBDOMAINS          | false                                                            | Enables Bzz.link subdomain translation functionality for ENS.                                                                                                               |
| REMOVE_PIN_HEADER       | true                                                             | Removes swarm-pin header on all proxy requests.                                                                                                                             |
| `LOG_LEVEL`             | info                                                             | Log level that is outputted (values: `critical`, `error`, `warn`, `info`, `verbose`, `debug`)                                                                               |
| POSTAGE_EXTENDSTTL      | false                                                            | Enables extends TTL feature. Works along with POSTAGE_AMOUNT                                                                                                                |
| EXPOSE_HASHED_IDENTITY  | false                                                            | Exposes `x-bee-node` header, which is the hashed identity of the Bee node for identification purposes                                                                       |
| REUPLOAD_PERIOD         | undefined                                                        | How frequently are the pinned content checked to be reuploaded.                                                                                                             |
| HOMEPAGE                | undefined                                                        | Swarm hash that loads as the homepage of gateway-proxy                                                                                                                      |
| REMAP                   | undefined                                                        | Semicolon separated `name=hash` values to rewrite Swarm hashes to human-friendly names                                                                                      |
| ALLOWLIST               | undefined                                                        | Comma separated list of hashes, ENS domains or CIDs to allow                                                                                                                |
| ALLOW_USER_AGENTS       | undefined                                                        | Comma separated list of user-agent substrings to give unlimited access to                                                                                                   |
| POST_SIZE_LIMIT         | 1gb                                                              | Maximum size of the POST request body in bytes.                                                                                                                             |

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

| Endpoint                    | Response code     | Response text                                                                                                           |
| --------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `GET /health`               | `200`             | `OK`                                                                                                                    |
|                             | `403`             | `Forbidden`                                                                                                             |
| `GET /readiness`            | `200`             | `OK`                                                                                                                    |
|                             | `403`             | `Forbidden`                                                                                                             |
|                             | `502`             | `Bad Gateway` when can not connect to Bee node                                                                          |
| `GET /bzz/:swarmhash`       | `200`, `403`, ... | See official [bee documentation](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz~1{reference}/get)                   |
| `POST /bzz`                 | `201`, `403`, ... | See official [bee documentation](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)                               |
| `GET /bytes/:swarmhash`     | `200`, `403`, ... | See official [bee documentation](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes~1{reference}/get)               |
| `POST /bytes`               | `201`, `403`, ... | See official [bee documentation](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes/post)                           |
| `GET /chunks/:swarmhash`    | `200`, `403`, ... | See official [bee documentation](https://docs.ethswarm.org/api/#tag/Chunk/paths/~1chunks~1{reference}/get)              |
| `POST /chunks`              | `201`, `403`, ... | See official [bee documentation](https://docs.ethswarm.org/api/#tag/Chunk/paths/~1chunks/post)                          |
| `POST /soc/:owner/:id`      | `201`, `403`, ... | See official [bee documentation](https://docs.ethswarm.org/api/#tag/Single-owner-chunk/paths/~1soc~1{owner}~1{id}/post) |
| `GET /feeds/:owner/:topic`  | `200`, `403`, ... | See official [bee documentation](https://docs.ethswarm.org/api/#tag/Feed/paths/~1feeds~1{owner}~1{topic}/get)           |
| `POST /feeds/:owner/:topic` | `201`, `403`, ... | See official [bee documentation](https://docs.ethswarm.org/api/#tag/Feed/paths/~1feeds~1{owner}~1{topic}/post)          |

## Contribute

There are some ways you can make this module better:

- Consult our [open issues](https://github.com/ethersphere/gateway-proxy/issues) and take on one of them
- Help our tests reach 100% coverage!
- Join us in our [Discord chat](https://discord.gg/wdghaQsGq5) in the #develop-on-swarm channel if you have questions or
  want to give feedback

### Local development with Bzz.link

Local development with the subdomain Bzz.link support is a bit more tricky as it requires to have a way how to direct
local subdomains to given URL.

Easy way is to have one testing CID that you will put directly to `/etc/hosts` and use only that for testing.

```
bah5acgzamh5fl7emnrazttpy7sag6utq5myidv3venspn6l5sevr4lko2n3q.localhost 127.0.0.1
```

If you want fully functional setup than you have to locally install some DNS client that will provide you this
functionality. See for example [here](https://serverfault.com/a/118589) for `dnsmasq` solution.

## Maintainers

- [Cafe137](https://github.com/Cafe137)

## License

[BSD-3-Clause](./LICENSE)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fethersphere%2Fgateway-proxy.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fethersphere%2Fgateway-proxy?ref=badge_large)
