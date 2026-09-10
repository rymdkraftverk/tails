import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

const Canvas = styled.canvas`
  height: 100%;
`

const getDiff = (height: number, angle: number) => angle * (height / (18 * 2))

function GyroSteering({ angle }: { angle: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [height, setHeight] = useState(0)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) return

    const context = canvas.getContext('2d')

    if (!context) return

    context.strokeStyle = 'black'
    context.lineWidth = 10
    setCtx(context)

    setHeight(canvas.height)
    setWidth(canvas.width)
  }, [])

  useEffect(() => {
    if (!ctx) return // Not set on first invocation

    // Reset old line
    ctx.clearRect(0, 0, width, height)

    // Calculate line
    const diff = getDiff(height, angle)
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

export default GyroSteering
