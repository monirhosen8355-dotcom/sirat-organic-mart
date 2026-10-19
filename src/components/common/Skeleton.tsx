import type { HTMLAttributes } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
}

export const Skeleton = ({ className = '', ...props }: SkeletonProps) => (
  <div
    aria-hidden="true"
    className={['animate-pulse rounded-md bg-gray-200/80', className].filter(Boolean).join(' ')}
    {...props}
  />
)

export const ProductGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="overflow-hidden rounded-card border border-gray-200 bg-white shadow-card"
      >
        <Skeleton className="aspect-square w-full rounded-none" />
        <div className="space-y-2 p-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    ))}
  </div>
)

export const ProductDetailSkeleton = () => (
  <div className="mx-auto max-w-6xl px-4 py-6">
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="space-y-3">
        <Skeleton className="aspect-[4/3] w-full rounded-card" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-20 w-full" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-12 w-full rounded-button" />
          <Skeleton className="h-12 w-full rounded-button" />
        </div>
      </div>
    </div>
  </div>
)

export const AccountSkeleton = () => (
  <div className="mx-auto max-w-2xl px-4 py-6">
    <Skeleton className="mb-6 h-7 w-40" />
    <div className="mb-4 flex items-center gap-3 rounded-card border border-gray-200 bg-white p-4 shadow-card">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="rounded-card border border-gray-200 bg-white p-4 shadow-card">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
    <Skeleton className="mt-6 h-11 w-full rounded-button" />
  </div>
)

export const OrderListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="mx-auto max-w-2xl px-4 py-6">
    <Skeleton className="mb-6 h-7 w-40" />
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-card border border-gray-200 bg-white p-4 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

export const OrderDetailSkeleton = () => (
  <div className="mx-auto max-w-2xl px-4 py-6">
    <div className="mb-4 flex items-center justify-between gap-3">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-7 w-24 rounded-full" />
    </div>
    <div className="mb-4 space-y-3 rounded-card border border-gray-200 bg-white p-4 shadow-card">
      <Skeleton className="h-4 w-28" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-start gap-3">
          <Skeleton className="mt-1 h-2.5 w-2.5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
    <div className="space-y-3 rounded-card border border-gray-200 bg-white p-4 shadow-card">
      <Skeleton className="h-4 w-28" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex gap-3">
          <Skeleton className="h-14 w-14 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  </div>
)

export const AddressListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="mx-auto max-w-2xl px-4 py-6">
    <div className="mb-6 flex items-center justify-between">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-9 w-28 rounded-button" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-card border border-gray-200 bg-white p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

export const DashboardSkeleton = () => (
  <div>
    <Skeleton className="mb-6 h-7 w-40" />
    <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-card border border-gray-200 bg-white p-4 shadow-card">
          <Skeleton className="mb-3 h-5 w-5 rounded" />
          <Skeleton className="mb-2 h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
    <div className="space-y-4">
      <div className="rounded-card border border-gray-200 bg-white p-4 shadow-card">
        <Skeleton className="mb-4 h-5 w-32" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4 py-2">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

export const TableSkeleton = ({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) => (
  <div className="overflow-hidden rounded-card border border-gray-200 bg-white shadow-card">
    <div className="grid gap-3 border-b border-gray-100 p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} className="h-4 w-2/3" />
      ))}
    </div>
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-3 p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton key={`${rowIndex}-${colIndex}`} className="h-5 w-full" />
          ))}
        </div>
      ))}
    </div>
  </div>
)

export const ListSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="rounded-card border border-gray-200 bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

export const FormSkeleton = () => (
  <div className="space-y-5">
    <Skeleton className="h-7 w-40" />
    <Skeleton className="h-12 w-full rounded-lg" />
    <Skeleton className="h-12 w-full rounded-lg" />
    <Skeleton className="h-24 w-full rounded-lg" />
    <div className="flex gap-3">
      <Skeleton className="h-11 w-32 rounded-button" />
      <Skeleton className="h-11 w-24 rounded-button" />
    </div>
  </div>
)

export const SearchSkeleton = () => (
  <div className="mx-auto max-w-7xl px-4 py-6">
    <Skeleton className="mb-6 h-12 w-full max-w-md rounded-lg" />
    <ProductGridSkeleton count={4} />
  </div>
)

export const HomePageSkeleton = () => (
  <div className="space-y-6 pb-8">
    <div className="mx-auto max-w-7xl px-4 pt-4 md:pt-6">
      <Skeleton className="h-48 w-full rounded-card md:h-72" />
    </div>
    <div className="mx-auto max-w-7xl px-4">
      <Skeleton className="mb-4 h-5 w-28" />
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex min-w-[90px] flex-col items-center gap-2">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    </div>
    <div className="mx-auto max-w-7xl px-4 pt-2 pb-6">
      <Skeleton className="mb-4 h-6 w-32" />
      <ProductGridSkeleton count={4} />
    </div>
  </div>
)

export const RouteFallbackSkeleton = () => (
  <div className="flex min-h-screen items-center justify-center p-6">
    <div className="w-full max-w-5xl space-y-6">
      <Skeleton className="h-14 w-full rounded-card" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-card" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-card" />
        <Skeleton className="h-72 w-full rounded-card" />
      </div>
    </div>
  </div>
)
