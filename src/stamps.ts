export interface Headers {
  headers: { [header: string]: string } | undefined
}

export function getPostageStamp(): Headers | undefined {
  const stamp = process.env.POSTAGE_STAMP

  if (stamp) return { headers: { 'swarm-postage-batch-id': stamp } }
}
