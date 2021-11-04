export function getPostageStamp(): string {
  const stamp = process.env.POSTAGE_STAMP

  if (stamp) return stamp

  throw new Error('No postage stamp')
}

export function shouldReplaceStamp(): boolean {
  return Boolean(process.env.POSTAGE_STAMP)
}
