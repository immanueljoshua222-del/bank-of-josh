import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import AddTransaction, { CATEGORY_COLORS } from '../components/AddTransaction'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')

export default function Transactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [deleting, setDeleting] = useState(null)

  async function fetchData() {
    const { data } = await supabase
      .from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  async function handleDelete(id) {
    setDeleting(id)
    await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
    setTransactions(prev => prev.filter(t => t.id !== id))
    setDeleting(null)
  }

  const filtered = transactions.filter(t => {
    const matchType = filter === 'all' || t.type === filter
    const q = search.toLowerCase()
    const matchSearch = !q || t.description?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q)
    return matchType && matchSearch
  })

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const inputStyle = { padding: '9px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.6px', margin: 0 }}>Transactions</h1>
          <p style={{ color: '#4b5563', fontSize: '13px', marginTop: '4px' }}>{filtered.length} records</p>
        </div>
        <AddTransaction onAdded={fetchData} />
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { label: 'Income', value: fmt(totalIncome), color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Expenses', value: fmt(totalExpense), color: '#f87171', bg: 'rgba(239,68,68,0.08)' },
          { label: 'Net', value: fmt(totalIncome - totalExpense), color: '#818cf8', bg: 'rgba(99,102,241,0.08)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '10px 18px', borderRadius: '10px', background: s.bg, border: `1px solid ${s.color}22`, display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: '#6b7280', fontSize: '13px' }}>{s.label}</span>
            <span style={{ color: s.color, fontWeight: 700, fontSize: '14px' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
            <circle cx="11" cy="11" r="8" stroke="#6b7280" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or category..."
            style={{ ...inputStyle, width: '100%', paddingLeft: '36px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {['all', 'income', 'expense'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, textTransform: 'capitalize', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s', background: filter === f ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent', color: filter === f ? 'white' : '#6b7280' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px' }}>
            <div style={{ width: '28px', height: '28px', border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
            No transactions found
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 110px 40px', gap: '12px', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['Transaction', 'Category', 'Date', 'Amount', ''].map(h => (
                <span key={h} style={{ color: '#4b5563', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
              ))}
            </div>
            {filtered.map((tx, i) => (
              <TxRow key={tx.id} tx={tx} isLast={i === filtered.length - 1} onDelete={() => handleDelete(tx.id)} deleting={deleting === tx.id} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function TxRow({ tx, isLast, onDelete, deleting }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 110px 40px', gap: '12px', padding: '14px 20px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)', background: hover ? 'rgba(255,255,255,0.015)' : 'transparent', transition: 'background 0.1s', alignItems: 'center' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${CATEGORY_COLORS[tx.category] || '#6b7280'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: CATEGORY_COLORS[tx.category] || '#6b7280', fontSize: '14px' }}>{tx.type === 'income' ? '↙' : '↗'}</span>
        </div>
        <p style={{ color: '#e2e8f0', fontSize: '13.5px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || tx.category}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: CATEGORY_COLORS[tx.category] || '#6b7280', flexShrink: 0 }} />
        <span style={{ color: '#9ca3af', fontSize: '12.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.category}</span>
      </div>
      <span style={{ color: '#6b7280', fontSize: '12.5px' }}>{tx.date}</span>
      <span style={{ fontWeight: 700, fontSize: '13.5px', color: tx.type === 'income' ? '#10b981' : '#f87171' }}>
        {tx.type === 'income' ? '+' : '-'}{'₹' + Number(tx.amount).toLocaleString('en-IN')}
      </span>
      <button
        onClick={onDelete}
        disabled={deleting}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: hover ? '#ef4444' : 'transparent', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  )
}
