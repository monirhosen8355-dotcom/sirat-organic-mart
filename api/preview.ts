import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  fetchLinkPreview,
  LinkPreviewError,
} from '../functions/src/linkPreview.js'

interface PreviewRequest extends IncomingMessage {
  body?: unknown
}

interface PreviewResponse extends ServerResponse {
  status(code: number): PreviewResponse
  json(body: unknown): PreviewResponse
}

interface FirebaseServiceAccount {
  project_id: string
  client_email: string
  private_key: string
}

function getAdminApp() {
  const existingApp = getApps().find((app) => app.name === '[DEFAULT]')
  if (existingApp) return existingApp

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured.')
  }

  const value: unknown = JSON.parse(serviceAccountJson)
  if (
    typeof value !== 'object' ||
    value === null ||
    !('project_id' in value) ||
    typeof value.project_id !== 'string' ||
    !('client_email' in value) ||
    typeof value.client_email !== 'string' ||
    !('private_key' in value) ||
    typeof value.private_key !== 'string'
  ) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is invalid.')
  }
  const serviceAccount: FirebaseServiceAccount = {
    project_id: value.project_id,
    client_email: value.client_email,
    private_key: value.private_key,
  }

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  })
}

function isInvalidTokenError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false
  return [
    'auth/argument-error',
    'auth/id-token-expired',
    'auth/id-token-revoked',
    'auth/invalid-id-token',
  ].includes(String(error.code))
}

function previewErrorStatus(error: LinkPreviewError): number {
  switch (error.code) {
    case 'invalid-url':
      return 400
    case 'blocked':
      return 403
    case 'timeout':
      return 504
    case 'no-data':
      return 404
    case 'fetch-failed':
      return 502
  }
}

export default async function handler(
  req: PreviewRequest,
  res: PreviewResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const authorization = req.headers.authorization
  const token = typeof authorization === 'string' && authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : ''
  if (!token) {
    res.status(401).json({ error: 'Sign in as an admin to fetch product previews.' })
    return
  }

  try {
    const app = getAdminApp()
    const decodedToken = await getAuth(app).verifyIdToken(token)
    const adminDocument = await getFirestore(app)
      .collection('admins')
      .doc(decodedToken.uid)
      .get()
    if (!adminDocument.exists) {
      res.status(403).json({ error: 'Only admins can fetch product previews.' })
      return
    }
  } catch (error) {
    if (isInvalidTokenError(error)) {
      res.status(401).json({ error: 'The Firebase ID token is invalid or expired.' })
      return
    }
    console.error('Affiliate preview admin verification failed:', error)
    res.status(500).json({ error: 'Could not verify admin access. Please try again.' })
    return
  }

  if (
    typeof req.body !== 'object' ||
    req.body === null ||
    !('url' in req.body) ||
    typeof req.body.url !== 'string' ||
    !req.body.url.trim()
  ) {
    res.status(400).json({ error: 'Enter a product URL.' })
    return
  }

  try {
    const preview = await fetchLinkPreview(req.body.url)
    res.status(200).json(preview)
  } catch (error) {
    if (error instanceof LinkPreviewError) {
      res.status(previewErrorStatus(error)).json({ error: error.message, code: error.code })
      return
    }
    console.error('Affiliate preview fetch failed unexpectedly:', error)
    res.status(502).json({
      error: 'The product site could not be reached. Try again or edit the product details.',
    })
  }
}
