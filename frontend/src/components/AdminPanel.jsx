import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Shield, LogOut, Trash2, Plus, FileText, Briefcase,
  Calendar, AlertCircle, CheckCircle2, XCircle, Loader2, X
} from 'lucide-react'
import { cn } from '../lib/utils'

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api'

function useAdminApi(token) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const get = (path) => fetch(`${API_BASE}${path}`, { headers }).then((r) => r.json())
  const del = (path) =>
    fetch(`${API_BASE}${path}`, { method: 'DELETE', headers }).then((r) => r.json())
  const post = (path, body) =>
    fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) }).then((r) => r.json())

  return { get, del, post }
}

function Toast({ toast }) {
  if (!toast) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium',
        toast.type === 'error'
          ? 'bg-red-50 border border-red-200 text-red-700'
          : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
      )}
    >
      {toast.type === 'error' ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
      {toast.message}
    </motion.div>
  )
}

function ConfirmDelete({ label, onConfirm, onCancel }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">Delete {label}?</span>
      <button onClick={onConfirm} className="text-xs font-bold text-rose-600 hover:text-rose-700">Yes</button>
      <button onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-600">No</button>
    </div>
  )
}

/* ── Papers Tab ── */
function PapersTab({ api, showToast }) {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await api.get('/admin/papers')
    setPapers(data.papers || [])
    setLoading(false)
  }, [api])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    await api.del(`/admin/papers/${id}`)
    showToast('Paper deleted.')
    setConfirmId(null)
    load()
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">{papers.length} paper{papers.length !== 1 ? 's' : ''} in the index</p>
      {papers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
          No papers uploaded yet.
        </div>
      ) : (
        papers.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4">
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-700 text-sm truncate">{p.title}</p>
              <p className="text-xs text-slate-400">{p.course_code} {p.year && `· ${p.year}`} · {p.filename} · {(p.size_bytes / 1024).toFixed(1)} KB</p>
            </div>
            {confirmId === p.id ? (
              <ConfirmDelete label="paper" onConfirm={() => handleDelete(p.id)} onCancel={() => setConfirmId(null)} />
            ) : (
              <button onClick={() => setConfirmId(p.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}

/* ── Lost & Found Tab ── */
function LostFoundTab({ api, showToast }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await api.get('/admin/lost-found')
    setItems(data.items || [])
    setLoading(false)
  }, [api])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    await api.del(`/admin/lost-found/${id}`)
    showToast('Item removed.')
    setConfirmId(null)
    load()
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">{items.length} item{items.length !== 1 ? 's' : ''}</p>
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">No items reported.</div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4">
            <span className={cn('shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold',
              item.type === 'lost' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
            )}>{item.type}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-700 text-sm truncate">{item.title}</p>
              <p className="text-xs text-slate-400 truncate">{item.description}</p>
              {item.contact && <p className="text-xs text-usiu-blue">{item.contact}</p>}
            </div>
            {confirmId === item.id ? (
              <ConfirmDelete label="item" onConfirm={() => handleDelete(item.id)} onCancel={() => setConfirmId(null)} />
            ) : (
              <button onClick={() => setConfirmId(item.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}

/* ── Opportunities Tab ── */
function OpportunitiesTab({ api, showToast }) {
  const [opportunities, setOpportunities] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState(null)
  const [showForm, setShowForm] = useState(null) // 'opp' | 'event' | null

  const load = useCallback(async () => {
    setLoading(true)
    const data = await api.get('/admin/opportunities')
    setOpportunities(data.opportunities || [])
    setEvents(data.events || [])
    setLoading(false)
  }, [api])

  useEffect(() => { load() }, [load])

  const handleDeleteOpp = async (id) => {
    await api.del(`/admin/opportunities/${id}`)
    showToast('Opportunity deleted.')
    setConfirmId(null)
    load()
  }

  const handleDeleteEvent = async (id) => {
    await api.del(`/admin/events/${id}`)
    showToast('Event deleted.')
    setConfirmId(null)
    load()
  }

  const handleAddOpp = async (e) => {
    e.preventDefault()
    const f = e.target
    await api.post('/admin/opportunities', {
      type: f.type.value,
      title: f.title.value,
      company: f.company.value,
      description: f.description.value,
      requirements: f.requirements.value,
      deadline: f.deadline.value,
    })
    showToast('Opportunity added.')
    f.reset()
    setShowForm(null)
    load()
  }

  const handleAddEvent = async (e) => {
    e.preventDefault()
    const f = e.target
    await api.post('/admin/events', {
      title: f.title.value,
      category: f.category.value,
      date: f.date.value,
      location: f.location.value,
      description: f.description.value,
    })
    showToast('Event added.')
    f.reset()
    setShowForm(null)
    load()
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none text-sm'

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>

  return (
    <div className="space-y-6">
      {/* Add buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowForm(showForm === 'opp' ? null : 'opp')}
          className="flex items-center gap-2 bg-usiu-blue hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Internship/Job
        </button>
        <button
          onClick={() => setShowForm(showForm === 'event' ? null : 'event')}
          className="flex items-center gap-2 bg-usiu-gold hover:bg-yellow-400 text-usiu-blue text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Event
        </button>
      </div>

      {/* Add Opportunity Form */}
      <AnimatePresence>
        {showForm === 'opp' && (
          <motion.form
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            onSubmit={handleAddOpp}
            className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-slate-700 text-sm">New Internship / Job</h4>
              <button type="button" onClick={() => setShowForm(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <select name="type" className={inputCls}>
              <option value="internship">Internship</option>
              <option value="job">Job</option>
            </select>
            <input name="title" className={inputCls} placeholder="Title *" required />
            <input name="company" className={inputCls} placeholder="Company *" required />
            <textarea name="description" className={inputCls} placeholder="Description *" required rows={2} />
            <input name="requirements" className={inputCls} placeholder="Requirements (optional)" />
            <input name="deadline" className={inputCls} placeholder="Deadline e.g. 2026-05-01 (optional)" />
            <button type="submit" className="w-full bg-usiu-blue hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-sm transition-all">
              Post Opportunity
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Add Event Form */}
      <AnimatePresence>
        {showForm === 'event' && (
          <motion.form
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            onSubmit={handleAddEvent}
            className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-slate-700 text-sm">New Event</h4>
              <button type="button" onClick={() => setShowForm(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <input name="title" className={inputCls} placeholder="Title *" required />
            <select name="category" className={inputCls}>
              <option value="academic">Academic</option>
              <option value="club">Club</option>
              <option value="social">Social</option>
              <option value="career">Career</option>
              <option value="health">Health & Wellness</option>
            </select>
            <input name="date" className={inputCls} placeholder="Date e.g. 2026-05-10 *" required />
            <input name="location" className={inputCls} placeholder="Location *" required />
            <textarea name="description" className={inputCls} placeholder="Description *" required rows={2} />
            <button type="submit" className="w-full bg-usiu-gold hover:bg-yellow-400 text-usiu-blue font-bold py-2.5 rounded-xl text-sm transition-all">
              Post Event
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Internships list */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5" /> Internships & Jobs ({opportunities.length})
        </h4>
        <div className="space-y-2">
          {opportunities.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">None posted.</p>
          ) : opportunities.map((o) => (
            <div key={o.id} className="bg-white rounded-xl border border-slate-200 px-5 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700 text-sm truncate">{o.title}</p>
                <p className="text-xs text-slate-400">{o.company} {o.deadline && `· Deadline: ${o.deadline}`}</p>
              </div>
              {confirmId === `opp-${o.id}` ? (
                <ConfirmDelete label="opportunity" onConfirm={() => handleDeleteOpp(o.id)} onCancel={() => setConfirmId(null)} />
              ) : (
                <button onClick={() => setConfirmId(`opp-${o.id}`)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Events list */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> Events ({events.length})
        </h4>
        <div className="space-y-2">
          {events.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">None posted.</p>
          ) : events.map((e) => (
            <div key={e.id} className="bg-white rounded-xl border border-slate-200 px-5 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700 text-sm truncate">{e.title}</p>
                <p className="text-xs text-slate-400">{e.date} · {e.location}</p>
              </div>
              {confirmId === `evt-${e.id}` ? (
                <ConfirmDelete label="event" onConfirm={() => handleDeleteEvent(e.id)} onCancel={() => setConfirmId(null)} />
              ) : (
                <button onClick={() => setConfirmId(`evt-${e.id}`)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Main Admin Panel ── */
const TABS = [
  { id: 'papers', label: 'Past Papers', icon: FileText },
  { id: 'lost-found', label: 'Lost & Found', icon: AlertCircle },
  { id: 'opportunities', label: 'Opportunities & Events', icon: Briefcase },
]

export default function AdminPanel() {
  const [token, setToken] = useState(() => sessionStorage.getItem('tibu_admin_token') || '')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [tab, setTab] = useState('papers')
  const [toast, setToast] = useState(null)

  const api = useAdminApi(token)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoggingIn(true)
    setLoginError('')
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      sessionStorage.setItem('tibu_admin_token', data.token)
      setToken(data.token)
    } catch {
      setLoginError('Incorrect password.')
    } finally {
      setLoggingIn(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('tibu_admin_token')
    setToken('')
    setPassword('')
  }

  /* ── Login screen ── */
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 space-y-5"
        >
          <div className="text-center">
            <div className="w-14 h-14 bg-usiu-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">TIBU Admin</h1>
            <p className="text-sm text-slate-400 mt-1">Restricted access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none text-sm"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
            {loginError && <p className="text-xs text-red-600">{loginError}</p>}
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-usiu-blue hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {loggingIn ? 'Verifying…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-300">
            Go back to <a href="/" className="text-usiu-blue hover:underline">TIBU</a>
          </p>
        </motion.div>
      </div>
    )
  }

  /* ── Dashboard ── */
  return (
    <div className="min-h-screen bg-slate-100">
      <AnimatePresence>{toast && <Toast toast={toast} />}</AnimatePresence>

      {/* Header */}
      <header className="bg-usiu-blue text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-usiu-gold" />
          <span className="font-bold">TIBU Admin Panel</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-white/60 hover:text-white text-xs transition-colors">Back to TIBU</a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  tab === t.id
                    ? 'bg-usiu-blue text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div>
          {tab === 'papers' && <PapersTab api={api} showToast={showToast} />}
          {tab === 'lost-found' && <LostFoundTab api={api} showToast={showToast} />}
          {tab === 'opportunities' && <OpportunitiesTab api={api} showToast={showToast} />}
        </div>
      </div>
    </div>
  )
}
