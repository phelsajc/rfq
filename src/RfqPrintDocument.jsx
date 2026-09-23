import { formatPhp } from './rfqDefaults'

function formatMoneyPhp(value) {
  return `${formatPhp(value)} Php`
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Print groups like the sample: I = materials+roughing, II = labor. */
function printSections(rfq) {
  const byId = Object.fromEntries((rfq.categories || []).map((c) => [c.id, c]))
  const materials = byId.materials?.items || []
  const roughing = byId.roughing?.items || []
  const labor = byId.labor?.items || []

  return [
    {
      roman: 'I',
      title: 'MATERIAL COST',
      items: [...materials, ...roughing],
    },
    {
      roman: 'II',
      title: 'LABOR & SUPERVISION',
      items: labor,
    },
  ]
}

/**
 * Sample PDF layout:
 * Page 1 — all computation / money
 * Page 2 — warranty, agreement, signature, terms (no prices)
 */
export default function RfqPrintDocument({ rfq, packageTotal, payments }) {
  const sections = printSections(rfq)
  const down = payments.rows.find((r) => r.id === 'downpayment')
  const completion = payments.rows.find((r) => r.id === 'completion')
  const retention = payments.rows.find((r) => r.id === 'retention')

  return (
    <article className="print-doc" aria-hidden="true">
      <div className="print-page print-page-1">
        <header className="print-letterhead">
          <img
            className="print-brand-header"
            src={`${import.meta.env.BASE_URL}header.JPG`}
            alt="Jan Solar Energy Shop"
          />
          <dl className="print-letter-meta">
            <div>
              <dt>TO:</dt>
              <dd>{rfq.customer || '—'}</dd>
            </div>
            <div>
              <dt>Location:</dt>
              <dd>{rfq.location || '—'}</dd>
            </div>
            <div>
              <dt>RE:</dt>
              <dd>{rfq.title || '—'}</dd>
            </div>
            <div>
              <dt>DATE:</dt>
              <dd>{formatDate(rfq.date)}</dd>
            </div>
          </dl>
          <p className="print-intro">{rfq.intro}</p>
        </header>

        <table className="print-table print-main">
          <thead>
            <tr>
              <th className="p-desc">Description</th>
              <th className="p-qty">Qty.</th>
              <th className="p-unit">Unit</th>
              <th className="p-price">Unit Price</th>
              <th className="p-amt">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((sec) => (
              <SectionRows key={sec.roman} section={sec} />
            ))}
            <tr className="print-total-row">
              <td colSpan={4} className="print-sub-label">
                TOTAL
              </td>
              <td className="p-amt print-sub">{formatPhp(packageTotal)}</td>
            </tr>
          </tbody>
        </table>

        <section className="print-overall">
          <span>OVERALL TOTAL PACKAGE COST</span>
          <strong>{formatMoneyPhp(packageTotal)}</strong>
        </section>

        <section className="print-payment-lines">
          {payments.rows.map((row) => (
            <div key={row.id} className="print-pay-line">
              <span>
                {row.percent}% {row.title}
              </span>
              <strong>{formatMoneyPhp(row.amount)}</strong>
            </div>
          ))}
          {completion ? (
            <div className="print-pay-line print-pay-note">
              <span>
                Completion of Installation Payment of {completion.percent}%
              </span>
              <strong>{formatMoneyPhp(completion.amount)}</strong>
            </div>
          ) : null}
        </section>

        {rfq.notes ? <p className="print-vat">{rfq.notes}</p> : null}
      </div>

      <div className="print-page print-page-2">
        <h2 className="print-h2">Components Warranty and Performance:</h2>
        <ol className="print-ol">
          <li>
            Solar Modules - 10 Years replacement, Up to 12 years : 90% power
            output 2. Up to 25 years : 85% power output.
          </li>
          <li>GridTie/Hybrid Inverter - 5 Years Replacement Warranty</li>
          <li>Lithuim Battery - 5 Year Warranty replacement on parts</li>
          <li>Workmanship and Safety Devices - 1 year warrant</li>
        </ol>

        <p className="print-p print-p-bold">
          Components delivered and installed with the following conditions.
        </p>
        <ul className="print-ul">
          <li>
            Provided that the Equipments / Components is not tampered or opened by
            any unauthorized person.
          </li>
          <li>
            Provided that the Equipments / Components is not being abused or
            misused.
          </li>
          <li>
            (Acts of God (e.g. Lightning, Storms, etc. is not covered by the
            Warranty)
          </li>
        </ul>

        <p className="print-p print-p-bold">
          Components delivered and installed with the following conditions.
        </p>
        <ul className="print-ul">
          <li>Unlimited Free Service Visits for Troubleshooting and Checkup</li>
          <li>24 to 48 Hours response time for any reported defects/problems.</li>
        </ul>

        <h2 className="print-h2">Agreement</h2>
        <p className="print-p">
          All equipment in above proposed solar power systems have longer service
          lives than guaranteed if operated under normal operating conditions.
          Nevertheless, the Service Level Agreement (SLA) may be signed between
          the Client &amp; I that will cover all activities as per its
          requirements, for example:
        </p>
        <ol className="print-ol">
          <li>Repair works</li>
          <li>Troubleshoots at site</li>
          <li>Client Orientation</li>
          <li>Re-arrangement of system in any other location, etc.</li>
        </ol>

        <h2 className="print-h2">Terms &amp; Conditions:</h2>
        <ul className="print-dots">
          <li>
            Payment Mode: {down?.percent ?? 50}% Downpayment,{' '}
            {completion?.percent ?? 45}% Upon Completion and Commissioning
          </li>
          <li>
            {retention?.percent ?? 5}% Retention after Commisioning and
            Energization
          </li>
          <li>
            Start of the Project: 3 to 5 Working Days depend on the size after
            receipt of Signed Conforme
          </li>
          <li>Price Validity: 15 days.</li>
          <li>Vat Excluded</li>
          <li>Project Duration: 7-14 Days</li>
        </ul>

        <section className="print-sign">
          <p>Sincerely,</p>
          <p className="print-sign-name">{rfq.preparedBy || '—'}</p>
          <p className="print-sign-co">{rfq.company || '—'}</p>
        </section>

        <section className="print-conforme">
          <p className="print-conforme-label">Conforme</p>
          <div className="print-sign-line" />
          <p className="print-conforme-date">
            <strong>Date:</strong>
            <span className="print-date-line" />
          </p>
        </section>
      </div>
    </article>
  )
}

function SectionRows({ section }) {
  const hasItems = section.items.length > 0

  return (
    <>
      <tr className="print-cat-header">
        <td colSpan={5}>
          {section.roman}. {section.title}
        </td>
      </tr>
      {hasItems ? (
        section.items.map((row) => (
          <tr key={row.id}>
            <td className="p-desc">
              <pre className="print-desc">{row.description || '—'}</pre>
            </td>
            <td className="p-qty">{row.qty}</td>
            <td className="p-unit">{row.unit}</td>
            <td className="p-price">
              {Number(row.unitPrice) ? formatPhp(row.unitPrice) : ''}
            </td>
            <td className="p-amt">
              {Number(row.amount) ? formatPhp(row.amount) : ''}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={5} className="print-empty">
            —
          </td>
        </tr>
      )}
    </>
  )
}
