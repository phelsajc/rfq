import { get, set } from 'idb-keyval'
import { normalizeRfq } from './rfqDefaults'

/** v3 uses PDF-matched seeds; older keys are ignored so Reset/fresh load applies. */
const RFQ_KEY = 'rfq-jayobo-8kw-v3'

export async function loadRfq() {
  const current = await get(RFQ_KEY)
  if (current) return normalizeRfq(current)
  return null
}

export async function saveRfq(rfq) {
  await set(RFQ_KEY, rfq)
}
