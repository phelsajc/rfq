import { get, set } from 'idb-keyval'
import { normalizeRfq } from './rfqDefaults'

const RFQ_KEY = 'rfq-jayobo-8kw-v2'
const LEGACY_KEY = 'rfq-jayobo-8kw'

export async function loadRfq() {
  const current = await get(RFQ_KEY)
  if (current) return normalizeRfq(current)

  const legacy = await get(LEGACY_KEY)
  if (legacy) return normalizeRfq(legacy)

  return null
}

export async function saveRfq(rfq) {
  await set(RFQ_KEY, rfq)
}
