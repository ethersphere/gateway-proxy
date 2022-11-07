export const SAMPLE_SETTINGS_YAML = `# [Connection to the Bee node]

bee:
  api: http://localhost:1633
  debugApi: http://localhost:1635

# [Server settings]

server:
  port: 3000
  # Required for the bzz.link feature.
  # TODO: #1 Explain bzz.link feature
  # TODO: #2 Do we really need it? Can't we just rely on subdomains?
  hostname: localhost
  # Require authentication header for all requests.
  # This effectively makes the gateway private.
  #
  # May be left empty to disable authentication.
  authSecret: ''
  # Possible values: debug | info | warn | error
  logLevel: info

# [Stamp management]

# Periodically checks for valid stamps.
#
# A stamp is considered valid, when it has enough TTL, capacity
# and its amount and depth parameters match with this config.

stamp:
  # Run periodical automatic postage stamp management job this often.
  checkFrequency: 60s

  # Possible values: hardcoded | autobuy | autoextend
  # May be left empty to disable postage stamp management.
  mode: ''

  # [Hardcoded mode settings]

  hardcoded:
    # Always use this batch ID
    batchId: ''

  # [Autobuy mode settings]

  autobuy:
    # If there are no valid stamps, purchase one with the following amount and depth
    amount: 20k
    depth: 22
    # Trigger purchase when TTL is below this.
    ttlThreshold: 15m
    # Trigger purchase when usage is above this.
    usageThreshold: 70%

  # [Autoextend mode settings]

  autoextend:
    # If there are no stamps to extend, purchase one with the following amount and depth
    defaultAmount: 20k
    defaultDepth: 22
    # Enable diluting the postage stamp to increase its depth and therefor capacity
    extendCapacity: true
    # Enable topping up the postage stamp to increase its amount and therefor TTL
    extendTtl: true
    # Extend stamp by this amount
    extendAmount: 20k
    # Trigger topup when TTL is below this.
    ttlThreshold: 15m
    # Trigger dilution when usage is above this.
    usageThreshold: 70%

# [Content reupload]

# Periodically checks reachability of locally pinned content.
#
# Reuploads when cannot be reached over the network
# Uses the Bee stewardship API.
#
# May be used to ensure self-hosted content stays online.
#
# TODO: "self-hosted" is probably a wrong term here
contentReupload:
  enabled: false
  reuploadFrequency: 6h

# [Miscellaneous features]

# Enables resolving CIDs in place of Swarm hashes.
#
# e.g. http://bah5acgzaxtfhomziqdigaikb3cfnotehagiuzyprlr6w7uo7lhl3f6ngyq7a.localhost:3000
# will convert the CID to Swarm hash
cid: true

# Enables resolving ENS domains in place of Swarm hashes.
#
# e.g. http://swarm.localhost:3000 will find bzz:// content at swarm.eth
ens: true

# Adds 'x-bee-node' HTTP header to all responses, which
# exposes the hash of the Bee node overlay address.
#
# Useful for identifying individual Bee nodes in a cluster
# without exposing identity.
exposeHashedIdentity: false

# Removes swarm-pin HTTP header from requests, in order
# to avoid filling up disk space by public requests.
#
# Useful when running as a public gateway.
removePinHeader: true
`
