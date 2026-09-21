export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function calcAmount(qty, unitPrice) {
  const q = Number(qty) || 0
  const p = Number(unitPrice) || 0
  return Math.round(q * p * 100) / 100
}

export const CATEGORY_DEFS = [
  { id: 'materials', title: 'MATERIAL COST' },
  { id: 'roughing', title: 'ROUGHING-IN & CONSUMABLE MAT' },
  { id: 'labor', title: 'LABOR & SUPERVISION' },
]

export function emptyItem() {
  return {
    id: createId(),
    description: '',
    qty: 1,
    unit: 'pc',
    unitPrice: 0,
    amount: 0,
  }
}

function emptyCategories() {
  return CATEGORY_DEFS.map((cat) => ({
    id: cat.id,
    title: cat.title,
    items: [],
  }))
}

export const PAYMENT_DEFS = [
  { id: 'downpayment', field: 'downpaymentPercent', title: 'Downpayment' },
  {
    id: 'completion',
    field: 'completionPercent',
    title: 'Upon Project Completion',
  },
  { id: 'retention', field: 'retentionPercent', title: 'Retention' },
]

function readPercent(value) {
  if (value === '' || value == null) return 0
  return Number(value) || 0
}

/** Fresh RFQ: three categories, no prefilled items — add as needed. */
export function createDefaultRfq() {
  return {
    id: createId(),
    title: '8kW Hybrid System — Jayobo',
    customer: '',
    preparedBy: '',
    date: new Date().toISOString().slice(0, 10),
    notes:
      'Prices in PHP. Add items under each category as needed. One row can hold a multi-line package list. Amount = Qty × Unit Price. Overall Total Package Cost = sum of all categories. Payment amounts = Overall × (payment % ÷ 100).',
    downpaymentPercent: 0,
    completionPercent: 0,
    retentionPercent: 0,
    categories: emptyCategories(),
    updatedAt: new Date().toISOString(),
  }
}

/** Ensure loaded data has the 3-category shape (migrates older flat `items`). */
export function normalizeRfq(data) {
  if (!data) return createDefaultRfq()

  const { packagePercent: _dropPackage, ...withoutPackage } = data

  const paymentFields = {
    downpaymentPercent: readPercent(data.downpaymentPercent),
    completionPercent: readPercent(data.completionPercent),
    retentionPercent: readPercent(data.retentionPercent),
  }

  if (Array.isArray(data.categories) && data.categories.length) {
    const byId = Object.fromEntries(data.categories.map((c) => [c.id, c]))
    return {
      ...withoutPackage,
      ...paymentFields,
      categories: CATEGORY_DEFS.map((def) => {
        const existing = byId[def.id]
        return {
          id: def.id,
          title: def.title,
          items: Array.isArray(existing?.items) ? existing.items : [],
        }
      }),
    }
  }

  // Old single-list format → put under Material Cost
  if (Array.isArray(data.items)) {
    const categories = emptyCategories()
    categories[0].items = data.items
    const { items: _drop, packagePercent: _dropPct, ...rest } = data
    return {
      ...rest,
      ...paymentFields,
      categories,
    }
  }

  return createDefaultRfq()
}

export function categoryTotal(category) {
  return (category?.items || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
}

export function grandTotal(rfq) {
  return (rfq?.categories || []).reduce((sum, cat) => sum + categoryTotal(cat), 0)
}

/** Overall Total Package Cost = sum of all category totals (no markup). */
export function overallPackageCost(rfq) {
  return grandTotal(rfq)
}

export function paymentAmount(overall, percent) {
  return Math.round(overall * ((Number(percent) || 0) / 100) * 100) / 100
}

export function paymentSchedule(rfq) {
  const overall = overallPackageCost(rfq)
  const rows = PAYMENT_DEFS.map((def) => {
    const percent = Number(rfq?.[def.field]) || 0
    return {
      ...def,
      percent,
      amount: paymentAmount(overall, percent),
    }
  })
  const percentSum = rows.reduce((sum, row) => sum + row.percent, 0)
  const amountSum = rows.reduce((sum, row) => sum + row.amount, 0)
  return {
    overall,
    rows,
    percentSum: Math.round(percentSum * 100) / 100,
    amountSum: Math.round(amountSum * 100) / 100,
    isComplete: Math.abs(percentSum - 100) < 0.001,
  }
}
