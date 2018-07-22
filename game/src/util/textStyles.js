const defaultStyle = {
  fontFamily: 'patchy-robots',
}

/*
  Text style options are described here:
  http://pixijs.download/dev/docs/PIXI.TextStyle.html
*/

export const big = {
  ...defaultStyle,
  fontSize:           48,
  stroke:             '#000000',
  strokeThickness:    5,
  dropShadow:         true,
  dropShadowColor:    '#000000',
  dropShadowBlur:     4,
  dropShadowAngle:    Math.PI / 6,
  dropShadowDistance: 6,
}

export const small = {
  ...defaultStyle,
  fontSize:           28,
  stroke:             '#000000',
  strokeThickness:    3,
  dropShadow:         true,
  dropShadowColor:    '#000000',
  dropShadowBlur:     4,
  dropShadowAngle:    Math.PI / 6,
  dropShadowDistance: 3,
}

export const code = {
  fontfamily:         'helvetica',
  fontSize:           72,
  fill:               'white',
  stroke:             '#000000',
  strokeThickness:    5,
  dropShadow:         true,
  dropShadowColor:    '#000000',
  dropShadowBlur:     4,
  dropShadowAngle:    Math.PI / 6,
  dropShadowDistance: 6,
}
