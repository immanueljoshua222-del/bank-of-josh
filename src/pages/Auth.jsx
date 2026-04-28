import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        const { error } = await signUp(email, password)
        if (error) throw error
        setMessage('Check your email to confirm your account.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#09090f' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-14" style={{ background: 'linear-gradient(145deg, #0f0f1e 0%, #13131f 100%)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span className="text-white font-semibold tracking-tight">Bank of Josh</span>
        </div>

        <div>
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
              AI-Powered Finance
            </div>
            <h1 className="text-5xl font-bold text-white leading-tight tracking-tight mb-4">
              Your money,<br />clearly.
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Track every rupee, understand your patterns, and make smarter decisions with AI insights.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { title: 'AI Smart Entry', desc: 'Just type what you spent — AI fills in everything' },
              { title: 'Live Insights', desc: 'Gemini analyses your spending every month' },
              { title: 'Cloud Sync', desc: 'Access your data from any device, anytime' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0" style={{ background: 'rgba(99,102,241,0.2)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{f.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-sm">© 2026 Bank of Josh. Built for creators.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-slate-400 text-sm">
              {isLogin ? 'Enter your credentials to continue' : 'Start tracking your finances today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-slate-600 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-slate-600 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}
            {message && (
              <div className="px-4 py-3 rounded-xl text-sm text-emerald-300" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all mt-2"
              style={{ background: loading ? '#1e1e30' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); setMessage('') }} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
