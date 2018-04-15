const defaultStyle = {
  fontFamily: 'patchy-robots',
}

export const big = color => ({
  ...defaultStyle,
  fontSize:           48,
  fill:               color,
  stroke:             '#4a1850',
  strokeThickness:    5,
  dropShadow:         true,
  dropShadowColor:    '#000000',
  dropShadowBlur:     4,
  dropShadowAngle:    Math.PI / 6,
  dropShadowDistance: 6,
})

export const small = color => ({
  ...defaultStyle,
  fontSize:           28,
  fill:               color,
  stroke:             '#4a1850',
  strokeThickness:    3,
  dropShadow:         true,
  dropShadowColor:    '#000000',
  dropShadowBlur:     4,
  dropShadowAngle:    Math.PI / 6,
  dropShadowDistance: 3,
})
