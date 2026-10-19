import type { HTMLAttributes, ReactNode } from 'react'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'sale'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-700',
  sale: 'bg-[color:var(--color-sale-bg)] text-[color:var(--color-sale)] font-semibold',
}

const Badge = ({ children, variant = 'neutral', className = '', ...rest }: BadgeProps) => {
  return (
    <span
      className={[
        'inline-flex items-center rounded-badge px-2.5 py-1 text-xs font-medium',
        variantStyles[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </span>
  )
}

export default Badge