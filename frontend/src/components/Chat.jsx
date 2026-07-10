import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Send, School, History, ArrowUp } from 'lucide-react'
import Markdown from 'react-markdown'
import { askTibu } from '../services/api'
import { cn } from '../lib/utils'
import { useConversations } from '../hooks/useConversations'
import ConversationList from './ConversationList'

function welcomeMessage(profile) {
  const firstName = profile?.name?.split(' ')[0]
  const name = firstName ? `, ${firstName}` : ''
  const context =
    profile?.major && profile?.year
      ? ` As a **${profile.year} ${profile.major}** student, I can give you tailored answers on courses, prerequisites, fees, and career paths.`
      : ''
  return {
    role: 'assistant',
    content: `Hi${name}! I'm **TIBU**, your AI campus companion at USIU-Africa.${context} Ask me anything about courses, fees, campus locations, events, or any university service. How can I help you today?`,
    sources: [],
  }
}

// ── Message row ──────────────────────────────────────────────────────────────
function MessageRow({ msg, profile }) {
  const isUser = msg.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('w-full py-5', isUser ? 'bg-transparent' : 'bg-slate-50/60')}
    >
      <div className="max-w-3xl mx-auto px-4 md:px-8 flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-usiu-blue text-white text-xs font-black flex items-center justify-center">
              {profile?.initials || '?'}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-usiu-gold text-usiu-blue flex items-center justify-center">
              <School className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-xs font-semibold text-slate-500 mb-1.5">
            {isUser ? (profile?.name?.split(' ')[0] || 'You') : 'TIBU'}
          </p>
          <div className="text-slate-800 text-sm leading-relaxed markdown-body">
            <Markdown>{msg.content}</Markdown>
          </div>
          {msg.sources?.length > 0 && (
            <p className="mt-3 text-[11px] text-slate-400 border-t border-slate-200 pt-2">
              Sources: {msg.sources.join(' · ')}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full py-5 bg-slate-50/60"
    >
      <div className="max-w-3xl mx-auto px-4 md:px-8 flex gap-4">
        <div className="w-8 h-8 rounded-full bg-usiu-gold text-usiu-blue flex items-center justify-center flex-shrink-0">
          <School className="w-4 h-4" />
        </div>
        <div className="flex-1 pt-2">
          <p className="text-xs font-semibold text-slate-500 mb-2">TIBU</p>
          <div className="flex gap-1.5 items-center">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ profile, onSuggestion }) {
  const firstName = profile?.name?.split(' ')[0] || 'there'
  const suggestions = [
    'What courses should I take next semester?',
    'How do I pay my fees via M-Pesa?',
    'Where is the library on campus?',
    'What internship opportunities are available?',
  ]
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-usiu-gold text-usiu-blue flex items-center justify-center mb-5 shadow-lg">
        <School className="w-7 h-7" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">
        Hello, {firstName}
      </h2>
      <p className="text-slate-500 text-sm mb-8">
        Ask me anything about USIU-Africa — courses, fees, campus, events.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-usiu-blue hover:bg-usiu-blue/5 text-sm text-slate-600 hover:text-usiu-blue transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main Chat component ───────────────────────────────────────────────────────
export default function Chat({ externalInput = '', onInputConsumed, profile, onEditProfile }) {
  const WELCOME = [welcomeMessage(profile)]

  const {
    conversations,
    activeId,
    activeMessages,
    newConversation,
    appendMessage,
    selectConversation,
    deleteConversation,
    renameConversation,
  } = useConversations(WELCOME)

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [convPanelOpen, setConvPanelOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Show the welcome message as the first assistant turn even for new convs
  const displayMessages = activeMessages.length === 0 ? WELCOME : activeMessages
  const isNewConversation = activeMessages.length === 0

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages, loading])

  useEffect(() => {
    if (externalInput) {
      setInput(externalInput)
      onInputConsumed?.()
      inputRef.current?.focus()
    }
  }, [externalInput, onInputConsumed])

  const send = async (question) => {
    if (!question.trim() || loading) return

    const userMsg = { role: 'user', content: question }
    appendMessage(userMsg, activeId)

    setInput('')
    setLoading(true)

    try {
      const history = displayMessages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }))

      const data = await askTibu(question, history, profile)
      appendMessage({ role: 'assistant', content: data.answer, sources: data.sources || [] }, activeId)
    } catch {
      appendMessage(
        {
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again in a moment, or visit the Registrar's office for immediate assistance.",
          sources: [],
        },
        activeId
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    send(input)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Left: Conversation panel */}
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={newConversation}
        onDelete={deleteConversation}
        onRename={renameConversation}
        profile={profile}
        onEditProfile={onEditProfile}
        isOpen={convPanelOpen}
        onClose={() => setConvPanelOpen(false)}
      />

      {/* Right: Chat area */}
      <div className="flex flex-col flex-1 min-w-0 h-full">

        {/* Mobile history toggle */}
        <div className="lg:hidden flex items-center gap-2 px-4 py-2 border-b border-slate-100 bg-white">
          <button
            onClick={() => setConvPanelOpen(true)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-usiu-blue transition-colors"
          >
            <History className="w-4 h-4" />
            <span>Conversations</span>
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {isNewConversation ? (
            // Empty state with suggestions
            <EmptyState profile={profile} onSuggestion={(s) => { setInput(s); inputRef.current?.focus() }} />
          ) : (
            <div>
              <AnimatePresence initial={false}>
                {displayMessages.map((msg, i) => (
                  <MessageRow key={`${activeId}-${i}`} msg={msg} profile={profile} />
                ))}
              </AnimatePresence>

              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:px-8 md:py-5">
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto relative"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                // Auto-grow
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
              }}
              onKeyDown={handleKeyDown}
              placeholder="Message TIBU..."
              disabled={loading}
              className="w-full resize-none bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 pr-14 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-usiu-blue focus:ring-2 focus:ring-usiu-blue/15 transition-all scrollbar-hide leading-relaxed"
              style={{ minHeight: '52px', maxHeight: '160px' }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={cn(
                'absolute right-2.5 bottom-2.5 w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                input.trim() && !loading
                  ? 'bg-usiu-blue text-white hover:bg-slate-800 shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-300 mt-2.5 tracking-wider">
            TIBU · Powered by Azure OpenAI + RAG · USIU-Africa 2026
          </p>
        </div>
      </div>
    </div>
  )
}
