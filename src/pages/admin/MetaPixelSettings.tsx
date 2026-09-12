import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { getMetaPixelSettings, saveMetaPixelSettings } from '../../services/settings/metaPixelSettingsService'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Spinner from '../../components/common/Spinner'
import type { MetaPixelSettings } from '../../types'

interface MetaPixelFormState {
  pixelId: string
  enabled: boolean
}

const EMPTY_FORM: MetaPixelFormState = {
  pixelId: '',
  enabled: false,
}

function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return 'এখনো সেট হয়নি'

  return new Date(timestamp).toLocaleString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const MetaPixelSettingsPage = () => {
  const { user, isAdmin, isLoading } = useAuthStore()
  const [form, setForm] = useState<MetaPixelFormState>(EMPTY_FORM)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [currentConfig, setCurrentConfig] = useState<MetaPixelSettings | null>(null)

  useEffect(() => {
    async function loadSettings() {
      setIsLoadingConfig(true)
      try {
        const settings = await getMetaPixelSettings()
        if (settings) {
          setCurrentConfig(settings)
          setForm({
            pixelId: settings.pixelId,
            enabled: settings.enabled,
          })
        } else {
          setCurrentConfig(null)
          setForm(EMPTY_FORM)
        }
      } catch (error) {
        console.error(error)
        toast.error('Meta Pixel সেটিংস লোড করতে সমস্যা হয়েছে।')
      } finally {
        setIsLoadingConfig(false)
      }
    }

    if (!isLoading) {
      loadSettings()
    }
  }, [isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedPixelId = form.pixelId.trim()
    if (!trimmedPixelId) {
      toast.error('Pixel ID আবশ্যক।')
      return
    }

    setIsSaving(true)
    try {
      const saved = await saveMetaPixelSettings({
        pixelId: trimmedPixelId,
        enabled: form.enabled,
        updatedBy: user?.uid,
      })

      setCurrentConfig(saved)
      setForm({
        pixelId: saved.pixelId,
        enabled: saved.enabled,
      })
      toast.success('Meta Pixel সেটিংস সংরক্ষণ করা হয়েছে।')
    } catch (error) {
      console.error(error)
      toast.error('সংরক্ষণ করতে সমস্যা হয়েছে।')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || isLoadingConfig) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        শুধু অ্যাডমিন ব্যবহারকারী Meta Pixel সেটিংস পরিবর্তন করতে পারবেন।
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Meta Pixel Settings — Admin — Sirat Organic Mart</title>
      </Helmet>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[color:var(--color-deep-green)]">
          Meta Pixel সেটিংস
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Firestore-এ সংরক্ষিত কনফিগারেশন অনুযায়ী Pixel initialize হবে।
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Pixel ID"
              value={form.pixelId}
              onChange={(e) => setForm((prev) => ({ ...prev, pixelId: e.target.value }))}
              placeholder="উদাহরণ: 1845127006863701"
              disabled={isSaving}
            />

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[color:var(--color-text-primary)]">
                    Meta Pixel Enable / Disable
                  </p>
                  <p className="text-xs text-[color:var(--color-text-secondary)]">
                    Disable করলে frontend Pixel initialize হবে না।
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Toggle Meta Pixel"
                  onClick={() => setForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
                  className={[
                    'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                    form.enabled ? 'bg-[color:var(--color-emerald)]' : 'bg-gray-300',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                      form.enabled ? 'translate-x-6' : 'translate-x-1',
                    ].join(' ')}
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" isLoading={isSaving}>
                {currentConfig ? 'Update Settings' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-medium text-[color:var(--color-text-primary)]">
            Current Configuration
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[color:var(--color-text-secondary)]">Status</span>
              <span
                className={[
                  'rounded-full px-2 py-1 text-xs font-medium',
                  currentConfig?.enabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-700',
                ].join(' ')}
              >
                {currentConfig?.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div>
              <p className="mb-1 text-[color:var(--color-text-secondary)]">Pixel ID</p>
              <p className="break-all font-medium">{currentConfig?.pixelId || 'Not configured yet'}</p>
            </div>

            <div>
              <p className="mb-1 text-[color:var(--color-text-secondary)]">Last Updated</p>
              <p>{formatTimestamp(currentConfig?.updatedAt)}</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}

export default MetaPixelSettingsPage
