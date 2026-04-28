import { useState, useRef, useEffect } from 'react'
import { PRESETS } from '../lib/dateRange'

export default function DateRangeFilter({ value, custom, onChange }) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [draft, setDraft] = useState(custom || { from: '', to: '' })
  const popRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!popoverOpen) return
    const handler = e => {
      if (popRef.current && !popRef.current.contains(e.target) &&
          wrapRef.current && !wrapRef.current.contains(e.target)) {
        setPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [popoverOpen])

  useEffect(() => {
    if (custom) setDraft(custom)
  }, [custom])

  function selectPreset(key) {
    if (key === 'custom') {
      setPopoverOpen(o => !o)
      return
    }
    setPopoverOpen(false)
    onChange(key, null)
  }

  function applyCustom() {
    if (!draft.from || !draft.to) return
    onChange('custom', draft)
    setPopoverOpen(false)
  }

  return (
    <div style={{ position: 'relative' }} ref={wrapRef}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px', padding: '4px',
        borderRadius: '12px', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto',
        maxWidth: '100%', WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}>
        {PRESETS.map(p => {
          const active = value === p.key
          return (
            <button key={p.key} onClick={() => selectPreset(p.key)}
              style={{
                padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
                background: active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                color: active ? 'white' : '#9ca3af',
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {popoverOpen && (
        <div ref={popRef} style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 30,
          width: '260px', padding: '14px', borderRadius: '12px',
          background: '#13131f', border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}>
          <p style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Custom range
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', color: '#6b7280', fontSize: '11px', marginBottom: '4px' }}>From</label>
              <input type="date" value={draft.from} max={draft.to || undefined}
                onChange={e => setDraft(d => ({ ...d, from: e.target.value }))}
                style={dateInput}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#6b7280', fontSize: '11px', marginBottom: '4px' }}>To</label>
              <input type="date" value={draft.to} min={draft.from || undefined}
                onChange={e => setDraft(d => ({ ...d, to: e.target.value }))}
                style={dateInput}
              />
            </div>
            <button onClick={applyCustom} disabled={!draft.from || !draft.to}
              style={{
                marginTop: '2px', padding: '9px', borderRadius: '8px', border: 'none',
                cursor: draft.from && draft.to ? 'pointer' : 'not-allowed',
                background: draft.from && draft.to ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#1e1e30',
                color: 'white', fontWeight: 600, fontSize: '12.5px', fontFamily: 'Inter, sans-serif',
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const dateInput = {
  width: '100%', padding: '8px 10px', borderRadius: '8px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: '#e2e8f0', fontSize: '12.5px', outline: 'none',
  colorScheme: 'dark', fontFamily: 'Inter, sans-serif',
}
