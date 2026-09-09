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
        'rounded-xl border border-gray-200 bg-white shadow-sm',
        padded ? 'p-4' : '',
        hoverable ? 'transition-shadow duration-150 hover:shadow-md' : '',
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