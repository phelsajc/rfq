import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadRfq, saveRfq } from './storage'
import {
  calcAmount,
  categoryTotal,
  createDefaultRfq,
  emptyItem,
  grandTotal,
  normalizeRfq,
} from './rfqDefaults'

function formatMoney(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0)
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

  const total = useMemo(() => grandTotal(rfq), [rfq])

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

  if (status === 'loading' || !rfq) {
    return (
      <div className="shell">
        <p className="muted">Loading RFQ…</p>
      </div>
    )
  }

  return (
    <div className="shell">
      <header className="hero">
        <p className="brand">Jayobo RFQ</p>
        <h1>{rfq.title}</h1>
        <p className="lede">
          Three quotation sections — Material Cost, Roughing-In & Consumable Mat, and Labor &
          Supervision. Add items only as needed. Saved on this device.
        </p>
        <div className="hero-actions">
          <button type="button" className="btn ghost" onClick={resetRfq}>
            Reset RFQ
          </button>
          <span className="save-pill" aria-live="polite">
            {saveState}
          </span>
        </div>
      </header>

      <section className="meta" aria-label="RFQ details">
        <label>
          <span>Title</span>
          <input value={rfq.title} onChange={(e) => updateMeta('title', e.target.value)} />
        </label>
        <label>
          <span>Customer</span>
          <input
            value={rfq.customer}
            onChange={(e) => updateMeta('customer', e.target.value)}
            placeholder="Client / project name"
          />
        </label>
        <label>
          <span>Prepared by</span>
          <input
            value={rfq.preparedBy}
            onChange={(e) => updateMeta('preparedBy', e.target.value)}
            placeholder="Your name"
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
                          <input
                            className="cell"
                            value={row.unit}
                            onChange={(e) =>
                              updateItem(cat.id, row.id, 'unit', e.target.value)
                            }
                            placeholder="pc"
                          />
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
                        <td className="amount">{formatMoney(row.amount)}</td>
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

      <section className="grand" aria-label="Grand total">
        <span>Grand total</span>
        <strong>{formatMoney(total)}</strong>
      </section>

      <section className="notes">
        <label>
          <span>Notes</span>
          <textarea
            rows={3}
            value={rfq.notes}
            onChange={(e) => updateMeta('notes', e.target.value)}
          />
        </label>
      </section>

      <footer className="foot">
        <p className="muted">
          Offline-capable PWA. Quotes are stored only on this device.
        </p>
      </footer>
    </div>
  )
}
