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

export const medium = {
  ...defaultStyle,
  fontSize:           38,
  stroke:             '#000000',
  strokeThickness:    1,
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
  strokeThickness:    1,
  dropShadow:         true,
  dropShadowColor:    '#000000',
  dropShadowBlur:     4,
  dropShadowAngle:    Math.PI / 6,
  dropShadowDistance: 3,
}

export const code = {
  fontfamily:      'helvetica',
  fontSize:        50,
  fontWeight:      'bold',
  fill:            'white',
  stroke:          '#000000',
  strokeThickness: 1,
  dropShadow:      false,
  dropShadowColor: '#111',
}
