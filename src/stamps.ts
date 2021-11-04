export interface PostageStamps {
  POSTAGE_STAMP?: string

  // Not implemented yet
  POSTAGE_DEPTH?: string
  POSTAGE_AMOUNT?: string
  POSTAGE_USAGE?: number
}

export function getPostageStamp({ POSTAGE_STAMP }: PostageStamps = {}): string {
  const stamp = POSTAGE_STAMP

  if (stamp) return stamp

  throw new Error('No postage stamp')
}

export function shouldReplaceStamp({ POSTAGE_STAMP }: PostageStamps = {}): boolean {
  return Boolean(POSTAGE_STAMP)
}
