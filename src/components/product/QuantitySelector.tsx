import { Minus, Plus } from 'lucide-react'

interface QuantitySelectorProps {
  quantity: number
  onChange: (quantity: number) => void
  max?: number
  min?: number
}

const QuantitySelector = ({ quantity, onChange, max = 99, min = 1 }: QuantitySelectorProps) => {
  return (
    <div className="inline-flex items-center rounded-lg border border-gray-300">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        aria-label="কমান"
        className="flex h-10 w-10 items-center justify-center text-[color:var(--color-text-primary)] disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center text-sm font-medium" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        aria-label="বাড়ান"
        className="flex h-10 w-10 items-center justify-center text-[color:var(--color-text-primary)] disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

export default QuantitySelector