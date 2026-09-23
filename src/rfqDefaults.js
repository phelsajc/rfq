export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function calcAmount(qty, unitPrice) {
  const q = Number(qty) || 0
  const p = Number(unitPrice) || 0
  return Math.round(q * p * 100) / 100
}

export const CATEGORY_DEFS = [
  { id: 'materials', title: 'MATERIAL COST', roman: 'I' },
  { id: 'roughing', title: 'ROUGHING-IN & CONSUMABLE MAT', roman: 'II' },
  { id: 'labor', title: 'LABOR & SUPERVISION', roman: 'III' },
]

export const DEFAULT_WARRANTY = `Components Warranty and Performance:
2. GridTie/Hybrid Inverter - 5 Years Replacement Warranty
3. Lithium Battery - 5 Year Warranty replacement on parts
4. Workmanship and Safety Devices - 1 year warranty
Components delivered and installed with the following conditions.
- Provided that the Equipments / Components is not tampered or opened by any unauthorized person.
- Provided that the Equipments / Components is not being abused or misused.
- (Acts of God (e.g. Lightning, Storms, etc. is not covered by the Warranty)
Components delivered and installed with the following conditions.
- Unlimited Free Service Visits for Troubleshooting and Checkup
- 24 to 48 Hours response time for any reported defects/problems.`

export const DEFAULT_AGREEMENT = `Agreement
1. Repair works
2. Troubleshoots at site
3. Client Orientation
4. Re-arrangement of system in any other location, etc.
· Payment Mode: 50% Downpayment, 45% Upon Completion and Commissioning
· 5% Retention after Commissioning and Energization
· Start of the Project: 3 to 5 Working Days depend on the size after receipt of Signed Conforme
· Price Validity: 15 days.
· Vat Excluded
· Project Duration: 7-14 Days`

export const DEFAULT_TERMS = `Terms & Conditions:
1. Solar Modules - 10 Years replacement, Up to 12 years : 90% power output 2. Up to 25 years : 85% power output.
All equipment in above proposed solar power systems have longer service lives than guaranteed if operated under normal operating conditions. Nevertheless, the Service Level Agreement (SLA) may be signed between the Client & I that will cover all activities as per its requirements, for example:`

export const UNIT_OPTIONS = ['pc', 'unit', 'lot']

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

function seedItem({ description, qty = 1, unit = 'pc', unitPrice = 0 }) {
  const amount = calcAmount(qty, unitPrice)
  return {
    ...emptyItem(),
    description,
    qty,
    unit,
    unitPrice,
    amount,
  }
}

const DEFAULT_ROUGHING_DESCRIPTION = [
  'Roughing-In & Consumable Materials',
  '- Roof Mount railing set',
  '- DC and AC Breakers and Isolators',
  '- Surge Protection',
  '- DC Wiring and M4 Connectors',
  '- Conduit Piping',
  '- Pull Box',
  '- Utility Box',
  '- Wire harnessing',
  '- Supports and Brackets',
].join('\n')

const DEFAULT_LABOR_DESCRIPTION = [
  '- Engineering Cost and Supervision',
  '- Transportation',
  '- Net Metering',
].join('\n')

/** Seeded like sample PDF (total 630,800.00). */
const DEFAULT_CATEGORY_ITEMS = {
  materials: [
    {
      description: '650W AIKO ABC TECHNOLOGY Mono-Facial Panels',
      qty: 14,
      unit: 'pc',
      unitPrice: 24700,
    },
    {
      description: '8KW DEYE HYBRID INVERTER',
      qty: 1,
      unit: 'unit',
      unitPrice: 0,
    },
    {
      description: '314AH Lithium (LifeO4)',
      qty: 2,
      unit: 'unit',
      unitPrice: 125000,
    },
  ],
  roughing: [
    {
      description: DEFAULT_ROUGHING_DESCRIPTION,
      qty: 1,
      unit: 'lot',
      unitPrice: 0,
    },
  ],
  labor: [
    {
      description: DEFAULT_LABOR_DESCRIPTION,
      qty: 1,
      unit: 'lot',
      unitPrice: 35000,
    },
  ],
}

function emptyCategories() {
  return CATEGORY_DEFS.map((cat) => ({
    id: cat.id,
    title: cat.title,
    roman: cat.roman,
    items: [],
  }))
}

function seededCategories() {
  return CATEGORY_DEFS.map((cat) => ({
    id: cat.id,
    title: cat.title,
    roman: cat.roman,
    items: (DEFAULT_CATEGORY_ITEMS[cat.id] || []).map(seedItem),
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

/** Fresh RFQ shaped like the sample quotation PDF. */
export function createDefaultRfq() {
  return {
    id: createId(),
    title: 'SUPPLY & INSTALLATION OF 8KW HYBRID SYSTEM',
    customer: 'Rain Jayobo',
    location: 'Bacolod City',
    preparedBy: 'Jan Michael Guanzon',
    company: 'Jan Solar Energy Shop',
    date: '2026-07-06',
    intro:
      'We are pleased to SUPPLY & INSTALLATION PV SOLAR OF 8KW HYBRID SYSTEM',
    notes: 'VAT Excluded',
    warranty: DEFAULT_WARRANTY,
    agreement: DEFAULT_AGREEMENT,
    terms: DEFAULT_TERMS,
    downpaymentPercent: 50,
    completionPercent: 45,
    retentionPercent: 5,
    categories: seededCategories(),
    updatedAt: new Date().toISOString(),
  }
}

/** Ensure loaded data has the 3-category shape (migrates older flat `items`). */
export function normalizeRfq(data) {
  if (!data) return createDefaultRfq()

  const defaults = createDefaultRfq()
  const { packagePercent: _dropPackage, ...withoutPackage } = data

  const paymentFields = {
    downpaymentPercent: readPercent(
      data.downpaymentPercent ?? defaults.downpaymentPercent,
    ),
    completionPercent: readPercent(
      data.completionPercent ?? defaults.completionPercent,
    ),
    retentionPercent: readPercent(
      data.retentionPercent ?? defaults.retentionPercent,
    ),
  }

  if (Array.isArray(data.categories) && data.categories.length) {
    const byId = Object.fromEntries(data.categories.map((c) => [c.id, c]))
    return {
      ...defaults,
      ...withoutPackage,
      ...paymentFields,
      location: data.location ?? '',
      company: data.company ?? defaults.company,
      intro: data.intro ?? defaults.intro,
      warranty: data.warranty ?? defaults.warranty,
      agreement: data.agreement ?? defaults.agreement,
      terms: data.terms ?? defaults.terms,
      categories: CATEGORY_DEFS.map((def) => {
        const existing = byId[def.id]
        return {
          id: def.id,
          title: def.title,
          roman: def.roman,
          items: Array.isArray(existing?.items) ? existing.items : [],
        }
      }),
    }
  }

  if (Array.isArray(data.items)) {
    const categories = emptyCategories()
    categories[0].items = data.items
    const { items: _drop, packagePercent: _dropPct, ...rest } = data
    return {
      ...defaults,
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

/** Format money like the sample (1,234.00 without currency symbol in table cells). */
export function formatPhp(value) {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}
