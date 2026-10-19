import { useEffect, useState, type FormEvent } from 'react'
import { Helmet } from 'react-helmet-async'
import { MessageCircle, Pencil, Plus, Send, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import { FormSkeleton, TableSkeleton } from '../../components/common/Skeleton'
import {
  createFAQ,
  deleteFAQ,
  markConversationRead,
  sendSupportMessage,
  subscribeAdminConversations,
  subscribeAllFAQs,
  subscribeConversationMessages,
  updateFAQ,
} from '../../services/support/supportService'
import { useAuthStore } from '../../store/authStore'
import type { SupportConversation, SupportFAQ, SupportMessage } from '../../types'

interface FAQFormState {
  question: string
  answer: string
  order: string
  active: boolean
}

const EMPTY_FAQ_FORM: FAQFormState = {
  question: '',
  answer: '',
  order: '0',
  active: true,
}

function formatDate(timestamp: number) {
  if (!timestamp) return 'No messages yet'
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatMessageTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

const CustomerSupport = () => {
  const user = useAuthStore((state) => state.user)
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [faqs, setFAQs] = useState<SupportFAQ[]>([])
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [faqForm, setFAQForm] = useState<FAQFormState>(EMPTY_FAQ_FORM)
  const [editingFAQId, setEditingFAQId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingFAQ, setIsSavingFAQ] = useState(false)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    const unsubscribeConversations = subscribeAdminConversations(
      (items) => {
        setConversations(items)
        setIsLoading(false)
      },
      (error) => {
        console.error(error)
        toast.error('Unable to load customer conversations.')
        setIsLoading(false)
      }
    )
    const unsubscribeFAQs = subscribeAllFAQs(
      setFAQs,
      (error) => {
        console.error(error)
        toast.error('Unable to load support FAQs.')
      }
    )

    return () => {
      unsubscribeConversations()
      unsubscribeFAQs()
    }
  }, [])

  useEffect(() => {
    if (conversations.length === 0) {
      setSelectedConversationId(null)
      return
    }

    setSelectedConversationId((currentId) =>
      currentId && conversations.some((conversation) => conversation.id === currentId)
        ? currentId
        : conversations[0].id
    )
  }, [conversations])

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([])
      return
    }

    return subscribeConversationMessages(
      selectedConversationId,
      setMessages,
      (error) => {
        console.error(error)
        toast.error('Unable to load this conversation.')
      }
    )
  }, [selectedConversationId])

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId
  )

  useEffect(() => {
    if (!selectedConversationId || !selectedConversation?.unreadForAdmin) return
    markConversationRead(selectedConversationId, 'admin').catch((error) => console.error(error))
  }, [selectedConversationId, selectedConversation?.unreadForAdmin])

  const resetFAQForm = () => {
    setFAQForm(EMPTY_FAQ_FORM)
    setEditingFAQId(null)
  }

  const startEditingFAQ = (faq: SupportFAQ) => {
    setEditingFAQId(faq.id)
    setFAQForm({
      question: faq.question,
      answer: faq.answer,
      order: String(faq.order),
      active: faq.active,
    })
  }

  const handleFAQSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !faqForm.question.trim() || !faqForm.answer.trim()) {
      toast.error('Question and answer are required.')
      return
    }

    setIsSavingFAQ(true)
    try {
      const data = {
        question: faqForm.question,
        answer: faqForm.answer,
        order: Number(faqForm.order) || 0,
        active: faqForm.active,
      }

      if (editingFAQId) {
        await updateFAQ(editingFAQId, data, user.uid)
        toast.success('FAQ updated.')
      } else {
        await createFAQ(data, user.uid)
        toast.success('FAQ added.')
      }
      resetFAQForm()
    } catch (error) {
      console.error(error)
      toast.error('Unable to save the FAQ.')
    } finally {
      setIsSavingFAQ(false)
    }
  }

  const handleDeleteFAQ = async (faq: SupportFAQ) => {
    if (!window.confirm(`Delete this FAQ?\n\n${faq.question}`)) return

    try {
      await deleteFAQ(faq.id)
      if (editingFAQId === faq.id) resetFAQForm()
      toast.success('FAQ deleted.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to delete the FAQ.')
    }
  }

  const handleReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !selectedConversationId || !draft.trim() || isSending) return

    setIsSending(true)
    try {
      await sendSupportMessage(selectedConversationId, user.uid, 'admin', draft)
      setDraft('')
    } catch (error) {
      console.error(error)
      toast.error('Reply could not be sent.')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <FormSkeleton />
        <TableSkeleton rows={4} columns={3} />
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Customer Support — Admin — Shoplexᴮᴰ</title>
      </Helmet>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[color:var(--color-deep-green)]">
          Customer Support
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Reply to customers in real time and manage quick support answers.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card padded={false} className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
            <div>
              <h2 className="font-semibold text-[color:var(--color-deep-green)]">Conversations</h2>
              <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                {conversations.length} total conversation{conversations.length === 1 ? '' : 's'}
              </p>
            </div>
            <MessageCircle className="h-5 w-5 text-emerald-500" />
          </div>

          <div className="max-h-[560px] overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-[color:var(--color-text-secondary)]">
                No customer conversations yet.
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={[
                    'flex w-full items-start gap-3 border-b border-gray-100 px-4 py-4 text-left transition',
                    selectedConversationId === conversation.id
                      ? 'bg-emerald-50'
                      : 'hover:bg-gray-50',
                  ].join(' ')}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-[color:var(--color-deep-green)]">
                    {conversation.customerName.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-[color:var(--color-text-primary)]">
                        {conversation.customerName}
                      </span>
                      <span className="shrink-0 text-[11px] text-[color:var(--color-text-secondary)]">
                        {formatDate(conversation.lastMessageAt)}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-xs text-[color:var(--color-text-secondary)]">
                      {conversation.lastMessage || 'Conversation started'}
                    </span>
                  </span>
                  {conversation.unreadForAdmin && (
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" aria-label="Unread" />
                  )}
                </button>
              ))
            )}
          </div>
        </Card>

        <Card padded={false} className="flex min-h-[560px] flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-[color:var(--color-deep-green)]">
                  {selectedConversation.customerName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-[color:var(--color-deep-green)]">
                    {selectedConversation.customerName}
                  </h2>
                  <p className="truncate text-xs text-[color:var(--color-text-secondary)]">
                    {selectedConversation.customerEmail || 'Customer conversation'}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-[color:var(--color-natural-bg)] p-4">
                {messages.length === 0 ? (
                  <p className="py-16 text-center text-sm text-[color:var(--color-text-secondary)]">
                    No messages in this conversation yet.
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={message.senderRole === 'admin' ? 'ml-10' : 'mr-10'}
                    >
                      <div
                        className={[
                          'rounded-2xl px-4 py-3 text-sm leading-6',
                          message.senderRole === 'admin'
                            ? 'rounded-br-sm bg-[color:var(--color-deep-green)] text-white'
                            : 'rounded-bl-sm border border-emerald-100 bg-white text-[color:var(--color-text-primary)] shadow-sm',
                        ].join(' ')}
                      >
                        {message.text}
                      </div>
                      <p
                        className={[
                          'mt-1 text-[10px] text-[color:var(--color-text-secondary)]',
                          message.senderRole === 'admin' ? 'text-right' : '',
                        ].join(' ')}
                      >
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleReply} className="border-t border-gray-200 bg-white p-3">
                <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1.5 focus-within:border-emerald-400">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={2}
                    maxLength={1000}
                    placeholder="Write a reply..."
                    aria-label="Reply to customer"
                    className="min-h-12 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-[color:var(--color-text-primary)] outline-none placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !draft.trim()}
                    aria-label="Send reply"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-emerald)] text-white transition hover:bg-[color:var(--color-deep-green)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <MessageCircle className="h-10 w-10 text-emerald-400" />
              <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">
                Select a conversation to start replying.
              </p>
            </div>
          )}
        </Card>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--color-deep-green)]">Support FAQs</h2>
            <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
              These questions appear in the customer chat popup.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={resetFAQForm}
          >
            New FAQ
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-semibold text-[color:var(--color-deep-green)]">
                {editingFAQId ? 'Edit FAQ' : 'Add FAQ'}
              </h3>
              {editingFAQId && (
                <button
                  type="button"
                  onClick={resetFAQForm}
                  aria-label="Cancel FAQ editing"
                  className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleFAQSubmit} className="space-y-4">
              <Input
                label="Question"
                value={faqForm.question}
                onChange={(event) => setFAQForm((current) => ({ ...current, question: event.target.value }))}
                placeholder="How long does delivery take?"
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]">
                  Answer
                </label>
                <textarea
                  rows={5}
                  value={faqForm.answer}
                  onChange={(event) => setFAQForm((current) => ({ ...current, answer: event.target.value }))}
                  placeholder="Share a clear answer with customers."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[color:var(--color-text-primary)] outline-none focus:border-[color:var(--color-emerald)] focus:ring-2 focus:ring-[color:var(--color-emerald)]"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Order"
                  type="number"
                  min="0"
                  value={faqForm.order}
                  onChange={(event) => setFAQForm((current) => ({ ...current, order: event.target.value }))}
                />
                <label className="flex items-center gap-3 self-end pb-3 text-sm text-[color:var(--color-text-primary)]">
                  <input
                    type="checkbox"
                    checked={faqForm.active}
                    onChange={(event) => setFAQForm((current) => ({ ...current, active: event.target.checked }))}
                    className="h-4 w-4 accent-emerald-500"
                  />
                  Active in customer chat
                </label>
              </div>
              <Button type="submit" isLoading={isSavingFAQ} fullWidth>
                {editingFAQId ? 'Update FAQ' : 'Add FAQ'}
              </Button>
            </form>
          </Card>

          <Card padded={false} className="overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-4">
              <h3 className="font-semibold text-[color:var(--color-deep-green)]">All FAQs</h3>
            </div>
            {faqs.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-[color:var(--color-text-secondary)]">
                No FAQs created yet.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {faqs.map((faq) => (
                  <div key={faq.id} className="flex flex-wrap items-start gap-4 px-4 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                          Order {faq.order}
                        </span>
                        <span
                          className={[
                            'rounded-full px-2 py-1 text-[11px] font-semibold',
                            faq.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600',
                          ].join(' ')}
                        >
                          {faq.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="mt-2 font-medium text-[color:var(--color-text-primary)]">{faq.question}</p>
                      <p className="mt-1 text-sm leading-6 text-[color:var(--color-text-secondary)]">{faq.answer}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEditingFAQ(faq)}
                        aria-label={`Edit ${faq.question}`}
                        className="rounded-lg p-2 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFAQ(faq)}
                        aria-label={`Delete ${faq.question}`}
                        className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>
    </>
  )
}

export default CustomerSupport
