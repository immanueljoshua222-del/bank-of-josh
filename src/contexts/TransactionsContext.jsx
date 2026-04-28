import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const TransactionsContext = createContext({
  transactions: [], loading: true,
  refresh: () => {}, addLocal: () => {}, removeLocal: () => {}, updateLocal: () => {},
})

const sortDesc = arr => [...arr].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

export function TransactionsProvider({ children }) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadedFor, setLoadedFor] = useState(null)

  const refresh = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
    setLoadedFor(user.id)
  }, [user])

  useEffect(() => {
    if (!user) {
      setTransactions([]); setLoading(false); setLoadedFor(null); return
    }
    if (loadedFor === user.id) return
    setLoading(true)
    refresh()
  }, [user, loadedFor, refresh])

  const addLocal = useCallback(tx => {
    setTransactions(prev => sortDesc([tx, ...prev]))
  }, [])

  const removeLocal = useCallback(id => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }, [])

  const updateLocal = useCallback(tx => {
    setTransactions(prev => sortDesc(prev.map(t => t.id === tx.id ? tx : t)))
  }, [])

  return (
    <TransactionsContext.Provider value={{ transactions, loading, refresh, addLocal, removeLocal, updateLocal }}>
      {children}
    </TransactionsContext.Provider>
  )
}

export const useTransactions = () => useContext(TransactionsContext)
