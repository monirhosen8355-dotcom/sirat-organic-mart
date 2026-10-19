import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../lib/firebase/config'
import type { SupportConversation, SupportFAQ, SupportMessage } from '../../types'

const FAQ_COLLECTION = 'supportFAQs'
const CONVERSATION_COLLECTION = 'supportConversations'
const MESSAGE_SUBCOLLECTION = 'messages'

function toFAQ(id: string, data: DocumentData): SupportFAQ {
  return {
    id,
    question: String(data.question ?? ''),
    answer: String(data.answer ?? ''),
    order: Number(data.order ?? 0),
    active: data.active !== false,
    createdAt: Number(data.createdAt ?? 0),
    updatedAt: Number(data.updatedAt ?? 0),
    updatedBy: data.updatedBy,
  }
}

function toConversation(id: string, data: DocumentData): SupportConversation {
  return {
    id,
    customerId: String(data.customerId ?? id),
    customerName: String(data.customerName ?? 'Customer'),
    customerEmail: data.customerEmail,
    lastMessage: String(data.lastMessage ?? ''),
    lastMessageAt: Number(data.lastMessageAt ?? 0),
    unreadForAdmin: data.unreadForAdmin === true,
    unreadForCustomer: data.unreadForCustomer === true,
    createdAt: Number(data.createdAt ?? 0),
    updatedAt: Number(data.updatedAt ?? 0),
  }
}

function toMessage(id: string, data: DocumentData): SupportMessage {
  return {
    id,
    conversationId: String(data.conversationId ?? ''),
    senderId: String(data.senderId ?? ''),
    senderRole: data.senderRole === 'admin' ? 'admin' : 'customer',
    text: String(data.text ?? ''),
    createdAt: Number(data.createdAt ?? 0),
  }
}

function sortByOrder(left: SupportFAQ, right: SupportFAQ) {
  return left.order - right.order || left.question.localeCompare(right.question)
}

function sortByRecent(left: SupportConversation, right: SupportConversation) {
  return right.lastMessageAt - left.lastMessageAt
}

export function subscribeActiveFAQs(
  onChange: (faqs: SupportFAQ[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, FAQ_COLLECTION),
    (snapshot) => {
      const faqs = snapshot.docs
        .map((item) => toFAQ(item.id, item.data()))
        .filter((faq) => faq.active)
        .sort(sortByOrder)
      onChange(faqs)
    },
    onError
  )
}

export function subscribeAllFAQs(
  onChange: (faqs: SupportFAQ[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, FAQ_COLLECTION),
    (snapshot) => {
      onChange(snapshot.docs.map((item) => toFAQ(item.id, item.data())).sort(sortByOrder))
    },
    onError
  )
}

export async function createFAQ(
  data: Pick<SupportFAQ, 'question' | 'answer' | 'order' | 'active'>,
  updatedBy: string
): Promise<void> {
  const timestamp = Date.now()
  await addDoc(collection(db, FAQ_COLLECTION), {
    ...data,
    question: data.question.trim(),
    answer: data.answer.trim(),
    order: Number(data.order) || 0,
    active: Boolean(data.active),
    createdAt: timestamp,
    updatedAt: timestamp,
    updatedBy,
  })
}

export async function updateFAQ(
  id: string,
  data: Pick<SupportFAQ, 'question' | 'answer' | 'order' | 'active'>,
  updatedBy: string
): Promise<void> {
  await updateDoc(doc(db, FAQ_COLLECTION, id), {
    ...data,
    question: data.question.trim(),
    answer: data.answer.trim(),
    order: Number(data.order) || 0,
    active: Boolean(data.active),
    updatedAt: Date.now(),
    updatedBy,
  })
}

export async function deleteFAQ(id: string): Promise<void> {
  await deleteDoc(doc(db, FAQ_COLLECTION, id))
}

export async function ensureCustomerConversation(user: {
  uid: string
  displayName: string | null
  email: string | null
}): Promise<SupportConversation> {
  const conversationRef = doc(db, CONVERSATION_COLLECTION, user.uid)
  const snapshot = await getDoc(conversationRef)

  if (snapshot.exists()) {
    return toConversation(snapshot.id, snapshot.data())
  }

  const timestamp = Date.now()
  const conversation: Omit<SupportConversation, 'id'> = {
    customerId: user.uid,
    customerName: user.displayName?.trim() || user.email?.split('@')[0] || 'Customer',
    customerEmail: user.email ?? undefined,
    lastMessage: '',
    lastMessageAt: timestamp,
    unreadForAdmin: false,
    unreadForCustomer: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await setDoc(conversationRef, conversation)
  return { id: snapshot.id, ...conversation }
}

export function subscribeConversation(
  conversationId: string,
  onChange: (conversation: SupportConversation | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, CONVERSATION_COLLECTION, conversationId),
    (snapshot) => {
      onChange(snapshot.exists() ? toConversation(snapshot.id, snapshot.data()) : null)
    },
    onError
  )
}

export function subscribeConversationMessages(
  conversationId: string,
  onChange: (messages: SupportMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, CONVERSATION_COLLECTION, conversationId, MESSAGE_SUBCOLLECTION),
    (snapshot) => {
      const messages = snapshot.docs
        .map((item) => toMessage(item.id, item.data()))
        .sort((left, right) => left.createdAt - right.createdAt)
      onChange(messages)
    },
    onError
  )
}

export function subscribeAdminConversations(
  onChange: (conversations: SupportConversation[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, CONVERSATION_COLLECTION),
    (snapshot) => {
      onChange(snapshot.docs.map((item) => toConversation(item.id, item.data())).sort(sortByRecent))
    },
    onError
  )
}

export async function sendSupportMessage(
  conversationId: string,
  senderId: string,
  senderRole: 'customer' | 'admin',
  text: string
): Promise<void> {
  const trimmedText = text.trim()
  if (!trimmedText) return

  const timestamp = Date.now()
  await addDoc(collection(db, CONVERSATION_COLLECTION, conversationId, MESSAGE_SUBCOLLECTION), {
    conversationId,
    senderId,
    senderRole,
    text: trimmedText,
    createdAt: timestamp,
  })

  await updateDoc(doc(db, CONVERSATION_COLLECTION, conversationId), {
    lastMessage: trimmedText,
    lastMessageAt: timestamp,
    updatedAt: timestamp,
    unreadForAdmin: senderRole === 'customer',
    unreadForCustomer: senderRole === 'admin',
  })
}

export async function markConversationRead(
  conversationId: string,
  readerRole: 'customer' | 'admin'
): Promise<void> {
  await updateDoc(doc(db, CONVERSATION_COLLECTION, conversationId), {
    [readerRole === 'admin' ? 'unreadForAdmin' : 'unreadForCustomer']: false,
    updatedAt: Date.now(),
  })
}

export function supportConversationQueryForCustomer(customerId: string) {
  return query(
    collection(db, CONVERSATION_COLLECTION),
    where('customerId', '==', customerId)
  )
}
