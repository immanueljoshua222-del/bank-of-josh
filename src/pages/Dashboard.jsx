import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import AddTransaction, { CATEGORY_COLORS } from '../components/AddTransaction'
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', letterSpacing: '0.02em' }}>{label}</span>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color, fontSize: '14px' }}>{icon}</span>
        </div>
      </div>
      <div>
        <p style={{ color: 'white', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.8px', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ color: '#4b5563', fontSize: '12px', marginTop: '5px' }}>{sub}</p>}
      </div>
    </div>
  )
}

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px' }}>
        {label && <p style={{ color: '#6b7280', marginBottom: '6px' }}>{label}</p>}
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {fmt(p.value)}</p>
        ))}
      </div>
    )
  }
  return null
}

const PieTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px 12px', fontSize: '12px' }}>
        <p style={{ color: '#e2e8f0', fontWeight: 600 }}>{payload[0].name}</p>
        <p style={{ color: payload[0].payload.fill, marginTop: '2px' }}>{fmt(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    const { data } = await supabase
      .from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthTx = transactions.filter(t => t.date?.startsWith(thisMonth))
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expenses
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0

  const byCategory = monthTx.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount; return acc
  }, {})
  const donutData = Object.entries(byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const trendData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('default', { month: 'short' })
    const inc = transactions.filter(t => t.date?.startsWith(key) && t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const exp = transactions.filter(t => t.date?.startsWith(key) && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { month: label, Income: inc, Expenses: exp }
  })

  const recent = transactions.slice(0, 8)
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ width: '36px', height: '36px', border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const cardStyle = { background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '22px' }

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>{greeting}, Josh</p>
          <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.6px', margin: 0 }}>Financial Overview</h1>
          <p style={{ color: '#4b5563', fontSize: '13px', marginTop: '4px' }}>{monthName}</p>
        </div>
        <AddTransaction onAdded={fetchData} />
      </div>

      {/* Hero balance + stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        {/* Big balance card */}
        <div style={{ ...cardStyle, background: 'linear-gradient(145deg, #13132b, #0f0f20)', gridRow: 'span 1', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)' }} />
          <p style={{ color: '#6b7280', fontSize: '12px', fontWeight: 500, marginBottom: '10px' }}>Net Balance · {monthName}</p>
          <p style={{ color: 'white', fontSize: '36px', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1 }}>{fmt(balance)}</p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            <div><p style={{ color: '#10b981', fontSize: '13px', fontWeight: 600 }}>+{fmt(income)}</p><p style={{ color: '#4b5563', fontSize: '11px' }}>income</p></div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <div><p style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>-{fmt(expenses)}</p><p style={{ color: '#4b5563', fontSize: '11px' }}>expenses</p></div>
          </div>
        </div>

        <StatCard label="Total Income" value={fmt(income)} sub="This month" color="#10b981" icon="↗" />
        <StatCard label="Total Expenses" value={fmt(expenses)} sub="This month" color="#ef4444" icon="↙" />
        <StatCard label="Savings Rate" value={`${savingsRate}%`} sub="of income saved" color="#6366f1" icon="◎" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '14px', marginBottom: '20px' }}>
        {/* Area chart */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <p style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>Income vs Expenses</p>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ color: '#6b7280', fontSize: '12px' }}>Income</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
                <span style={{ color: '#6b7280', fontSize: '12px' }}>Expenses</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" dot={false} />
              <Area type="monotone" dataKey="Expenses" stroke="#6366f1" strokeWidth={2} fill="url(#expGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut */}
        <div style={cardStyle}>
          <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>Spending Breakdown</p>
          {donutData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" strokeWidth={0}>
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {donutData.slice(0, 4).map(({ name, value }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: CATEGORY_COLORS[name] || '#6b7280', flexShrink: 0 }} />
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>{name}</span>
                    </div>
                    <span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}>{fmt(value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: '#374151', fontSize: '28px' }}>○</p>
              <p style={{ color: '#6b7280', fontSize: '13px' }}>No expenses yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <p style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>Recent Transactions</p>
          <a href="/transactions" style={{ color: '#6366f1', fontSize: '12px', fontWeight: 500, textDecoration: 'none' }}>View all →</a>
        </div>
        {recent.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#374151', fontSize: '32px', marginBottom: '8px' }}>+</p>
            <p style={{ color: '#6b7280', fontSize: '13px' }}>No transactions yet. Add your first one!</p>
          </div>
        ) : (
          <div>
            {recent.map((tx, i) => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: i < recent.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${CATEGORY_COLORS[tx.category] || '#6b7280'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: CATEGORY_COLORS[tx.category] || '#6b7280', fontSize: '16px' }}>
                    {tx.type === 'income' ? '↙' : '↗'}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#e2e8f0', fontSize: '13.5px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || tx.category}</p>
                  <p style={{ color: '#4b5563', fontSize: '11.5px', marginTop: '2px' }}>{tx.category} · {tx.date}</p>
                </div>
                <span style={{ fontWeight: 700, fontSize: '14px', color: tx.type === 'income' ? '#10b981' : '#f87171', flexShrink: 0 }}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
