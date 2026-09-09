import { forwardRef, useId, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, fullWidth = true, id, className = '', required, ...rest },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id || generatedId
    const hintId = hint ? `${inputId}-hint` : undefined
    const errorId = error ? `${inputId}-error` : undefined

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-[color:var(--color-text-primary)]"
          >
            {label}
            {required && <span className="ml-0.5 text-red-600">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={[
            'h-11 w-full rounded-lg border bg-white px-3.5 text-base text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-secondary)] transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-[color:var(--color-emerald)] focus:ring-[color:var(--color-emerald)]',
            'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />

        {hint && !error && (
          <p id={hintId} className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input