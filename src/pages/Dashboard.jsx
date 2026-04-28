import { useMemo, useState } from 'react'
import { useTransactions } from '../contexts/TransactionsContext'
import AddTransaction, { CATEGORY_COLORS } from '../components/AddTransaction'
import DateRangeFilter from '../components/DateRangeFilter'
import { DEFAULT_PRESET, getRange, inRange, rangeLabel, buildBuckets } from '../lib/dateRange'
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280' }}>{label}</span>
        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color }}>{icon}</div>
      </div>
      <p style={{ color: 'white', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.8px', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: '#4b5563', fontSize: '11px', marginTop: '5px' }}>{sub}</p>}
    </div>
  )
}

const ChartTip = ({ active, payload, label }) => active && payload?.length ? (
  <div style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px' }}>
    {label && <p style={{ color: '#6b7280', marginBottom: '6px' }}>{label}</p>}
    {payload.map(p => <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {fmt(p.value)}</p>)}
  </div>
) : null

const PieTip = ({ active, payload }) => active && payload?.length ? (
  <div style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px 12px', fontSize: '12px' }}>
    <p style={{ color: '#e2e8f0', fontWeight: 600 }}>{payload[0].name}</p>
    <p style={{ color: payload[0].payload.fill, marginTop: '2px' }}>{fmt(payload[0].value)}</p>
  </div>
) : null

export default function Dashboard() {
  const { transactions, loading } = useTransactions()
  const [presetKey, setPresetKey] = useState(DEFAULT_PRESET)
  const [customRange, setCustomRange] = useState(null)

  const now = new Date()
  const range = useMemo(() => getRange(presetKey, customRange), [presetKey, customRange])
  const rangeTx = useMemo(() => transactions.filter(t => inRange(t.date, range)), [transactions, range])
  const rangeName = rangeLabel(presetKey, range)

  const income = rangeTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = rangeTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expenses
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0

  const byCategory = rangeTx.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount; return acc
  }, {})
  const donutData = Object.entries(byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const trendData = useMemo(() => buildBuckets(range, transactions).map(b => ({ month: b.label, Income: b.Income, Expenses: b.Expenses })), [range, transactions])

  const recent = rangeTx.slice(0, 8)

  function handleRangeChange(key, custom) {
    setPresetKey(key)
    setCustomRange(custom)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div className="page-wrap">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '2px' }}>
            {now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'}, Josh
          </p>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>Overview</h1>
        </div>
        <AddTransaction />
      </div>

      {/* Date range filter */}
      <div style={{ marginBottom: '18px' }}>
        <DateRangeFilter value={presetKey} custom={customRange} onChange={handleRangeChange} />
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="card" style={{ background: 'linear-gradient(145deg, #13132b, #0f0f20)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '90px', height: '90px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)' }} />
          <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px' }}>Net Balance · {rangeName}</p>
          <p style={{ color: 'white', fontSize: '32px', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1 }}>{fmt(balance)}</p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '14px' }}>
            <div><p style={{ color: '#10b981', fontSize: '13px', fontWeight: 600 }}>+{fmt(income)}</p><p style={{ color: '#4b5563', fontSize: '11px' }}>income</p></div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <div><p style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>-{fmt(expenses)}</p><p style={{ color: '#4b5563', fontSize: '11px' }}>expenses</p></div>
          </div>
        </div>
        <StatCard label="Income" value={fmt(income)} sub={rangeName} color="#10b981" icon="↗" />
        <StatCard label="Expenses" value={fmt(expenses)} sub={rangeName} color="#ef4444" icon="↙" />
        <StatCard label="Savings" value={`${savingsRate}%`} sub="of income" color="#6366f1" icon="◎" />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>Income vs Expenses</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[['Income', '#10b981'], ['Expenses', '#6366f1']].map(([n, c]) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c }} />
                  <span style={{ color: '#6b7280', fontSize: '11px' }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.25}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.25}/><stop offset="100%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} width={50} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fill="url(#ig)" dot={false} />
              <Area type="monotone" dataKey="Expenses" stroke="#6366f1" strokeWidth={2} fill="url(#eg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>Spending Breakdown</p>
          {donutData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={2} dataKey="value" strokeWidth={0}>
                    {donutData.map((e, i) => <Cell key={i} fill={CATEGORY_COLORS[e.name] || '#6b7280'} />)}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '8px' }}>
                {donutData.slice(0, 4).map(({ name, value }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: CATEGORY_COLORS[name] || '#6b7280' }} />
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>{name}</span>
                    </div>
                    <span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}>{fmt(value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: '#374151', fontSize: '24px' }}>○</p>
              <p style={{ color: '#6b7280', fontSize: '13px' }}>No expenses yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <p style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>Recent Transactions</p>
          <a href="/transactions" style={{ color: '#6366f1', fontSize: '12px', fontWeight: 500, textDecoration: 'none' }}>View all →</a>
        </div>
        {recent.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>No transactions yet. Add your first one!</div>
        ) : (
          <div>
            {recent.map((tx, i) => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', borderBottom: i < recent.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${CATEGORY_COLORS[tx.category] || '#6b7280'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: CATEGORY_COLORS[tx.category] || '#6b7280', fontSize: '15px' }}>{tx.type === 'income' ? '↙' : '↗'}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || tx.category}</p>
                  <p style={{ color: '#4b5563', fontSize: '11px', marginTop: '2px' }}>{tx.category} · {tx.date}</p>
                </div>
                <span style={{ fontWeight: 700, fontSize: '13px', color: tx.type === 'income' ? '#10b981' : '#f87171', flexShrink: 0 }}>
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
