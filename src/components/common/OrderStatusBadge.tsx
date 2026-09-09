import Badge from './Badge'
import type { OrderStatus } from '../../types'

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

const statusConfig: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  pending: { label: 'অপেক্ষমাণ', variant: 'warning' },
  confirmed: { label: 'কনফার্ম হয়েছে', variant: 'info' },
  processing: { label: 'প্রসেসিং হচ্ছে', variant: 'info' },
  shipped: { label: 'পাঠানো হয়েছে', variant: 'info' },
  delivered: { label: 'ডেলিভার হয়েছে', variant: 'success' },
  cancelled: { label: 'বাতিল হয়েছে', variant: 'danger' },
}

const OrderStatusBadge = ({ status, className }: OrderStatusBadgeProps) => {
  const config = statusConfig[status]
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

export default OrderStatusBadge