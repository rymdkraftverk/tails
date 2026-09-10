import { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const VISIBLE_MILLISECONDS = 5000

const background = {
  error: '#d0342c',
  warning: '#d08b2c',
}

const Banner = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  padding: 0.6em;
  text-align: center;
  font-size: 3vw;
  color: #eee;
  background: var(--toast-background);
`

class Toast extends Component {
  state = { visible: true }

  componentDidMount() {
    this.timer = setTimeout(() => {
      this.setState({ visible: false })
      this.props.onHide()
    }, VISIBLE_MILLISECONDS)
  }

  componentWillUnmount() {
    clearTimeout(this.timer)
  }

  render() {
    const { text, type } = this.props
    const { visible } = this.state

    if (!visible) {
      return null
    }

    return (
      <Banner style={{ '--toast-background': background[type] }}>{text}</Banner>
    )
  }
}

Toast.propTypes = {
  onHide: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['error', 'warning']).isRequired,
}

export default Toast
