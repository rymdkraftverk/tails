export const calculateMiddle = (borders, dimension) => {
  const { min, max } = borders[dimension]
  return (min + max) / 2
}

export const isNode = tree => tree.true || tree.false
