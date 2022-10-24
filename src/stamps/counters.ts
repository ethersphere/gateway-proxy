import client from 'prom-client'
import { register } from '../metrics'

export const stampPurchaseCounter = new client.Counter({
  name: 'stamp_purchase_counter',
  help: 'How many stamps were purchased',
})
register.registerMetric(stampPurchaseCounter)

export const stampCheckCounter = new client.Counter({
  name: 'stamp_check_counter',
  help: 'How many times were stamps retrieved from server',
})
register.registerMetric(stampCheckCounter)

export const stampGetCounter = new client.Counter({
  name: 'stamp_get_counter',
  help: 'How many times was get postageStamp called',
})
register.registerMetric(stampGetCounter)

export const stampGetErrorCounter = new client.Counter({
  name: 'stamp_get_error_counter',
  help: 'How many times was get postageStamp called and there was no valid postage stamp',
})
register.registerMetric(stampGetErrorCounter)

export const stampPurchaseFailedCounter = new client.Counter({
  name: 'stamp_purchase_failed_counter',
  help: 'How many stamps failed to be purchased',
})
register.registerMetric(stampPurchaseFailedCounter)

export const stampTtlGauge = new client.Gauge({
  name: 'stamp_ttl_gauge',
  help: 'TTL on the selected automanaged stamp',
})
register.registerMetric(stampTtlGauge)

export const stampUsageGauge = new client.Gauge({
  name: 'stamp_usage_gauge',
  help: 'Usage on the selected automanaged stamp',
})
register.registerMetric(stampUsageGauge)

export const stampUsableCountGauge = new client.Gauge({
  name: 'stamp_usable_count_gauge',
  help: 'How many stamps exist on the bee node that can be used',
})
register.registerMetric(stampUsableCountGauge)
