import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components/macro'

const Canvas = styled.canvas`
  height: 100%;
`

const GyroSteering = ({ angle }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.beginPath()
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 10
    const diff = canvas.height / 18 * angle
    ctx.moveTo(0, canvas.height - diff)
    ctx.lineTo(canvas.width, diff)
    ctx.stroke()

  }, [angle])

  return <Canvas ref={canvasRef} />
}

GyroSteering.propTypes = {
  angle: PropTypes.number.isRequired,
}

export default GyroSteering
