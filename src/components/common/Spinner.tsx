interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeMap: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
}

const Spinner = ({ size = 'md', className = '', label = 'লোড হচ্ছে...' }: SpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2" role="status">
      <span
        className={[
          'inline-block animate-spin rounded-full border-solid',
          'border-[color:var(--color-emerald)] border-t-transparent',
          sizeMap[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export default Spinner