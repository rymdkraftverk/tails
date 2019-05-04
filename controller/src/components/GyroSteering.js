import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components/macro'

const Canvas = styled.canvas`
  height: 100%;
`

const GyroSteering = ({ angle }) => {
  const canvasRef = useRef(null)

  const [ctx, setCtx] = useState(null)
  const [height, setHeight] = useState(0)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    ctx.strokeStyle = 'black'
    ctx.lineWidth = 10
    setCtx(ctx)

    setHeight(canvas.height)
    setWidth(canvas.width)
  }, [])

  useEffect(() => {
    if (!ctx) return // Not set on first invocation

    // Reset old line
    ctx.clearRect(0, 0, width, height)

    // Calculate line
    const diff = (height / (18 * 2)) * angle
    const middleY = height / 2
    const y1 = middleY + diff
    const y2 = middleY - diff

    // Draw line
    ctx.beginPath()
    ctx.moveTo(0, y1)
    ctx.lineTo(width, y2)
    ctx.stroke()
  }, [angle])

  return <Canvas ref={canvasRef} />
}

GyroSteering.propTypes = {
  angle: PropTypes.number.isRequired,
}

export default GyroSteering
