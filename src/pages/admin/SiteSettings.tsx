import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import {
  DEFAULT_FOOTER_SETTINGS,
  getFooterSettings,
  saveFooterSettings,
} from '../../services/settings/metaPixelSettingsService'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import { FormSkeleton } from '../../components/common/Skeleton'
import type { FooterLink, FooterSection, SiteFooterSettings } from '../../types'

interface FooterFormState {
  storeName: string
  description: string
  phone: string
  email: string
  whatsapp: string
  facebook: string
  instagram: string
  youtube: string
  sections: FooterSection[]
  paymentMethods: string
  trustItems: string
  copyrightText: string
}

const EMPTY_FOOTER_FORM: FooterFormState = {
  storeName: DEFAULT_FOOTER_SETTINGS.storeName,
  description: DEFAULT_FOOTER_SETTINGS.description,
  phone: DEFAULT_FOOTER_SETTINGS.phone,
  email: DEFAULT_FOOTER_SETTINGS.email,
  whatsapp: DEFAULT_FOOTER_SETTINGS.whatsapp,
  facebook: DEFAULT_FOOTER_SETTINGS.facebook,
  instagram: DEFAULT_FOOTER_SETTINGS.instagram,
  youtube: DEFAULT_FOOTER_SETTINGS.youtube,
  sections: DEFAULT_FOOTER_SETTINGS.sections,
  paymentMethods: DEFAULT_FOOTER_SETTINGS.paymentMethods.join(', '),
  trustItems: DEFAULT_FOOTER_SETTINGS.trustItems.join(', '),
  copyrightText: DEFAULT_FOOTER_SETTINGS.copyrightText,
}

function toSectionLinks(raw: FooterLink[] | string[] = []): FooterLink[] {
  return raw.map((item) => {
    if (typeof item === 'string') {
      return { label: item, href: '#' }
    }
    return item
  })
}

const SiteSettingsPage = () => {
  const { user, isAdmin, isLoading } = useAuthStore()
  const [footerForm, setFooterForm] = useState<FooterFormState>(EMPTY_FOOTER_FORM)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [isSavingFooter, setIsSavingFooter] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      setIsLoadingConfig(true)
      try {
        const footerSettings = await getFooterSettings()
        setFooterForm({
          storeName: footerSettings.storeName,
          description: footerSettings.description,
          phone: footerSettings.phone,
          email: footerSettings.email,
          whatsapp: footerSettings.whatsapp,
          facebook: footerSettings.facebook,
          instagram: footerSettings.instagram,
          youtube: footerSettings.youtube,
          sections: footerSettings.sections,
          paymentMethods: footerSettings.paymentMethods.join(', '),
          trustItems: footerSettings.trustItems.join(', '),
          copyrightText: footerSettings.copyrightText,
        })
      } catch (error) {
        console.error(error)
        toast.error('There was a problem loading the settings.')
      } finally {
        setIsLoadingConfig(false)
      }
    }

    if (!isLoading) {
      loadSettings()
    }
  }, [isLoading])

  const handleFooterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedSections = footerForm.sections
      .filter((section) => section.title.trim() || section.links.some((link) => link.label || link.href))
      .map((section) => ({
        title: section.title.trim() || 'Section',
        links: section.links
          .map((link) => ({
            label: link.label.trim(),
            href: link.href.trim(),
          }))
          .filter((link) => link.label && link.href),
      }))

    const payload: SiteFooterSettings = {
      ...DEFAULT_FOOTER_SETTINGS,
      storeName: footerForm.storeName.trim() || DEFAULT_FOOTER_SETTINGS.storeName,
      description: footerForm.description.trim() || DEFAULT_FOOTER_SETTINGS.description,
      phone: footerForm.phone.trim() || DEFAULT_FOOTER_SETTINGS.phone,
      email: footerForm.email.trim() || DEFAULT_FOOTER_SETTINGS.email,
      whatsapp: footerForm.whatsapp.trim() || DEFAULT_FOOTER_SETTINGS.whatsapp,
      facebook: footerForm.facebook.trim() || DEFAULT_FOOTER_SETTINGS.facebook,
      instagram: footerForm.instagram.trim() || DEFAULT_FOOTER_SETTINGS.instagram,
      youtube: footerForm.youtube.trim() || DEFAULT_FOOTER_SETTINGS.youtube,
      sections: normalizedSections.length > 0 ? normalizedSections : DEFAULT_FOOTER_SETTINGS.sections,
      paymentMethods: footerForm.paymentMethods.split(',').map((item) => item.trim()).filter(Boolean),
      trustItems: footerForm.trustItems.split(',').map((item) => item.trim()).filter(Boolean),
      copyrightText: footerForm.copyrightText.trim() || DEFAULT_FOOTER_SETTINGS.copyrightText,
      updatedAt: Date.now(),
      updatedBy: user?.uid,
    }

    setIsSavingFooter(true)
    try {
      const saved = await saveFooterSettings(payload)
      setFooterForm({
        storeName: saved.storeName,
        description: saved.description,
        phone: saved.phone,
        email: saved.email,
        whatsapp: saved.whatsapp,
        facebook: saved.facebook,
        instagram: saved.instagram,
        youtube: saved.youtube,
        sections: saved.sections,
        paymentMethods: saved.paymentMethods.join(', '),
        trustItems: saved.trustItems.join(', '),
        copyrightText: saved.copyrightText,
      })
      toast.success('Footer settings saved successfully.')
    } catch (error) {
      console.error(error)
      toast.error('There was a problem saving the footer settings.')
    } finally {
      setIsSavingFooter(false)
    }
  }

  if (isLoading || isLoadingConfig) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <FormSkeleton />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Only admin users can change the site settings.
      </div>
    )
  }

  const updateFooterSection = (index: number, field: 'title' | 'links', value: string) => {
    setFooterForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, sectionIndex) => {
        if (sectionIndex !== index) return section
        if (field === 'title') return { ...section, title: value }

        return {
          ...section,
          links: toSectionLinks(value.split('\n').map((line) => {
            const [label, ...rest] = line.split('|')
            return { label: (label || '').trim(), href: rest.join('|').trim() || '/shop' }
          })),
        }
      }),
    }))
  }

  const updateFooterLink = (sectionIndex: number, linkIndex: number, field: 'label' | 'href', value: string) => {
    setFooterForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) => {
        if (index !== sectionIndex) return section
        return {
          ...section,
          links: section.links.map((link, innerIndex) =>
            innerIndex === linkIndex ? { ...link, [field]: value } : link
          ),
        }
      }),
    }))
  }

  const addFooterLink = (sectionIndex: number) => {
    setFooterForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? { ...section, links: [...section.links, { label: 'New Link', href: '/shop' }] }
          : section
      ),
    }))
  }

  const addFooterSection = () => {
    setFooterForm((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { title: `Section ${prev.sections.length + 1}`, links: [{ label: 'New Link', href: '/shop' }] },
      ],
    }))
  }

  return (
    <>
      <Helmet>
        <title>Site settings — Admin</title>
      </Helmet>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[color:var(--color-deep-green)]">Site settings</h1>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Manage dynamic footer content for the storefront.
        </p>
      </div>

      <Card>
        <form onSubmit={handleFooterSubmit} className="space-y-6">
          <h2 className="text-lg font-semibold text-[color:var(--color-deep-green)]">Footer content</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Store name" value={footerForm.storeName} onChange={(e) => setFooterForm((prev) => ({ ...prev, storeName: e.target.value }))} />
            <Input label="Phone" value={footerForm.phone} onChange={(e) => setFooterForm((prev) => ({ ...prev, phone: e.target.value }))} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Email" value={footerForm.email} onChange={(e) => setFooterForm((prev) => ({ ...prev, email: e.target.value }))} />
            <Input label="WhatsApp link" value={footerForm.whatsapp} onChange={(e) => setFooterForm((prev) => ({ ...prev, whatsapp: e.target.value }))} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Facebook" value={footerForm.facebook} onChange={(e) => setFooterForm((prev) => ({ ...prev, facebook: e.target.value }))} />
            <Input label="Instagram" value={footerForm.instagram} onChange={(e) => setFooterForm((prev) => ({ ...prev, instagram: e.target.value }))} />
            <Input label="YouTube" value={footerForm.youtube} onChange={(e) => setFooterForm((prev) => ({ ...prev, youtube: e.target.value }))} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]">Footer description</label>
            <textarea rows={3} value={footerForm.description} onChange={(e) => setFooterForm((prev) => ({ ...prev, description: e.target.value }))} className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-secondary)] focus:border-[color:var(--color-emerald)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-emerald)]" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]">Payment methods</label>
              <textarea rows={2} value={footerForm.paymentMethods} onChange={(e) => setFooterForm((prev) => ({ ...prev, paymentMethods: e.target.value }))} placeholder="bKash, Nagad, Rocket, Visa, Mastercard" className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base text-[color:var(--color-text-primary)] focus:border-[color:var(--color-emerald)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-emerald)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]">Trust / feature text</label>
              <textarea rows={2} value={footerForm.trustItems} onChange={(e) => setFooterForm((prev) => ({ ...prev, trustItems: e.target.value }))} placeholder="Cash on Delivery, Secure Payment, Trusted Shopping" className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base text-[color:var(--color-text-primary)] focus:border-[color:var(--color-emerald)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-emerald)]" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]">Copyright text</label>
            <Input value={footerForm.copyrightText} onChange={(e) => setFooterForm((prev) => ({ ...prev, copyrightText: e.target.value }))} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-secondary)]">Footer sections</h3>
              <Button type="button" variant="outline" size="sm" onClick={addFooterSection}>Add section</Button>
            </div>

            {footerForm.sections.map((section, sectionIndex) => (
              <div key={`${section.title}-${sectionIndex}`} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <Input label="Section title" value={section.title} onChange={(e) => updateFooterSection(sectionIndex, 'title', e.target.value)} />
                <div className="mt-3 space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <div key={`${link.label}-${sectionIndex}-${linkIndex}`} className="grid gap-3 md:grid-cols-2">
                      <Input label="Link label" value={link.label} onChange={(e) => updateFooterLink(sectionIndex, linkIndex, 'label', e.target.value)} />
                      <Input label="Link href" value={link.href} onChange={(e) => updateFooterLink(sectionIndex, linkIndex, 'href', e.target.value)} />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => addFooterLink(sectionIndex)}>Add link</Button>
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" isLoading={isSavingFooter}>Save footer settings</Button>
        </form>
      </Card>
    </>
  )
}

export default SiteSettingsPage
