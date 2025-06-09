import type { AppProps } from 'next/app'
import { ErrorBoundary } from '@/utils/errorTracking'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  )
} 