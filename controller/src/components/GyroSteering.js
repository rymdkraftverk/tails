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
    const ctx = canvas.getContext('2d')

    // Reset old line
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Static setup
    ctx.beginPath()
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 10

    // Calculate line
    const diff = (canvas.height / (18 * 2)) * angle
    const middleY = canvas.height / 2
    const y1 = middleY + diff
    const y2 = middleY - diff

    // Draw line
    ctx.moveTo(0, y1)
    ctx.lineTo(canvas.width, y2)
    ctx.stroke()
  }, [angle])

  return <Canvas ref={canvasRef} />
}

GyroSteering.propTypes = {
  angle: PropTypes.number.isRequired,
}

export default GyroSteering
