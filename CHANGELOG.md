# Changelog

## [0.16.0](https://www.github.com/ethersphere/gateway-proxy/compare/v0.15.0...v0.16.0) (2024-08-07)


### Features

* add gateway indicator endpoint ([#503](https://www.github.com/ethersphere/gateway-proxy/issues/503)) ([c716830](https://www.github.com/ethersphere/gateway-proxy/commit/c716830339211dc2a3a6361c5a59dba56ce5fe8c))
* add soft-auth and post-size-limit options ([#502](https://www.github.com/ethersphere/gateway-proxy/issues/502)) ([d957e40](https://www.github.com/ethersphere/gateway-proxy/commit/d957e403c351b7341f57848c698a80b1043e9856))


### Bug Fixes

* remove http headers that should not be proxied ([#504](https://www.github.com/ethersphere/gateway-proxy/issues/504)) ([2fd1b34](https://www.github.com/ethersphere/gateway-proxy/commit/2fd1b34084992774bc20c8239399e3149d70f3bf))

## [0.15.0](https://www.github.com/ethersphere/gateway-proxy/compare/v0.14.1...v0.15.0) (2024-06-18)


### Features

* merge api ([#497](https://www.github.com/ethersphere/gateway-proxy/issues/497)) ([60f71ac](https://www.github.com/ethersphere/gateway-proxy/commit/60f71acc73397bc35c53c240835adf42f58f18ba))


### Bug Fixes

* block invalid path ([#498](https://www.github.com/ethersphere/gateway-proxy/issues/498)) ([b6ff4ae](https://www.github.com/ethersphere/gateway-proxy/commit/b6ff4ae865b0783aaa6ed9b7425286bca466c71f))

### [0.14.1](https://www.github.com/ethersphere/gateway-proxy/compare/v0.14.0...v0.14.1) (2024-05-01)


### Bug Fixes

* prevent crash on missing host ([#495](https://www.github.com/ethersphere/gateway-proxy/issues/495)) ([a45be61](https://www.github.com/ethersphere/gateway-proxy/commit/a45be61d5c87aabe17e23bc43813818227d18038))

## [0.14.0](https://www.github.com/ethersphere/gateway-proxy/compare/v0.13.0...v0.14.0) (2024-04-24)


### Features

* add html rewrite ([#494](https://www.github.com/ethersphere/gateway-proxy/issues/494)) ([2d3fa09](https://www.github.com/ethersphere/gateway-proxy/commit/2d3fa0989e35e72c649fc5efac0c44062c499f08))
* add user agent allowlist option ([#492](https://www.github.com/ethersphere/gateway-proxy/issues/492)) ([1986127](https://www.github.com/ethersphere/gateway-proxy/commit/1986127ff1fbcd5a6f0b5a403242fa5ce958d615))

## [0.13.0](https://www.github.com/ethersphere/gateway-proxy/compare/v0.12.0...v0.13.0) (2024-03-13)


### Features

* upgrade bee-js and http library ([#490](https://www.github.com/ethersphere/gateway-proxy/issues/490)) ([e0aef44](https://www.github.com/ethersphere/gateway-proxy/commit/e0aef44f8f04a822bdb5a2cf76c68b14730940cf))

## [0.12.0](https://www.github.com/ethersphere/gateway-proxy/compare/v0.11.0...v0.12.0) (2024-01-17)


### Features

* update bee-js ([#488](https://www.github.com/ethersphere/gateway-proxy/issues/488)) ([4965eb1](https://www.github.com/ethersphere/gateway-proxy/commit/4965eb139dfe0b373ef75498fd40959518e11ed2))

## [0.11.0](https://www.github.com/ethersphere/gateway-proxy/compare/v0.10.0...v0.11.0) (2023-12-28)


### Features

* add cid support in allowlist ([#486](https://www.github.com/ethersphere/gateway-proxy/issues/486)) ([75d16df](https://www.github.com/ethersphere/gateway-proxy/commit/75d16dfa13e4004711fe7bff03665d28d2a8a852))

## [0.10.0](https://www.github.com/ethersphere/gateway-proxy/compare/v0.9.3...v0.10.0) (2023-12-11)


### Features

* add address remapping ([#483](https://www.github.com/ethersphere/gateway-proxy/issues/483)) ([16b2941](https://www.github.com/ethersphere/gateway-proxy/commit/16b294115fbdc366fb87c1b46121648070fb02a5))

### [0.9.3](https://www.github.com/ethersphere/gateway-proxy/compare/v0.9.2...v0.9.3) (2023-11-09)


### Bug Fixes

* apply allowlist to htm extension ([#481](https://www.github.com/ethersphere/gateway-proxy/issues/481)) ([cb1d341](https://www.github.com/ethersphere/gateway-proxy/commit/cb1d3418fb07b2a2fc784f18a167afe629983cc6))

### [0.9.2](https://www.github.com/ethersphere/gateway-proxy/compare/v0.9.1...v0.9.2) (2023-11-06)


### Bug Fixes

* do not crash when there are no stamps ([#478](https://www.github.com/ethersphere/gateway-proxy/issues/478)) ([367131a](https://www.github.com/ethersphere/gateway-proxy/commit/367131a6226f8bf16c12130d3fedc111bd13d3e2))

### [0.9.1](https://www.github.com/ethersphere/gateway-proxy/compare/v0.9.0...v0.9.1) (2023-10-30)


### Bug Fixes

* do not hit circular reference when logging ([#476](https://www.github.com/ethersphere/gateway-proxy/issues/476)) ([2f41984](https://www.github.com/ethersphere/gateway-proxy/commit/2f41984b88404b615ed97b2b017e225b19c9cff5))

## [0.9.0](https://www.github.com/ethersphere/gateway-proxy/compare/v0.8.0...v0.9.0) (2023-10-30)


### Features

* make readiness check chunks opt-in ([#473](https://www.github.com/ethersphere/gateway-proxy/issues/473)) ([208ffb9](https://www.github.com/ethersphere/gateway-proxy/commit/208ffb9a782e9960ae70baf24b02a8182eeca306))


### Bug Fixes

* do not log buffer ([#472](https://www.github.com/ethersphere/gateway-proxy/issues/472)) ([7a8e0fa](https://www.github.com/ethersphere/gateway-proxy/commit/7a8e0fa2bdb65569c01d2d7fd16bbc141d6d993d))

## [0.8.0](https://www.github.com/ethersphere/gateway-proxy/compare/v0.7.0...v0.8.0) (2023-10-30)


### Features

* add more control over proxying ([#468](https://www.github.com/ethersphere/gateway-proxy/issues/468)) ([0923d87](https://www.github.com/ethersphere/gateway-proxy/commit/0923d87ca91ae4289954b7bb253c2c163c073084))

## [0.7.0](https://www.github.com/ethersphere/gateway-proxy/compare/v0.6.0...v0.7.0) (2023-08-23)


### Features

* upgrade bee-js to 6.2.0 ([#464](https://www.github.com/ethersphere/gateway-proxy/issues/464)) ([eeaf768](https://www.github.com/ethersphere/gateway-proxy/commit/eeaf768fffd69560c01c433a5561184e9fe6c12b))


### Bug Fixes

* add missing sleep in wait for stamp usable ([#382](https://www.github.com/ethersphere/gateway-proxy/issues/382)) ([cf2002a](https://www.github.com/ethersphere/gateway-proxy/commit/cf2002a8836b0b8238a8946ab8b161fb5877618b))

## [0.6.0](https://www.github.com/ethersphere/gateway-proxy/compare/v0.5.1...v0.6.0) (2022-10-10)


### Features

* add multilevel ens subdomain support ([#328](https://www.github.com/ethersphere/gateway-proxy/issues/328)) ([17380cf](https://www.github.com/ethersphere/gateway-proxy/commit/17380cf86279446f481793f504071e4f9664c10a))
* add support for extending existing postage stamp TTL ([#329](https://www.github.com/ethersphere/gateway-proxy/issues/329)) ([276f260](https://www.github.com/ethersphere/gateway-proxy/commit/276f260b6d94991eaf718abaeead66564d3cd495))
* build and publish deb package for gateway-proxy ([#254](https://www.github.com/ethersphere/gateway-proxy/issues/254)) ([e28a18c](https://www.github.com/ethersphere/gateway-proxy/commit/e28a18ca8c4ef97ef446be3d20fb791c19905246))
* expose sha1 of bee overlay address in response header ([#294](https://www.github.com/ethersphere/gateway-proxy/issues/294)) ([b302cfb](https://www.github.com/ethersphere/gateway-proxy/commit/b302cfb62886a565207dba43c8a5a34135735590))
* print custom error when no stamp is available ([#365](https://www.github.com/ethersphere/gateway-proxy/issues/365)) ([e4cda76](https://www.github.com/ethersphere/gateway-proxy/commit/e4cda760aaa4f3f93c9bdcaacfa436bcf47a43f3))
* reupload pinned content periodically ([#340](https://www.github.com/ethersphere/gateway-proxy/issues/340)) ([de50873](https://www.github.com/ethersphere/gateway-proxy/commit/de50873bfedab66a187765b6a81d9a017fd0bd7e))
* upload chunk for readiness check ([#327](https://www.github.com/ethersphere/gateway-proxy/issues/327)) ([4e2e83a](https://www.github.com/ethersphere/gateway-proxy/commit/4e2e83af4646e30324a8fbe029aefe3d6d6dbed4))


### Bug Fixes

* add missing npm ci ([#257](https://www.github.com/ethersphere/gateway-proxy/issues/257)) ([6887382](https://www.github.com/ethersphere/gateway-proxy/commit/6887382cab83f8d64c84bad277a3d1035ce48002))
* disable reupload when not configured ([#367](https://www.github.com/ethersphere/gateway-proxy/issues/367)) ([#368](https://www.github.com/ethersphere/gateway-proxy/issues/368)) ([7bd74a5](https://www.github.com/ethersphere/gateway-proxy/commit/7bd74a583fd89089edd5dcd5c6d7aa5326f086c6))
* do not log readiness chunk request body ([#366](https://www.github.com/ethersphere/gateway-proxy/issues/366)) ([d19ae94](https://www.github.com/ethersphere/gateway-proxy/commit/d19ae94d435fee12a2af33cc521f63a15cf3e888))
* exception error handling on stamps manager ([#369](https://www.github.com/ethersphere/gateway-proxy/issues/369)) ([0934ae4](https://www.github.com/ethersphere/gateway-proxy/commit/0934ae48fc703bafa6c2ba60ef97bcc94fb6bbb0))
* fix content manager port and error handling ([#355](https://www.github.com/ethersphere/gateway-proxy/issues/355)) ([493ab33](https://www.github.com/ethersphere/gateway-proxy/commit/493ab33feac1d31728f1d17f7f7b1446bf9d31b7))
* proper usage of default bee urls ([#343](https://www.github.com/ethersphere/gateway-proxy/issues/343)) ([33db7d2](https://www.github.com/ethersphere/gateway-proxy/commit/33db7d2753c519bee84a05d8252df21b240c1b82))
* remove double logging buying new stamp ([#348](https://www.github.com/ethersphere/gateway-proxy/issues/348)) ([2d15bd9](https://www.github.com/ethersphere/gateway-proxy/commit/2d15bd9d0c48418ab54492095e56c8434e809b57))
* start server before stamp manager is ready ([#363](https://www.github.com/ethersphere/gateway-proxy/issues/363)) ([2e28ee3](https://www.github.com/ethersphere/gateway-proxy/commit/2e28ee328e9b73334bd4c2e287c1a19162b2841f))
* wait for stamp to be usable ([#375](https://www.github.com/ethersphere/gateway-proxy/issues/375)) ([1240b90](https://www.github.com/ethersphere/gateway-proxy/commit/1240b909ef13c3a40b951af626a30d3ca5938f73))
* working dir for systemd ([#261](https://www.github.com/ethersphere/gateway-proxy/issues/261)) ([3204e41](https://www.github.com/ethersphere/gateway-proxy/commit/3204e4166eeada5ed218bea05d613d17bce55d29))

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
