import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { generateInsights, suggestBudget } from '../lib/gemini'
import { CATEGORY_COLORS } from '../components/AddTransaction'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')

function InsightCard({ title, subtitle, color, accentColor, onGenerate, loading, content, placeholder }) {
  return (
    <div style={{ background: '#0d0d1a', border: `1px solid ${accentColor}20`, borderRadius: '16px', padding: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accentColor }} />
            <p style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>{title}</p>
          </div>
          <p style={{ color: '#6b7280', fontSize: '12px' }}>{subtitle}</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={loading}
          style={{ padding: '7px 14px', borderRadius: '8px', background: `${accentColor}18`, border: `1px solid ${accentColor}30`, color: accentColor, fontSize: '12px', fontWeight: 600, cursor: loading ? 'default' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
        >
          {loading && <div style={{ width: '10px', height: '10px', border: `1.5px solid ${accentColor}40`, borderTopColor: accentColor, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
          {loading ? 'Thinking...' : '✦ Generate'}
        </button>
      </div>
      <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.025)', minHeight: '70px', display: 'flex', alignItems: content ? 'flex-start' : 'center' }}>
        <p style={{ color: content ? '#cbd5e1' : '#374151', fontSize: '13.5px', lineHeight: '1.65' }}>
          {content || placeholder}
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function Insights() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [insights, setInsights] = useState('')
  const [budget, setBudget] = useState('')
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [loadingBudget, setLoadingBudget] = useState(false)

  useEffect(() => {
    supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(200)
      .then(({ data }) => setTransactions(data || []))
  }, [])

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' })
  const monthTx = transactions.filter(t => t.date?.startsWith(thisMonth))

  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  const byCategory = monthTx.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount; return acc
  }, {})
  const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // Anomaly detection
  const anomalies = []
  if (transactions.length > 10) {
    const prevKeys = [1, 2, 3].map(i => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
    Object.entries(byCategory).forEach(([cat, val]) => {
      const hist = prevKeys.map(m =>
        transactions.filter(t => t.date?.startsWith(m) && t.category === cat && t.type === 'expense')
          .reduce((s, t) => s + t.amount, 0)
      ).filter(v => v > 0)
      if (hist.length > 0) {
        const avg = hist.reduce((a, b) => a + b, 0) / hist.length
        if (val > avg * 1.75 && val - avg > 500) anomalies.push({ category: cat, current: val, avg: Math.round(avg) })
      }
    })
  }

  const quickStats = [
    { label: 'Avg daily spend', value: fmt(Math.round(expenses / daysInMonth)) },
    { label: 'Transactions', value: monthTx.length },
    { label: 'Largest expense', value: fmt(Math.max(0, ...monthTx.filter(t => t.type === 'expense').map(t => t.amount))) },
    { label: 'Income sources', value: monthTx.filter(t => t.type === 'income').length },
  ]

  const cardStyle = { background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '22px' }

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.6px', margin: 0 }}>AI Insights</h1>
        <p style={{ color: '#4b5563', fontSize: '13px', marginTop: '4px' }}>Powered by Gemini · {monthLabel}</p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {quickStats.map(s => (
          <div key={s.label} style={{ ...cardStyle, textAlign: 'center', padding: '16px' }}>
            <p style={{ color: 'white', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px' }}>{s.value}</p>
            <p style={{ color: '#6b7280', fontSize: '11.5px', marginTop: '4px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* AI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        <InsightCard
          title="Monthly Analysis" subtitle={monthLabel}
          accentColor="#6366f1" loading={loadingInsights} content={insights}
          placeholder="Click Generate for a personalized breakdown of your spending this month."
          onGenerate={async () => { setLoadingInsights(true); setInsights(''); const r = await generateInsights(monthTx, monthLabel); setInsights(r); setLoadingInsights(false) }}
        />
        <InsightCard
          title="Budget Suggestion" subtitle="Based on your history"
          accentColor="#f59e0b" loading={loadingBudget} content={budget}
          placeholder="Click Generate to get a personalised monthly budget recommendation."
          onGenerate={async () => { setLoadingBudget(true); setBudget(''); const r = await suggestBudget(transactions); setBudget(r); setLoadingBudget(false) }}
        />
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div style={{ marginBottom: '20px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '16px' }}>⚠</span>
            <p style={{ color: '#fbbf24', fontWeight: 600, fontSize: '14px' }}>Spending Anomalies Detected</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {anomalies.map(({ category, current, avg }) => (
              <div key={category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CATEGORY_COLORS[category] || '#6b7280' }} />
                  <span style={{ color: '#e2e8f0', fontSize: '13.5px', fontWeight: 500 }}>{category}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '14px' }}>{fmt(current)}</span>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>vs avg {fmt(avg)}</span>
                  <span style={{ color: '#f97316', fontSize: '11.5px', fontWeight: 600, background: 'rgba(249,115,22,0.15)', padding: '2px 7px', borderRadius: '99px' }}>
                    +{Math.round(((current - avg) / avg) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top spending breakdown */}
      <div style={cardStyle}>
        <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', marginBottom: '18px' }}>Top Spending — {monthLabel}</p>
        {topCategories.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '13px' }}>No expenses this month yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {topCategories.map(([cat, val]) => {
              const pct = expenses > 0 ? Math.round((val / expenses) * 100) : 0
              const color = CATEGORY_COLORS[cat] || '#6b7280'
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color }} />
                      <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 500 }}>{cat}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>{pct}%</span>
                      <span style={{ color: 'white', fontSize: '13.5px', fontWeight: 700 }}>{fmt(val)}</span>
                    </div>
                  </div>
                  <div style={{ height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: color, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
