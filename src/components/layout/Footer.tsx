import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageCircle,
  Phone,
  ShieldCheck,
  CirclePlay,
  Camera,
  BadgeCheck,
} from 'lucide-react'
import { DEFAULT_FOOTER_SETTINGS, getFooterSettings } from '../../services/settings/metaPixelSettingsService'
import type { SiteFooterSettings } from '../../types'
import BrandName from '../common/BrandName'

const paymentStyles: Record<string, { bg: string; text: string; accent: string }> = {
  bkash: { bg: 'bg-[#E2136E]', text: 'text-white', accent: 'bg-pink-300/40' },
  nagad: { bg: 'bg-[#00A651]', text: 'text-white', accent: 'bg-emerald-300/40' },
  rocket: { bg: 'bg-[#F7B500]', text: 'text-[#1E1E1E]', accent: 'bg-yellow-200/60' },
  visa: { bg: 'bg-[#1A1F71]', text: 'text-white', accent: 'bg-blue-300/30' },
  mastercard: { bg: 'bg-[#EB001B]', text: 'text-white', accent: 'bg-orange-300/30' },
  sslcommerz: { bg: 'bg-[#1F2A44]', text: 'text-white', accent: 'bg-slate-300/30' },
  amex: { bg: 'bg-[#0077C8]', text: 'text-white', accent: 'bg-sky-300/30' },
  cashondelivery: { bg: 'bg-[#0F766E]', text: 'text-white', accent: 'bg-teal-300/30' },
}

function PaymentBadge({ method }: { method: string }) {
  const normalized = method.toLowerCase().replace(/[^a-z]/g, '')
  const style = paymentStyles[normalized] ?? {
    bg: 'bg-[#F3F4F6]',
    text: 'text-[#1F2937]',
    accent: 'bg-gray-200',
  }

  const initial = (method || 'P').slice(0, 1).toUpperCase()

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-gray-200 ${style.bg} ${style.text} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] shadow-sm`}
      aria-label={method}
      title={method}
    >
      <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black ${style.accent}`}>
        {initial}
      </span>
      {method}
    </div>
  )
}

const Footer = () => {
  const [settings, setSettings] = useState<SiteFooterSettings>(DEFAULT_FOOTER_SETTINGS)

  useEffect(() => {
    let isMounted = true

    async function loadFooterSettings() {
      try {
        const data = await getFooterSettings()
        if (isMounted) setSettings(data)
      } catch (error) {
        console.error('Failed to load footer settings.', error)
      }
    }

    loadFooterSettings()
    return () => {
      isMounted = false
    }
  }, [])

  const quickLinks = settings.sections.flatMap((section) => section.links).slice(0, 5)
  const paymentMethods = settings.paymentMethods.length > 0 ? settings.paymentMethods : ['bKash', 'Nagad', 'Rocket', 'Visa', 'Mastercard']

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-emerald)] text-sm font-black text-white shadow-sm">
              S
            </div>
            <div>
              <div className="text-base font-semibold text-[color:var(--color-deep-green)]">
                <BrandName />
              </div>
              <div className="text-[11px] text-[color:var(--color-text-secondary)]">
                {settings.description}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--color-text-secondary)]">
            <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-[color:var(--color-emerald)]">
              <Phone className="h-3.5 w-3.5" />
              {settings.phone}
            </a>
            {settings.whatsapp && (
              <a
                href={settings.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[color:var(--color-emerald)]"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-secondary)]">
            {quickLinks.map((link) => (
              <Link key={`${link.label}-${link.href}`} to={link.href} className="transition-colors hover:text-[color:var(--color-emerald)]">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {settings.facebook && (
              <a href={settings.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-[color:var(--color-text-secondary)] transition hover:bg-[color:var(--color-emerald)] hover:text-white">
                <BadgeCheck className="h-3.5 w-3.5" />
              </a>
            )}
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-[color:var(--color-text-secondary)] transition hover:bg-[color:var(--color-emerald)] hover:text-white">
                <Camera className="h-3.5 w-3.5" />
              </a>
            )}
            {settings.youtube && (
              <a href={settings.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-[color:var(--color-text-secondary)] transition hover:bg-[color:var(--color-emerald)] hover:text-white">
                <CirclePlay className="h-3.5 w-3.5" />
              </a>
            )}
            {settings.whatsapp && (
              <a href={settings.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-600">
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 border-t border-gray-100 pt-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[color:var(--color-text-secondary)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--color-emerald)]" />
            Secure payments
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {paymentMethods.map((method, index) => (
              <PaymentBadge key={`${method}-${index}`} method={method} />
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1 border-t border-gray-100 pt-3 text-[11px] text-[color:var(--color-text-secondary)] md:flex-row md:items-center md:justify-between">
          <span>{settings.copyrightText}</span>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/privacy-policy" className="hover:text-[color:var(--color-emerald)]">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-[color:var(--color-emerald)]">
              Terms
            </Link>
            <Link to="/returns-refunds" className="hover:text-[color:var(--color-emerald)]">
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer