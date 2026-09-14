import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import * as Sentry from '@sentry/browser'

const Fallback = () => (
  <div onClick={() => Sentry.showReportDialog()}>Report feedback</div>
)

const Boundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary
    FallbackComponent={Fallback}
    onError={(error, { componentStack }) => {
      Sentry.withScope(scope => {
        scope.setExtra('componentStack', componentStack)
        Sentry.captureException(error)
      })
    }}
  >
    {children}
  </ErrorBoundary>
)

export default Boundary
