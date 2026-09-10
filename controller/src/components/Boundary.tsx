import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/browser'

const ERROR_LOGGING = process.env.REACT_APP_ERROR_LOGGING || false

type BoundaryProps = { children: ReactNode }

class Boundary extends Component<BoundaryProps, { error: Error | null }> {
  constructor(props: BoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  componentDidMount() {
    if (ERROR_LOGGING) {
      Sentry.init({
        dsn: 'https://caf6a0992e884f0780da4343bc62e372@sentry.io/1325309',
      })
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
