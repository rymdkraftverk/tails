import { Component } from 'react'
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

type ToastProps = {
  onHide: () => void
  text: string
  type: keyof typeof background
}

class Toast extends Component<ToastProps, { visible: boolean }> {
  timer: ReturnType<typeof setTimeout> | undefined

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

export default Toast
