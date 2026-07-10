import { useState, useCallback } from 'react'

const STORAGE_KEY = 'tibu_conversations'
const MAX_CONVERSATIONS = 30

function generateId() {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function titleFromMessage(content) {
  return content.length > 45 ? content.slice(0, 45) + '…' : content
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persist(convs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs))
  } catch {
    // storage full — drop oldest
    const trimmed = convs.slice(-MAX_CONVERSATIONS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  }
}

/** Create a blank conversation object */
function makeEmptyConversation() {
  return {
    id: generateId(),
    title: 'New conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  }
}

export function useConversations(initialWelcome) {
  const [conversations, setConversations] = useState(() => {
    const stored = load()
    // Always ensure at least one conversation exists
    if (stored.length === 0) {
      const fresh = makeEmptyConversation()
      persist([fresh])
      return [fresh]
    }
    return stored
  })

  const [activeId, setActiveId] = useState(() => {
    const stored = load()
    if (stored.length > 0) return stored[0].id
    // Matches the conversation created above
    return conversations[0]?.id ?? null
  })

  // Return the active conversation's messages (empty array = welcome screen)
  const activeMessages = (() => {
    const conv = conversations.find((c) => c.id === activeId)
    return conv ? conv.messages : []
  })()

  const _update = useCallback((updater) => {
    setConversations((prev) => {
      const next = updater(prev)
      persist(next)
      return next
    })
  }, [])

  /** Create a brand-new conversation and make it active.
   *  If the current conversation is still empty (no user messages),
   *  just reuse it instead of stacking blank tabs. */
  const newConversation = useCallback(() => {
    let reusedId = null

    setConversations((prev) => {
      const current = prev.find((c) => c.id === activeId)
      // Reuse the active conversation if it has no messages yet
      if (current && current.messages.length === 0) {
        reusedId = current.id
        return prev // nothing to change
      }

      const conv = makeEmptyConversation()
      reusedId = conv.id
      const next = [conv, ...prev].slice(0, MAX_CONVERSATIONS)
      persist(next)
      return next
    })

    // We need to set activeId after the state update
    if (reusedId) setActiveId(reusedId)
  }, [activeId])

  /** Append a message to the given conversation (always exists) */
  const appendMessage = useCallback(
    (message, targetId) => {
      setConversations((prev) => {
        const next = prev.map((c) => {
          if (c.id !== targetId) return c
          const updatedMessages = [...c.messages, message]
          return {
            ...c,
            updatedAt: new Date().toISOString(),
            // Auto-title from the first user message
            title:
              c.messages.length === 0 && message.role === 'user'
                ? titleFromMessage(message.content)
                : c.title,
            messages: updatedMessages,
          }
        })
        persist(next)
        return next
      })

      return targetId
    },
    []
  )

  /** Switch to a different conversation */
  const selectConversation = useCallback((id) => {
    setActiveId(id)
  }, [])

  /** Delete a conversation. If it was the active one, switch to the next
   *  available — or create a fresh empty one so there's always one. */
  const deleteConversation = useCallback(
    (id) => {
      _update((prev) => {
        const next = prev.filter((c) => c.id !== id)
        if (next.length === 0) {
          // Always keep at least one conversation
          const fresh = makeEmptyConversation()
          setActiveId(fresh.id)
          return [fresh]
        }
        if (activeId === id) {
          setActiveId(next[0].id)
        }
        return next
      })
    },
    [_update, activeId]
  )

  /** Rename a conversation */
  const renameConversation = useCallback(
    (id, title) => {
      _update((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      )
    },
    [_update]
  )

  return {
    conversations,
    activeId,
    activeMessages,
    newConversation,
    appendMessage,
    selectConversation,
    deleteConversation,
    renameConversation,
  }
}
