# Changelog

### [0.5.1](https://www.github.com/ethersphere/gateway-proxy/compare/v0.5.0...v0.5.1) (2022-03-23)


### Bug Fixes

* stamp purchase metric and add failed to purchase metric ([#163](https://www.github.com/ethersphere/gateway-proxy/issues/163)) ([88f42a1](https://www.github.com/ethersphere/gateway-proxy/commit/88f42a193f0ac372e844d3a8cb000e4c2a0bcf7b))

## [0.5.0](https://www.github.com/ethersphere/gateway-proxy/compare/v0.4.1...v0.5.0) (2022-03-11)


### Features

* remove swarm-pin header on the proxy requests ([#150](https://www.github.com/ethersphere/gateway-proxy/issues/150)) ([c5a57fc](https://www.github.com/ethersphere/gateway-proxy/commit/c5a57fcdf12bca7571072aa6e1fc128209fd0aaf))


### Bug Fixes

* get postage stamp on each request ([#156](https://www.github.com/ethersphere/gateway-proxy/issues/156)) ([ac68754](https://www.github.com/ethersphere/gateway-proxy/commit/ac6875447c2c297ab8942b8debcab9f369b2d87d))
* multiple stamps being purchased at the same time and metrics ([#157](https://www.github.com/ethersphere/gateway-proxy/issues/157)) ([fa4b1b9](https://www.github.com/ethersphere/gateway-proxy/commit/fa4b1b9132027893b5e9bd04d76f6da57d217b39))
* return 503 error when there is no valid postage stamp to use ([#160](https://www.github.com/ethersphere/gateway-proxy/issues/160)) ([0d0c656](https://www.github.com/ethersphere/gateway-proxy/commit/0d0c65635a0540a787bf72ffb4073b22c2517ded))

### [0.4.1](https://www.github.com/ethersphere/gateway-proxy/compare/v0.4.0...v0.4.1) (2022-02-28)


### Bug Fixes

* add public folder to docker image ([#130](https://www.github.com/ethersphere/gateway-proxy/issues/130)) ([59171b1](https://www.github.com/ethersphere/gateway-proxy/commit/59171b107e655a91c5d39f6b8df006e00616db65))
* docker image name typo ([#124](https://www.github.com/ethersphere/gateway-proxy/issues/124)) ([35f6955](https://www.github.com/ethersphere/gateway-proxy/commit/35f6955dc5b7021f393abcbd9878fb459d1abc85))

## [0.4.0](https://www.github.com/ethersphere/gateway-proxy/compare/v0.3.0...v0.4.0) (2022-02-17)


### Features

* add bytes, chunks, feeds and soc endpoints ([#110](https://www.github.com/ethersphere/gateway-proxy/issues/110)) ([aba5c1e](https://www.github.com/ethersphere/gateway-proxy/commit/aba5c1e361b607f158c663d7566d74db3b14e771))
* add prometheus metrics ([#112](https://www.github.com/ethersphere/gateway-proxy/issues/112)) ([e4dd39c](https://www.github.com/ethersphere/gateway-proxy/commit/e4dd39cd6713a7b030371f93eb9d397e98c4a0fe))

## [0.3.0](https://www.github.com/ethersphere/gateway-proxy/compare/v0.2.0...v0.3.0) (2022-02-09)


### Features

* cookie domain rewrite ([#107](https://www.github.com/ethersphere/gateway-proxy/issues/107)) ([009cdd2](https://www.github.com/ethersphere/gateway-proxy/commit/009cdd2fedc77b78e50b37324839641219693922))

## [0.2.0](https://www.github.com/ethersphere/gateway-proxy/compare/v0.1.0...v0.2.0) (2021-12-21)


### Features

* website with design ([#62](https://www.github.com/ethersphere/gateway-proxy/issues/62)) ([ca1430a](https://www.github.com/ethersphere/gateway-proxy/commit/ca1430ae47a3c30d486278fe9756fc866f9a94a8))

## 0.1.0 (2021-12-16)


### Features

* add bytes endpoint and bzz/hash/<path> ([#11](https://www.github.com/ethersphere/gateway-proxy/issues/11)) ([02f70c2](https://www.github.com/ethersphere/gateway-proxy/commit/02f70c23b90ab5e918d4fb70a7de7c14f8a129fa))
* add docker file ([#15](https://www.github.com/ethersphere/gateway-proxy/issues/15)) ([54cfcbc](https://www.github.com/ethersphere/gateway-proxy/commit/54cfcbc4d50597e20c44c22ed92baee96d51042b))
* autobuy postage stamps ([#20](https://www.github.com/ethersphere/gateway-proxy/issues/20)) ([9ff9252](https://www.github.com/ethersphere/gateway-proxy/commit/9ff9252ecfbb7a0760adcb6f8b0dbd844f3050fd))
* bzz.link support ([#58](https://www.github.com/ethersphere/gateway-proxy/issues/58)) ([cb26b78](https://www.github.com/ethersphere/gateway-proxy/commit/cb26b789f67534498d5b46cae021a30f4ae9995e))
* hardcoded postage stamp ([#12](https://www.github.com/ethersphere/gateway-proxy/issues/12)) ([a423fa1](https://www.github.com/ethersphere/gateway-proxy/commit/a423fa1dede8f8a1f1682f93dc3c29f518f2aa4b))
* homepage support ([#61](https://www.github.com/ethersphere/gateway-proxy/issues/61)) ([89853c5](https://www.github.com/ethersphere/gateway-proxy/commit/89853c5a77042d69c5262f5848ccfec379d59865))
* logging ([#32](https://www.github.com/ethersphere/gateway-proxy/issues/32)) ([ff76ef0](https://www.github.com/ethersphere/gateway-proxy/commit/ff76ef0ea781ef74e445af4e251513426f1a08a8))
* proxy server to bee with simple authentiction ([#5](https://www.github.com/ethersphere/gateway-proxy/issues/5)) ([6c0d3c2](https://www.github.com/ethersphere/gateway-proxy/commit/6c0d3c2a00d624e348fadbd736d50b58d47fb7c9))
* use default logger for hpm component logging ([#43](https://www.github.com/ethersphere/gateway-proxy/issues/43)) ([da6738e](https://www.github.com/ethersphere/gateway-proxy/commit/da6738ebaf76afbc0e9488816ae64ff335a90037))


### Bug Fixes

* increase default usable timeout ([#41](https://www.github.com/ethersphere/gateway-proxy/issues/41)) ([32f20ea](https://www.github.com/ethersphere/gateway-proxy/commit/32f20eae7e60b14d6433c482b8d88c77a210c3a8))
