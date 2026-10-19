import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-button font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[color:var(--color-emerald)] text-white shadow-sm hover:bg-[color:var(--color-deep-green)] hover:shadow-md focus-visible:ring-[color:var(--color-emerald)]',
  secondary:
    'bg-[color:var(--color-deep-green)] text-white shadow-sm hover:opacity-90 hover:shadow-md focus-visible:ring-[color:var(--color-deep-green)]',
  outline:
    'border border-[color:var(--color-emerald)] text-[color:var(--color-emerald)] bg-transparent hover:bg-[color:var(--color-emerald)]/10 focus-visible:ring-[color:var(--color-emerald)]',
  ghost:
    'bg-transparent text-[color:var(--color-text-primary)] hover:bg-black/5 focus-visible:ring-[color:var(--color-emerald)]',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md focus-visible:ring-red-600',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-13 px-6 text-lg',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={[
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {isLoading ? (
          <span
            className="inline-block h-4 w-4 animate-pulse rounded-full bg-current/70"
            aria-hidden="true"
          />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button