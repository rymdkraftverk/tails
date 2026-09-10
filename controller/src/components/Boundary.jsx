import React, { Component } from 'react'
import PropTypes from 'prop-types'
import * as Sentry from '@sentry/browser'

const ERROR_LOGGING = process.env.REACT_APP_ERROR_LOGGING || false

class Boundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  componentDidMount() {
    const dsn = ERROR_LOGGING
      ? 'https://caf6a0992e884f0780da4343bc62e372@sentry.io/1325309'
      : ''
    Sentry.init({
      dsn,
    })
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error })
    Sentry.withScope(scope => {
      Object.keys(errorInfo).forEach(key => {
        scope.setExtra(key, errorInfo[key])
      })
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

Boundary.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Boundary
