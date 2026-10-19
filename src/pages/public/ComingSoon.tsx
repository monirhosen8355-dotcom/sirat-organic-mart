interface ComingSoonProps {
  pageName?: string
}

const ComingSoon = ({ pageName }: ComingSoonProps) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 text-xl font-semibold text-[color:var(--color-deep-green)]">
        {pageName ? `${pageName} — Coming Soon` : 'Coming Soon'}
      </h1>
      <p className="text-[color:var(--color-text-secondary)]">
        This page is still under construction.
      </p>
    </div>
  )
}

export default ComingSoon