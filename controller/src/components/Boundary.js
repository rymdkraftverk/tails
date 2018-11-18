import React, { Component } from 'react'
import * as Sentry from '@sentry/browser';

const { REACT_APP_ERROR_LOGGING: ERROR_LOGGING = false } = process.env

class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  componentDidMount() {
    const dsn = ERROR_LOGGING
      ? 'https://caf6a0992e884f0780da4343bc62e372@sentry.io/1325309'
      : ''
    Sentry.init({
      dsn,
    });
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error });
    Sentry.withScope(scope => {
      Object.keys(errorInfo).forEach(key => {
        scope.setExtra(key, errorInfo[key]);
      });
      Sentry.captureException(error);
    });
  }

  render() {
    if (this.state.error) {
      return (
        <a onClick={() => Sentry.showReportDialog()}>Report feedback</a>
      );
    } else {
      return this.props.children;
    }
  }
}

export default Boundary
