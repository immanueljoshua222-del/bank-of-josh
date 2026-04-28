// ─── Rule-based smart parser ─────────────────────────────────────────────────
// Used for parse (instant, no API key needed). Gemini used only for insights.

function extractAmount(text) {
  const t = text.replace(/,/g, '')
  const patterns = [
    { re: /(\d+(?:\.\d+)?)\s*(?:cr|crore)/i,  mul: 10_000_000 },
    { re: /(\d+(?:\.\d+)?)\s*(?:l\b|lakh|lakhs?)/i, mul: 100_000 },
    { re: /(\d+(?:\.\d+)?)\s*k\b/i,            mul: 1_000 },
    { re: /[₹]\s*(\d+(?:\.\d+)?)/,             mul: 1 },
    { re: /\brs\.?\s*(\d+(?:\.\d+)?)/i,        mul: 1 },
    { re: /\b(\d{3,8}(?:\.\d+)?)\b/,           mul: 1 },
  ]
  for (const { re, mul } of patterns) {
    const m = t.match(re)
    if (m) return Math.round(parseFloat(m[1]) * mul)
  }
  return 0
}

function extractType(text) {
  const t = text.toLowerCase()
  const incomeSignals = [
    'paid me', 'got paid', 'received', 'earned', 'income', 'salary',
    'payment from', 'charged client', 'invoiced', 'collected', 'sold',
    'shoot', 'shooting', 'portrait', 'wedding', 'event', 'concert',
    'photoshoot', 'session', 'coverage', 'booked', 'delivered project',
  ]
  if (incomeSignals.some(w => t.includes(w))) return 'income'
  return 'expense'
}

function extractCategory(text, type) {
  const t = text.toLowerCase()
  if (type === 'income') {
    if (/shoot|portrait|wedding|event|concert|photo|session|coverage/i.test(t)) return 'Photography Income'
    if (/freelance|client|project|design|edit/i.test(t)) return 'Freelance Income'
    return 'Other Income'
  }
  if (/food|restaurant|cafe|zomato|swiggy|blinkit|eat|lunch|dinner|breakfast|chai|biryani|pizza|snack|coffee|hotel|dhaba/i.test(t)) return 'Food'
  if (/uber|ola|auto|taxi|cab|bus|metro|train|petrol|diesel|fuel|rapido|rickshaw|flight|ticket/i.test(t)) return 'Transport'
  if (/rent|house|flat|pg|hostel|accommodation|landlord/i.test(t)) return 'Rent'
  if (/electricity|water|gas|internet|wifi|broadband|mobile|phone|recharge|bill|jio|airtel/i.test(t)) return 'Utilities'
  if (/movie|netflix|prime|spotify|hotstar|game|entertainment|party|pub|bar|concert ticket/i.test(t)) return 'Entertainment'
  if (/doctor|medicine|hospital|medical|health|pharmacy|chemist|clinic|tablet|injection/i.test(t)) return 'Healthcare'
  if (/amazon|flipkart|meesho|clothes|shirt|shoe|shopping|mall|bought|purchase|myntra/i.test(t)) return 'Shopping'
  return 'Other'
}

function extractDescription(text) {
  return text
    .replace(/(\d+(?:\.\d+)?)\s*(?:k|l|lakh|cr|crore)/gi, '')
    .replace(/[₹][\d,]+/g, '')
    .replace(/\b\d{4,}\b/g, '')
    .replace(/\b(spent|paid|got|received|bought|i |for |on |from )/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, c => c.toUpperCase())
    .slice(0, 50) || text.slice(0, 50)
}

export function parseNaturalLanguage(text) {
  const today = new Date().toISOString().split('T')[0]
  const type = extractType(text)
  return Promise.resolve({
    type,
    amount: extractAmount(text),
    category: extractCategory(text, type),
    description: extractDescription(text),
    date: today,
  })
}

// ─── Gemini (insights + budget only) ─────────────────────────────────────────

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

async function callGemini(prompt) {
  // Try models in order until one works
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro']
  let lastErr

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`)
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Empty response')
      return text.trim()
    } catch (err) {
      console.warn(`Model ${model} failed:`, err.message)
      lastErr = err
    }
  }
  throw lastErr
}

// ─── Rule-based fallbacks for insights ───────────────────────────────────────

function ruleInsights(transactions, month) {
  const fmt = n => '₹' + Number(n).toLocaleString('en-IN')
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savings = income - expenses
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0

  const byCategory = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount; return acc
  }, {})
  const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])

  const lines = []
  if (income > 0) lines.push(`In ${month} you earned ${fmt(income)}.`)
  if (top[0]) lines.push(`Your biggest spend was ${top[0][0]} at ${fmt(top[0][1])}${expenses > 0 ? ` — ${Math.round(top[0][1] / expenses * 100)}% of total expenses` : ''}.`)
  if (savingsRate >= 0) lines.push(savings >= 0 ? `You saved ${fmt(savings)} (${savingsRate}% of income) — ${savingsRate >= 30 ? 'great job!' : savingsRate >= 15 ? 'decent, aim for 30%.' : 'try to cut back a bit.'}` : `You overspent by ${fmt(Math.abs(savings))} this month.`)
  if (top[1]) lines.push(`Second highest spend was ${top[1][0]} at ${fmt(top[1][1])}.`)
  return lines.join(' ')
}

function ruleBudget(transactions) {
  const fmt = n => '₹' + Number(n).toLocaleString('en-IN')
  const months = {}
  transactions.forEach(t => {
    const m = t.date?.slice(0, 7)
    if (!m) return
    if (!months[m]) months[m] = { income: 0, expense: 0 }
    months[m][t.type === 'income' ? 'income' : 'expense'] += t.amount
  })
  const vals = Object.values(months)
  if (!vals.length) return "Add more transactions and I'll suggest a budget!"
  const avgIncome = Math.round(vals.reduce((s, v) => s + v.income, 0) / vals.length)
  const avgExpense = Math.round(vals.reduce((s, v) => s + v.expense, 0) / vals.length)

  return `Based on your history, your average monthly income is ${fmt(avgIncome)} and you spend about ${fmt(avgExpense)}. Try budgeting ${fmt(Math.round(avgIncome * 0.5))} for living expenses, ${fmt(Math.round(avgIncome * 0.2))} for savings, and keep ${fmt(Math.round(avgIncome * 0.3))} flexible for gear and personal spending. Tip: even saving ₹500/week adds up to ${fmt(26000)} a year.`
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateInsights(transactions, month) {
  if (!transactions?.length) return "Add some transactions first and I'll analyse them!"

  try {
    const summary = transactions
      .map(t => `${t.date} | ${t.type} | ₹${t.amount} | ${t.category} | ${t.description || ''}`)
      .join('\n')
    const prompt = `You are a personal finance advisor for a 24-year-old Indian freelance photographer living alone.
Transactions for ${month}:
${summary}
Give 3-4 short actionable insights using ₹ numbers. Be friendly and direct. Plain text only, no bullet points, no markdown. Max 150 words.`
    return await callGemini(prompt)
  } catch (err) {
    console.warn('Gemini insights failed, using rule-based:', err.message)
    return ruleInsights(transactions, month)
  }
}

export async function suggestBudget(transactions) {
  if (!transactions?.length) return "Add some transactions and I'll suggest a budget!"

  try {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const byCategory = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount; return acc
    }, {})
    const prompt = `Indian freelance photographer, 24, lives alone.
Total income across data: ₹${income}
Spending by category: ${Object.entries(byCategory).map(([k, v]) => `${k}: ₹${v}`).join(', ')}
Suggest a realistic monthly budget in 2-3 sentences with specific ₹ amounts. Add one saving tip. Plain text only.`
    return await callGemini(prompt)
  } catch (err) {
    console.warn('Gemini budget failed, using rule-based:', err.message)
    return ruleBudget(transactions)
  }
}
