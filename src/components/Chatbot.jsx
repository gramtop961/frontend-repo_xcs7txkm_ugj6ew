import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Sparkles } from 'lucide-react'

const initialMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    content: "Hi! I'm your AI assistant. Ask me anything or say hello to get started.",
  },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={classNames('w-full flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={classNames(
        'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed',
        isUser
          ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-br-sm'
          : 'bg-white/60 backdrop-blur ring-1 ring-black/5 text-gray-800 rounded-bl-sm'
      )}>
        {message.content}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="inline-flex items-center gap-1">
      <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse [animation-delay:-0.2s]"></span>
      <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></span>
      <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse [animation-delay:0.2s]"></span>
    </div>
  )
}

function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [value])

  const handleSend = () => {
    const text = value.trim()
    if (!text) return
    onSend(text)
    setValue('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="relative">
      <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-2 shadow-sm">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type your message..."
          className="flex-1 resize-none bg-transparent outline-none text-gray-800 placeholder:text-gray-400 p-2"
        />
        <button
          onClick={handleSend}
          disabled={disabled || value.trim().length === 0}
          className={classNames(
            'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
            disabled || value.trim().length === 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
          aria-label="Send"
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">Press Enter to send • Shift+Enter for new line</p>
    </div>
  )
}

export default function Chatbot() {
  const [messages, setMessages] = useState(initialMessages)
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)
  const baseUrl = import.meta.env.VITE_BACKEND_URL

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, loading])

  const localAssistant = async (text) => {
    // Simple, friendly local responder when no backend is provided
    const lower = text.toLowerCase()
    if (lower.includes('hello') || lower.includes('hi')) {
      return "Hello! How can I help you today?"
    }
    if (text.endsWith('?')) {
      return "Great question! I don't have a server connected yet, but I can still help brainstorm answers. Try asking me to outline steps, summarize text, or generate ideas."
    }
    return `You said: "${text}" — tell me more and I can help refine it.`
  }

  const sendMessage = async (text) => {
    const userMsg = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages((m) => [...m, userMsg])

    setLoading(true)
    try {
      let reply = ''
      if (baseUrl) {
        // Try backend /chat endpoint if available, otherwise fallback
        try {
          const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text }),
          })
          if (res.ok) {
            const data = await res.json()
            reply = data.reply || data.message || JSON.stringify(data)
          } else {
            reply = await localAssistant(text)
          }
        } catch (e) {
          reply = await localAssistant(text)
        }
      } else {
        reply = await localAssistant(text)
      }

      const assistantMsg = { id: crypto.randomUUID(), role: 'assistant', content: reply }
      setMessages((m) => [...m, assistantMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Bot size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Chatbot</h1>
                <p className="text-sm text-gray-500">Modern, minimal, and responsive chat interface</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <Sparkles size={16} />
              <span>{baseUrl ? 'Connected to backend' : 'Running in demo mode'}</span>
            </div>
          </div>
        </header>

        <main className="rounded-3xl border border-black/5 bg-white/60 backdrop-blur shadow-xl">
          <div className="grid grid-rows-[1fr_auto] h-[70vh]">
            <div ref={scrollRef} className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    <MessageBubble message={m} />
                  </motion.div>
                ))}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full flex justify-start"
                  >
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white/60 backdrop-blur ring-1 ring-black/5 text-gray-800 rounded-bl-sm">
                      <TypingDots />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="border-t border-black/5 p-3 sm:p-4">
              <ChatInput onSend={sendMessage} disabled={loading} />
            </div>
          </div>
        </main>

        <footer className="mt-4 text-center text-xs text-gray-500">
          Tip: You can connect your own backend by setting VITE_BACKEND_URL and exposing a POST /chat endpoint returning JSON with a "reply" field.
        </footer>
      </div>
    </div>
  )
}
