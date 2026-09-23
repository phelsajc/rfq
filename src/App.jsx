import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadRfq, saveRfq } from './storage'
import RfqPrintDocument from './RfqPrintDocument'
import {
  calcAmount,
  categoryTotal,
  createDefaultRfq,
  emptyItem,
  normalizeRfq,
  overallPackageCost,
  paymentSchedule,
  UNIT_OPTIONS,
} from './rfqDefaults'

function formatMoney(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0)
}

/** Safe suggested PDF name from customer (print Save as PDF uses document.title). */
function pdfFilenameFromCustomer(customer) {
  const cleaned = String(customer ?? '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '')
    .slice(0, 120)
  return cleaned || 'RFQ'
}

export default function App() {
  const [rfq, setRfq] = useState(null)
  const [status, setStatus] = useState('loading')
  const [saveState, setSaveState] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const stored = await loadRfq()
        if (!alive) return
        setRfq(stored ? normalizeRfq(stored) : createDefaultRfq())
        setStatus('ready')
      } catch {
        if (!alive) return
        setRfq(createDefaultRfq())
        setStatus('ready')
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!rfq || status !== 'ready') return
    const timer = setTimeout(async () => {
      try {
        await saveRfq({ ...rfq, updatedAt: new Date().toISOString() })
        setSaveState('Saved on this device')
      } catch {
        setSaveState('Save failed')
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [rfq, status])

  const packageTotal = useMemo(() => overallPackageCost(rfq), [rfq])
  const payments = useMemo(() => paymentSchedule(rfq), [rfq])

  const updateMeta = useCallback((field, value) => {
    setRfq((prev) => ({ ...prev, [field]: value }))
    setSaveState('Saving…')
  }, [])

  const updateItem = useCallback((categoryId, itemId, field, value) => {
    setRfq((prev) => {
      const categories = prev.categories.map((cat) => {
        if (cat.id !== categoryId) return cat
        const items = cat.items.map((row) => {
          if (row.id !== itemId) return row
          const next = { ...row, [field]: value }
          if (field === 'qty' || field === 'unitPrice') {
            next.amount = calcAmount(next.qty, next.unitPrice)
          }
          return next
        })
        return { ...cat, items }
      })
      return { ...prev, categories }
    })
    setSaveState('Saving…')
  }, [])

  const addItem = useCallback((categoryId) => {
    setRfq((prev) => {
      const categories = prev.categories.map((cat) =>
        cat.id === categoryId ? { ...cat, items: [...cat.items, emptyItem()] } : cat,
      )
      return { ...prev, categories }
    })
    setSaveState('Saving…')
  }, [])

  const removeItem = useCallback((categoryId, itemId) => {
    setRfq((prev) => {
      const categories = prev.categories.map((cat) => {
        if (cat.id !== categoryId) return cat
        return { ...cat, items: cat.items.filter((r) => r.id !== itemId) }
      })
      return { ...prev, categories }
    })
    setSaveState('Saving…')
  }, [])

  const resetRfq = useCallback(() => {
    if (
      !window.confirm(
        'Reset this RFQ? All items in all categories on this device will be cleared.',
      )
    ) {
      return
    }
    setRfq(createDefaultRfq())
    setSaveState('Saving…')
  }, [])

  const exportPdf = useCallback(() => {
    const previousTitle = document.title
    document.title = pdfFilenameFromCustomer(rfq?.customer)
    let restored = false
    const restoreTitle = () => {
      if (restored) return
      restored = true
      document.title = previousTitle
      window.removeEventListener('afterprint', restoreTitle)
    }
    window.addEventListener('afterprint', restoreTitle)
    window.print()
    // Fallback if afterprint never fires (some browsers)
    setTimeout(restoreTitle, 1000)
  }, [rfq?.customer])

  if (status === 'loading' || !rfq) {
    return (
      <div className="shell">
        <p className="muted">Loading RFQ…</p>
      </div>
    )
  }

  return (
    <>
    <div className="shell no-print">
      <header className="hero">
        <p className="brand">RFQ</p>
        <h1>{rfq.title}</h1>
        <p className="lede">
          Three quotation sections — Material Cost, Roughing-In & Consumable Mat, and Labor &
          Supervision. Add items only as needed. Saved on this device.
        </p>
        <div className="hero-actions">
          <button type="button" className="btn primary" onClick={exportPdf}>
            Export PDF
          </button>
          <button type="button" className="btn ghost" onClick={resetRfq}>
            Reset RFQ
          </button>
          <span className="save-pill" aria-live="polite">
            {saveState}
          </span>
        </div>
      </header>

      <section className="meta" aria-label="RFQ details">
        <label className="meta-wide">
          <span>RE (Title)</span>
          <input value={rfq.title} onChange={(e) => updateMeta('title', e.target.value)} />
        </label>
        <label>
          <span>TO (Customer)</span>
          <input
            value={rfq.customer}
            onChange={(e) => updateMeta('customer', e.target.value)}
            placeholder="Client name"
          />
        </label>
        <label>
          <span>Location</span>
          <input
            value={rfq.location}
            onChange={(e) => updateMeta('location', e.target.value)}
            placeholder="City / site"
          />
        </label>
        <label>
          <span>Date</span>
          <input
            type="date"
            value={rfq.date}
            onChange={(e) => updateMeta('date', e.target.value)}
          />
        </label>
        <label>
          <span>Prepared by</span>
          <input
            value={rfq.preparedBy}
            onChange={(e) => updateMeta('preparedBy', e.target.value)}
          />
        </label>
        <label>
          <span>Company</span>
          <input
            value={rfq.company}
            onChange={(e) => updateMeta('company', e.target.value)}
          />
        </label>
        <label className="meta-wide">
          <span>Intro line</span>
          <input
            value={rfq.intro}
            onChange={(e) => updateMeta('intro', e.target.value)}
          />
        </label>
      </section>

      {rfq.categories.map((cat) => {
        const subtotal = categoryTotal(cat)
        return (
          <section key={cat.id} className="category" aria-label={cat.title}>
            <div className="category-head">
              <h2>{cat.title}</h2>
              <button
                type="button"
                className="btn primary"
                onClick={() => addItem(cat.id)}
              >
                Add item
              </button>
            </div>

            <div className="table-wrap">
              <table className="items">
                <thead>
                  <tr>
                    <th className="col-desc">Description</th>
                    <th className="col-qty">Qty</th>
                    <th className="col-unit">Unit</th>
                    <th className="col-price">Unit price</th>
                    <th className="col-amount">Amount</th>
                    <th className="col-act" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {cat.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-row">
                        No items yet. Click <strong>Add item</strong> to type a line.
                      </td>
                    </tr>
                  ) : (
                    cat.items.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <textarea
                            className="cell desc"
                            rows={2}
                            value={row.description}
                            onChange={(e) =>
                              updateItem(cat.id, row.id, 'description', e.target.value)
                            }
                            placeholder={"Item or package list, e.g.\n- Roof Mount railing set\n- Surge Protection"}
                          />
                        </td>
                        <td>
                          <input
                            className="cell num"
                            type="number"
                            min="0"
                            step="any"
                            value={row.qty}
                            onChange={(e) =>
                              updateItem(cat.id, row.id, 'qty', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <select
                            className="cell"
                            value={
                              UNIT_OPTIONS.includes(row.unit) ? row.unit : 'pc'
                            }
                            onChange={(e) =>
                              updateItem(cat.id, row.id, 'unit', e.target.value)
                            }
                          >
                            {UNIT_OPTIONS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="cell num"
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.unitPrice}
                            onChange={(e) =>
                              updateItem(cat.id, row.id, 'unitPrice', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="cell num"
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.amount}
                            onChange={(e) =>
                              updateItem(cat.id, row.id, 'amount', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => removeItem(cat.id, row.id)}
                            aria-label="Remove item"
                            title="Remove"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="total-label">
                      Subtotal
                    </td>
                    <td className="amount total">{formatMoney(subtotal)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )
      })}

      <section className="totals-block" aria-label="Package totals">
        <div className="grand" aria-label="Overall total package cost">
          <span>Overall total package cost</span>
          <strong>{formatMoney(packageTotal)}</strong>
        </div>

        <div className="payment-block" aria-label="Payment schedule">
          <h3 className="payment-title">Payment schedule</h3>
          {payments.rows.map((row) => (
            <label key={row.id} className="percent-row payment-row">
              <span>{row.title}</span>
              <div className="percent-input">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rfq[row.field]}
                  onChange={(e) => updateMeta(row.field, e.target.value)}
                  aria-label={`${row.title} percent`}
                />
                <span className="percent-suffix">%</span>
              </div>
              <span className="percent-hint amount-hint">{formatMoney(row.amount)}</span>
            </label>
          ))}
          <div className="payment-footer">
            <div className="payment-sum">
              <span>Payment total</span>
              <strong>{formatMoney(payments.amountSum)}</strong>
            </div>
            <p
              className={
                payments.isComplete ? 'payment-status ok' : 'payment-status warn'
              }
            >
              {payments.isComplete
                ? 'Percents total 100%'
                : `Percents total ${payments.percentSum}% (should be 100%)`}
            </p>
          </div>
        </div>
      </section>

      <section className="notes docs-panel">
        <label>
          <span>Notes / VAT line (page 1)</span>
          <textarea
            rows={2}
            value={rfq.notes}
            onChange={(e) => updateMeta('notes', e.target.value)}
          />
        </label>
        <p className="muted">
          PDF page 2 follows the sample quotation (warranty, agreement, conforme,
          terms). Payment % on page 2 uses your payment schedule values.
        </p>
      </section>

      <footer className="foot">
        <p className="muted">
          Offline-capable PWA. Quotes are stored only on this device. Use Export PDF → Save as PDF.
        </p>
      </footer>
    </div>

    <RfqPrintDocument rfq={rfq} packageTotal={packageTotal} payments={payments} />
    </>
  )
}
