import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padded?: boolean
  hoverable?: boolean
}

const Card = ({
  children,
  padded = true,
  hoverable = false,
  className = '',
  ...rest
}: CardProps) => {
  return (
    <div
      className={[
        'rounded-card border border-gray-200 bg-white shadow-card',
        padded ? 'p-4' : '',
        hoverable
          ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}

export default Card