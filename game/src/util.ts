export const range = (from: number, to: number) => Array
  .from({ length: to - from }, (_unused, index) => from + index)

export const shuffle = <T>(list: T[]) => list
  .map(item => ({ item, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort)
  .map(({ item }) => item)

export const sample = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)]
