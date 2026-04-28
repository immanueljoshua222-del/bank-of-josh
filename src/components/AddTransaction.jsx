import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { parseNaturalLanguage } from '../lib/gemini'

const CATEGORIES = {
  expense: ['Food', 'Transport', 'Rent', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other'],
  income: ['Photography Income', 'Freelance Income', 'Other Income'],
}

export const CATEGORY_COLORS = {
  Food: '#f97316', Transport: '#06b6d4', Rent: '#8b5cf6', Utilities: '#14b8a6',
  Entertainment: '#f59e0b', Healthcare: '#10b981', Shopping: '#ec4899',
  'Photography Income': '#6366f1', 'Freelance Income': '#4f46e5', 'Other Income': '#3b82f6', Other: '#6b7280',
}

const today = () => new Date().toISOString().split('T')[0]

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: '#e2e8f0', fontSize: '13.5px', outline: 'none', transition: 'border-color 0.15s',
  fontFamily: 'Inter, sans-serif',
}

export default function AddTransaction({ onAdded }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [parsed, setParsed] = useState(false) // true after AI parse succeeds
  const [form, setForm] = useState({ type: 'expense', amount: '', category: 'Food', description: '', date: today() })
  const [saving, setSaving] = useState(false)

  function resetAndClose() {
    setOpen(false)
    setAiText('')
    setAiError('')
    setParsed(false)
    setForm({ type: 'expense', amount: '', category: 'Food', description: '', date: today() })
  }

  async function handleAIParse() {
    if (!aiText.trim()) return
    setAiLoading(true)
    setAiError('')
    try {
      const data = await parseNaturalLanguage(aiText)
      setForm({
        type: data.type || 'expense',
        amount: String(data.amount || ''),
        category: data.category || 'Other',
        description: data.description || '',
        date: data.date || today(),
      })
      setParsed(true)
    } catch (err) {
      setAiError(`AI error: ${err?.message || 'Unknown error'} — fill manually below.`)
      setParsed(true) // still show manual form
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSave() {
    if (!form.amount || isNaN(parseFloat(form.amount))) return
    setSaving(true)
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: form.type,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description,
      date: form.date,
    })
    setSaving(false)
    if (!error) { resetAndClose(); onAdded?.() }
  }

  const isMobile = window.innerWidth <= 768
  const overlay = { position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? '0' : '16px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }
  const card = { width: '100%', maxWidth: isMobile ? '100%' : '440px', borderRadius: isMobile ? '20px 20px 0 0' : '20px', background: '#0f0f1e', border: '1px solid rgba(255,255,255,0.08)', padding: isMobile ? '24px 20px max(24px, env(safe-area-inset-bottom))' : '28px', boxShadow: '0 -8px 40px rgba(0,0,0,0.5)', maxHeight: isMobile ? '92dvh' : 'auto', overflowY: 'auto' }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: 'white', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.1px' }}
      >
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>
        Add Transaction
      </button>

      {open && (
        <div style={overlay} onClick={e => e.target === e.currentTarget && resetAndClose()}>
          <div style={card}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '17px', letterSpacing: '-0.3px' }}>Add Transaction</h3>
              <button onClick={resetAndClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* AI Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '8px' }}>
                ✦ AI Smart Entry
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={aiText}
                  onChange={e => { setAiText(e.target.value); if (parsed) setParsed(false) }}
                  placeholder='e.g. "got paid 10k from concert shoot"'
                  style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && handleAIParse()}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <button
                  onClick={handleAIParse}
                  disabled={aiLoading || !aiText.trim()}
                  style={{ padding: '10px 14px', borderRadius: '10px', background: aiLoading ? '#1e1e30' : 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', cursor: 'pointer', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
                >
                  {aiLoading ? '...' : 'Parse'}
                </button>
              </div>
              {aiError && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>{aiError}</p>}
              {aiLoading && <p style={{ color: '#818cf8', fontSize: '12px', marginTop: '6px' }}>Gemini is thinking...</p>}
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ color: '#4b5563', fontSize: '11px' }}>{parsed ? 'Review & confirm' : 'or fill manually'}</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            </div>

            {/* Form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Type toggle */}
              <div style={{ display: 'flex', gap: '6px', padding: '4px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {['expense', 'income'].map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, type: t, category: t === 'expense' ? 'Food' : 'Photography Income' }))}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                      textTransform: 'capitalize', transition: 'all 0.15s',
                      background: form.type === t ? (t === 'expense' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)') : 'transparent',
                      color: form.type === t ? (t === 'expense' ? '#fca5a5' : '#6ee7b7') : '#6b7280',
                    }}
                  >
                    {t === 'expense' ? '↑ Expense' : '↓ Income'}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Amount (₹)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ ...inputStyle, colorScheme: 'dark', cursor: 'pointer' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                >
                  {CATEGORIES[form.type].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Concert shoot — client name"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !form.amount}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px', border: 'none', cursor: form.amount ? 'pointer' : 'not-allowed',
                  background: form.amount && !saving ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#1e1e30',
                  color: 'white', fontWeight: 700, fontSize: '14px', fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.15s', marginTop: '4px', letterSpacing: '-0.2px',
                }}
              >
                {saving ? 'Saving...' : `Save ${form.type === 'income' ? 'Income' : 'Expense'}${form.amount ? ' · ₹' + Number(form.amount).toLocaleString('en-IN') : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
