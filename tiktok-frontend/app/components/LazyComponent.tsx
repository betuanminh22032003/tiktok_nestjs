'use client'

import { useEffect, useState, type ComponentType } from 'react'

interface LazyComponentProps {
  loader: () => Promise<{ default: ComponentType<any> }>
  fallback?: React.ReactNode
  [key: string]: any
}

/**
 * Lazy load component with suspense fallback
 * Improves initial page load by code splitting
 */
export default function LazyComponent({
  loader,
  fallback = <div className="h-40 w-full animate-pulse rounded bg-gray-200" />,
  ...props
}: LazyComponentProps) {
  const [Component, setComponent] = useState<ComponentType<any> | null>(null)

  useEffect(() => {
    loader().then(module => {
      setComponent(() => module.default)
    })
  }, [loader])

  if (!Component) {
    return <>{fallback}</>
  }

  return <Component {...props} />
}
