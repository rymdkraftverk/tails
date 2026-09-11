export type Borders = Record<string, { min: number; max: number }>

export interface Tree<T> {
  borders:   Borders;
  dimension: string;
  value?:    T;
  true?:     Tree<T>;
  false?:    Tree<T>;
}

export type GetCoord<T> = (entity: T, dimension: string) => number

export const calculateMiddle = (borders: Borders, dimension: string) => {
  const { min, max } = borders[dimension]
  return (min + max) / 2
}

export const isNode = <T>(tree: Tree<T>) => Boolean(tree.true || tree.false)
