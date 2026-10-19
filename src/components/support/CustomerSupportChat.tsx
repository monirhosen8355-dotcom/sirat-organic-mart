import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock3, MessageCircle, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  ensureCustomerConversation,
  markConversationRead,
  sendSupportMessage,
  subscribeActiveFAQs,
  subscribeConversationMessages,
} from '../../services/support/supportService'
import { useAuthStore } from '../../store/authStore'
import type { SupportFAQ, SupportMessage } from '../../types'
import BrandName from '../common/BrandName'

const CustomerSupportChat = () => {
  const user = useAuthStore((state) => state.user)
  const [isOpen, setIsOpen] = useState(false)
  const [isLiveChat, setIsLiveChat] = useState(false)
  const [faqs, setFaqs] = useState<SupportFAQ[]>([])
  const [selectedFAQ, setSelectedFAQ] = useState<SupportFAQ | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [isStartingChat, setIsStartingChat] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showSupportConfirmation, setShowSupportConfirmation] = useState(false)
  const [supportConfirmationTime, setSupportConfirmationTime] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const formatMessageTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    })

  useEffect(() => {
    return subscribeActiveFAQs(
      setFaqs,
      () => toast.error('Unable to load support questions right now.')
    )
  }, [])

  useEffect(() => {
    if (!isOpen || !isLiveChat || !user) return

    let isCancelled = false
    setIsStartingChat(true)

    ensureCustomerConversation(user)
      .then((conversation) => {
        if (!isCancelled) setConversationId(conversation.id)
      })
      .catch((error) => {
        console.error(error)
        if (!isCancelled) toast.error('Unable to open the support chat.')
      })
      .finally(() => {
        if (!isCancelled) setIsStartingChat(false)
      })

    return () => {
      isCancelled = true
    }
  }, [isOpen, isLiveChat, user])

  useEffect(() => {
    if (!conversationId || !isLiveChat) return

    return subscribeConversationMessages(
      conversationId,
      setMessages,
      () => toast.error('Unable to load support messages.')
    )
  }, [conversationId, isLiveChat])

  useEffect(() => {
    if (!conversationId || !isLiveChat || messages.length === 0) return

    markConversationRead(conversationId, 'customer').catch((error) => console.error(error))
  }, [conversationId, isLiveChat, messages.length])

  useEffect(() => {
    if (!isOpen || !isLiveChat) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [isOpen, isLiveChat, messages])

  const openLiveChat = () => {
    setSelectedFAQ(null)
    setIsLiveChat(true)
  }

  const closeChat = () => {
    setIsOpen(false)
    setIsLiveChat(false)
    setConversationId(null)
    setMessages([])
    setDraft('')
    setShowSupportConfirmation(false)
    setSupportConfirmationTime(null)
  }

  const handleSupportRequest = () => {
    setShowSupportConfirmation(true)
    setSupportConfirmationTime(Date.now())
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !draft.trim() || !conversationId || isSending) return

    setIsSending(true)
    try {
      await sendSupportMessage(conversationId, user.uid, 'customer', draft)
      setDraft('')
    } catch (error) {
      console.error(error)
      toast.error('Your message could not be sent.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      {isOpen && (
        <section
          aria-label="Customer support chat"
          className="fixed inset-x-3 bottom-24 z-[60] flex max-h-[min(680px,calc(100vh-7rem))] flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[390px]"
        >
          <header className="flex items-start justify-between gap-4 bg-[color:var(--color-deep-green)] px-5 py-4 text-white">
            <div>
              <p className="text-base font-semibold">
                <BrandName /> Chat
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-100">
                <Clock3 className="h-3.5 w-3.5" /> Typically reply within an hour
              </p>
            </div>
            <button
              type="button"
              onClick={closeChat}
              aria-label="Close support chat"
              className="rounded-full p-1.5 text-emerald-100 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col bg-[color:var(--color-natural-bg)]">
            {!isLiveChat ? (
              <div className="overflow-y-auto p-4">
                <div className="mb-4 rounded-xl border border-emerald-100 bg-white p-4">
                  <p className="text-sm font-medium text-[color:var(--color-deep-green)]">
                    How can we help today?
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--color-text-secondary)]">
                    Choose a quick answer or start a conversation with our team.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSupportRequest}
                  className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-[color:var(--color-deep-green)] transition hover:border-emerald-400 hover:bg-emerald-100"
                >
                  <Clock3 className="h-4 w-4 text-emerald-600" />
                  24/7 Customer Support
                </button>

                {showSupportConfirmation && (
                  <div className="mb-4 ml-6 rounded-2xl rounded-br-sm bg-[color:var(--color-deep-green)] px-4 py-3 text-sm leading-6 text-white">
                    Your message has been received. One of our representatives will contact you as soon as possible.
                    <span className="mt-2 block text-right text-[10px] text-emerald-100">
                      {supportConfirmationTime && formatMessageTime(supportConfirmationTime)}
                    </span>
                  </div>
                )}

                {selectedFAQ && (
                  <div className="mb-4 space-y-3">
                    <div className="ml-6 rounded-2xl rounded-br-sm bg-[color:var(--color-deep-green)] px-4 py-3 text-sm text-white">
                      {selectedFAQ.question}
                    </div>
                    <div className="mr-6 rounded-2xl rounded-bl-sm border border-emerald-100 bg-white px-4 py-3 text-sm leading-6 text-[color:var(--color-text-primary)] shadow-sm">
                      {selectedFAQ.answer}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {faqs.length > 0 ? (
                    faqs.map((faq) => (
                      <button
                        key={faq.id}
                        type="button"
                        onClick={() => setSelectedFAQ(faq)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-[color:var(--color-text-primary)] transition hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        <span>{faq.question}</span>
                        <span className="text-emerald-600">›</span>
                      </button>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed border-gray-300 px-4 py-5 text-center text-sm text-[color:var(--color-text-secondary)]">
                      No quick questions are available yet.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={openLiveChat}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--color-emerald)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--color-deep-green)]"
                >
                  <MessageCircle className="h-4 w-4" />
                  {selectedFAQ ? 'Ask something else' : 'Chat with Admin'}
                </button>
              </div>
            ) : !user ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <MessageCircle className="mb-3 h-10 w-10 text-emerald-500" />
                <h2 className="font-semibold text-[color:var(--color-deep-green)]">
                  Sign in to chat with us
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-secondary)]">
                  Your conversation stays private and follows your account across devices.
                </p>
                <Link
                  to="/login"
                  onClick={closeChat}
                  className="mt-5 rounded-xl bg-[color:var(--color-emerald)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--color-deep-green)]"
                >
                  Sign in
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {isStartingChat ? (
                    <p className="py-10 text-center text-sm text-[color:var(--color-text-secondary)]">
                      Opening your conversation...
                    </p>
                  ) : messages.length === 0 ? (
                    <div className="rounded-xl border border-emerald-100 bg-white p-4 text-center text-sm leading-6 text-[color:var(--color-text-secondary)]">
                      Send us a message and our team will get back to you soon.
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={message.senderRole === 'customer' ? 'ml-8' : 'mr-8'}
                      >
                        <div
                          className={[
                            'rounded-2xl px-4 py-3 text-sm leading-6',
                            message.senderRole === 'customer'
                              ? 'rounded-br-sm bg-[color:var(--color-deep-green)] text-white'
                              : 'rounded-bl-sm border border-emerald-100 bg-white text-[color:var(--color-text-primary)] shadow-sm',
                          ].join(' ')}
                        >
                          {message.text}
                        </div>
                        <p
                          className={[
                            'mt-1 text-[10px] text-[color:var(--color-text-secondary)]',
                            message.senderRole === 'customer' ? 'text-right' : '',
                          ].join(' ')}
                        >
                          {formatMessageTime(message.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white p-3">
                  <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1.5 focus-within:border-emerald-400">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      rows={1}
                      maxLength={1000}
                      placeholder="Write a message..."
                      aria-label="Message to admin"
                      className="max-h-24 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-[color:var(--color-text-primary)] outline-none placeholder:text-gray-400"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !draft.trim() || !conversationId}
                      aria-label="Send message"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-emerald)] text-white transition hover:bg-[color:var(--color-deep-green)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close chat with admin' : 'Chat with admin'}
        className="fixed bottom-40 right-4 z-[55] flex items-center gap-2 rounded-full bg-[color:var(--color-emerald)] px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-[color:var(--color-deep-green)] md:bottom-6 md:right-24"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span className="hidden sm:inline">Chat with Admin</span>
      </button>
    </>
  )
}

export default CustomerSupportChat
