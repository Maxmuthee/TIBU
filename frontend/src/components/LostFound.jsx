import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { getLostFoundItems, reportLostFound } from '../services/api'
import { cn } from '../lib/utils'

export default function LostFound() {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('')
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => {
    loadItems()
  }, [filter])

  const loadItems = async () => {
    try {
      const data = await getLostFoundItems(filter)
      setItems(data.items)
    } catch {
      // Items will remain empty; user can retry by changing filter
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target
    const item = {
      type: form.type.value,
      title: form.title.value,
      description: form.description.value,
      location: form.location.value,
      contact: form.contact.value,
    }
    setSubmitting(true)
    try {
      await reportLostFound(item)
      form.reset()
      setShowForm(false)
      loadItems()
      showToast('Item reported successfully!')
    } catch {
      showToast('Failed to submit. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide p-4 md:p-8 space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              'fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium',
              toast.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            )}
          >
            {toast.type === 'error'
              ? <XCircle className="w-4 h-4 shrink-0" />
              : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 items-center flex-wrap">
        {['', 'lost', 'found'].map((f) => (
          <button
            key={f}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              filter === f ? "bg-usiu-blue text-white shadow-lg shadow-usiu-blue/20" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
            onClick={() => setFilter(f)}
          >
            {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="flex-1" />
        <button
          className="bg-usiu-gold hover:bg-yellow-400 text-usiu-blue font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2"
          onClick={() => setShowForm(!showForm)}
        >
          <AlertCircle className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Report Item'}
        </button>
      </div>

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-700">Report an Item</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Type</label>
            <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all bg-white" name="type" required>
              <option value="lost">I lost something</option>
              <option value="found">I found something</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Item Title</label>
            <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all" name="title" placeholder="e.g., Blue Backpack" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
            <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all resize-y min-h-[80px]" name="description" placeholder="Describe the item..." required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Known Location</label>
            <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all" name="location" placeholder="e.g., Library, 2nd floor" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact Info</label>
            <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all" name="contact" placeholder="Email or phone" />
          </div>
          <button className="w-full bg-usiu-blue hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-usiu-blue/20 transition-all disabled:opacity-50" type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </motion.form>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No items reported. If you've lost something, report it above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <span className={cn(
                "inline-block px-3 py-1 rounded-full text-xs font-bold",
                item.type === 'lost' ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
              )}>{item.type}</span>
              <h3 className="font-semibold text-slate-700 mt-2">{item.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{item.description}</p>
              {item.location && <p className="text-sm text-slate-500 mt-2">Location: {item.location}</p>}
              {item.contact && <p className="text-sm font-semibold text-usiu-blue mt-1">Contact: {item.contact}</p>}
              <p className="text-xs text-slate-400 mt-2">
                Posted: {new Date(item.posted_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
