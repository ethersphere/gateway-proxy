export interface PostageStamps {
  POSTAGE_STAMP?: string

  // Not implemented yet
  POSTAGE_DEPTH?: string
  POSTAGE_AMOUNT?: string
  POSTAGE_USAGE?: number
}

/**
 * Get postage stamp that should be replaced in a the proxy request header
 *
 * @throws Error if could not find suitable postage stamp
 */
export function getPostageStamp({ POSTAGE_STAMP }: PostageStamps = {}): string {
  const stamp = POSTAGE_STAMP

  if (stamp) return stamp

  throw new Error('No postage stamp')
}

/**
 * Return true if the proxy should replace the postage stamp header
 */
export function shouldReplaceStamp({ POSTAGE_STAMP }: PostageStamps = {}): boolean {
  return Boolean(POSTAGE_STAMP)
}
