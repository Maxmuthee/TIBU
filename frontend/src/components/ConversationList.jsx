import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Plus,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
  SquarePen,
} from 'lucide-react'
import { cn } from '../lib/utils'

function formatDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  profile,
  onEditProfile,
  isOpen,
  onClose,
}) {
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const startEdit = (conv, e) => {
    e.stopPropagation()
    setEditingId(conv.id)
    setEditTitle(conv.title)
  }

  const commitEdit = (id) => {
    if (editTitle.trim()) onRename(id, editTitle.trim())
    setEditingId(null)
  }

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'flex flex-col w-64 xl:w-72 bg-slate-900 text-white z-30 transition-transform duration-300 flex-shrink-0',
          'fixed inset-y-0 left-0 lg:relative',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top bar: profile + new chat */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          {/* Profile avatar + name */}
          <button
            onClick={onEditProfile}
            className="flex items-center gap-2.5 min-w-0 group"
            title="Edit profile"
          >
            <div className="w-8 h-8 rounded-lg bg-usiu-gold text-usiu-blue text-xs font-black flex items-center justify-center flex-shrink-0">
              {profile?.initials || '?'}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold text-white truncate group-hover:text-usiu-gold transition-colors">
                {profile?.name || 'Student'}
              </p>
              <p className="text-[10px] text-white/40 truncate">
                {profile?.major || 'USIU-Africa'}
              </p>
            </div>
          </button>

          {/* New chat icon button */}
          <button
            onClick={() => { onNew(); onClose?.() }}
            title="New conversation"
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors flex-shrink-0"
          >
            <SquarePen className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
          {conversations.length === 0 ? (
            <div className="text-center px-4 py-16 text-white/30">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-xs leading-relaxed">No conversations yet.<br />Ask TIBU something to start.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {conversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden px-2"
                >
                  <div
                    className={cn(
                      'group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors mb-0.5',
                      conv.id === activeId
                        ? 'bg-white/15 text-white'
                        : 'text-white/60 hover:bg-white/8 hover:text-white'
                    )}
                    onClick={() => { onSelect(conv.id); onClose?.() }}
                  >
                    {editingId === conv.id ? (
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit(conv.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-xs bg-white/10 border border-white/30 rounded px-2 py-0.5 outline-none text-white"
                      />
                    ) : (
                      <p className="flex-1 text-xs font-medium truncate">{conv.title}</p>
                    )}

                    {/* Hover actions */}
                    {editingId === conv.id ? (
                      <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => commitEdit(conv.id)} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-0.5 text-white/40 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : confirmDeleteId === conv.id ? (
                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] text-white/60 mr-0.5">Delete?</span>
                        <button
                          onClick={() => { onDelete(conv.id); setConfirmDeleteId(null) }}
                          className="p-0.5 text-rose-400 hover:text-rose-300 font-bold text-[10px]"
                          title="Confirm delete"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-0.5 text-white/40 hover:text-white font-bold text-[10px]"
                          title="Cancel"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button onClick={(e) => startEdit(conv, e)} className="p-0.5 text-white/40 hover:text-white" title="Rename">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => setConfirmDeleteId(conv.id)} className="p-0.5 text-white/40 hover:text-rose-400" title="Delete">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Bottom: new chat button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => { onNew(); onClose?.() }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New conversation
          </button>
        </div>
      </aside>
    </>
  )
}
