import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/browser'

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN

type BoundaryProps = { children: ReactNode }

class Boundary extends Component<BoundaryProps, { error: Error | null }> {
  constructor(props: BoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  componentDidMount() {
    if (SENTRY_DSN) {
      Sentry.init({ dsn: SENTRY_DSN })
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error })
    Sentry.withScope(scope => {
      scope.setExtra('componentStack', errorInfo.componentStack)
      Sentry.captureException(error)
    })
  }

  render() {
    const { error } = this.state
    const { children } = this.props

    if (error) {
      return (
        <div onClick={() => Sentry.showReportDialog()}>Report feedback</div>
      )
    }

    return children
  }
}

export default Boundary
