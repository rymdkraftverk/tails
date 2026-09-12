const defaultStyle = {
  fontFamily: 'patchy-robots',
}

const dropShadow = {
  color: '#000000',
  alpha: 1,
  blur:  4,
  angle: Math.PI / 6,
}

/*
  Text style options are described here:
  http://pixijs.download/dev/docs/PIXI.TextStyle.html
*/

export const BIG = {
  ...defaultStyle,
  fontSize:   48,
  stroke:     { color: '#000000', width: 5 },
  dropShadow: { ...dropShadow, distance: 6 },
}

export const MEDIUM = {
  ...defaultStyle,
  fontSize:   38,
  stroke:     { color: '#000000', width: 1 },
  dropShadow: { ...dropShadow, distance: 6 },
}

export const SMALL = {
  ...defaultStyle,
  fontSize:   28,
  stroke:     { color: '#000000', width: 1 },
  dropShadow: { ...dropShadow, distance: 3 },
}

export const CODE = {
  fontFamily: 'helvetica',
  fontSize:   50,
  fontWeight: 'bold' as const,
  fill:       'white',
  stroke:     { color: '#000000', width: 1 },
}
