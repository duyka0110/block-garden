import type { ElementType, PlantTemplateData, ShapeData } from './types'

export const BOARD_SIZE = 7
/** Logical canvas size (9:16). Tighter than 900×1600 so less empty space below the block tray. */
export const LOGICAL_W = 405
export const LOGICAL_H = 720
export const DRAG_LIFT_Y = 41

export const ELEMENTS: ElementType[] = ['Water', 'Sun', 'Nutrient', 'Soil']

export const ELEMENT_COLORS: Record<ElementType, string> = {
  Water: '#3BA7FF',
  Sun: '#FFC940',
  Nutrient: '#A365FF',
  Soil: '#8B5A3C',
}

/** Opaque, lightened fills for occupied board tiles (must not use alpha — board bg shows through). */
export const OCCUPIED_TILE_COLORS: Record<ElementType, string> = {
  Water: '#5EC8FF',
  Sun: '#FFE566',
  Nutrient: '#D4A8FF',
  Soil: '#D4A078',
}

export const ELEMENT_ICONS: Record<ElementType, string> = {
  Water: '💧',
  Sun: '🌞',
  Nutrient: '💩',
  Soil: '🪨',
}

export const FIXED_ELEMENT_PATTERN: ElementType[][] = [
  ['Water', 'Sun', 'Nutrient', 'Soil', 'Water', 'Sun', 'Nutrient'],
  ['Soil', 'Water', 'Sun', 'Nutrient', 'Soil', 'Water', 'Sun'],
  ['Nutrient', 'Soil', 'Water', 'Sun', 'Nutrient', 'Soil', 'Water'],
  ['Sun', 'Nutrient', 'Soil', 'Water', 'Sun', 'Nutrient', 'Soil'],
  ['Water', 'Sun', 'Nutrient', 'Soil', 'Water', 'Sun', 'Nutrient'],
  ['Soil', 'Water', 'Sun', 'Nutrient', 'Soil', 'Water', 'Sun'],
  ['Nutrient', 'Soil', 'Water', 'Sun', 'Nutrient', 'Soil', 'Water'],
]

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
}

function columnHasElement(grid: (ElementType | null)[][], col: number, el: ElementType, size: number): boolean {
  for (let row = 0; row < size; row += 1) {
    if (grid[row][col] === el) {
      return true
    }
  }
  return false
}

function findEmptyInColumn(grid: (ElementType | null)[][], col: number, size: number): number {
  for (let row = 0; row < size; row += 1) {
    if (grid[row][col] === null) {
      return row
    }
  }
  return -1
}

function swapElementIntoColumn(
  grid: (ElementType | null)[][],
  col: number,
  el: ElementType,
  size: number,
  rng: () => number,
): boolean {
  const candidates: Array<{ r: number; c2: number }> = []
  for (let r = 0; r < size; r += 1) {
    for (let c2 = 0; c2 < size; c2 += 1) {
      if (c2 === col) {
        continue
      }
      if (grid[r][c2] === el && grid[r][col] !== el) {
        candidates.push({ r, c2 })
      }
    }
  }
  if (candidates.length === 0) {
    return false
  }
  const { r, c2 } = candidates[Math.floor(rng() * candidates.length)]
  const displaced = grid[r][col]!
  grid[r][col] = el
  grid[r][c2] = displaced
  return true
}

function fixColumnConstraints(
  grid: (ElementType | null)[][],
  size: number,
  rng: () => number,
): boolean {
  for (let col = 0; col < size; col += 1) {
    for (const el of ELEMENTS) {
      if (columnHasElement(grid, col, el, size)) {
        continue
      }
      const emptyRow = findEmptyInColumn(grid, col, size)
      if (emptyRow >= 0) {
        grid[emptyRow][col] = el
        continue
      }
      if (!swapElementIntoColumn(grid, col, el, size, rng)) {
        return false
      }
    }
  }
  return true
}

function validateElementGrid(grid: ElementType[][], size: number): boolean {
  for (let row = 0; row < size; row += 1) {
    for (const el of ELEMENTS) {
      if (!grid[row].includes(el)) {
        return false
      }
    }
  }
  for (let col = 0; col < size; col += 1) {
    for (const el of ELEMENTS) {
      let found = false
      for (let row = 0; row < size; row += 1) {
        if (grid[row][col] === el) {
          found = true
          break
        }
      }
      if (!found) {
        return false
      }
    }
  }
  return true
}

/** Random 7×7 layout: every row and column contains at least one of each element. */
export function generateConstrainedElementGrid(
  size: number,
  rng: () => number = Math.random,
): ElementType[][] {
  const maxAttempts = 300
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const grid: (ElementType | null)[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => null),
    )

    for (let row = 0; row < size; row += 1) {
      const cols = Array.from({ length: size }, (_, i) => i)
      shuffleInPlace(cols, rng)
      ELEMENTS.forEach((el, i) => {
        grid[row][cols[i]] = el
      })
    }

    if (!fixColumnConstraints(grid, size, rng)) {
      continue
    }

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (grid[row][col] === null) {
          grid[row][col] = ELEMENTS[Math.floor(rng() * ELEMENTS.length)]
        }
      }
    }

    const resolved = grid as ElementType[][]
    if (validateElementGrid(resolved, size)) {
      return resolved
    }
  }

  return FIXED_ELEMENT_PATTERN.map((row) => [...row])
}

export const PLANT_TEMPLATES: PlantTemplateData[] = [
  { name: 'Oak', icon: '🌳' },
  { name: 'Rose', icon: '🌸' },
  { name: 'Apple', icon: '🍎' },
  { name: 'Pine', icon: '🌲' },
  { name: 'Tulip', icon: '🌷' },
  { name: 'Pear', icon: '🍐' },
  { name: 'Peach', icon: '🍑' },
  { name: 'Maple', icon: '🍁' },
]

export const SHAPES: ShapeData[] = [
  { id: 'I2H', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
  { id: 'I2V', cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },

  { id: 'I3H', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }] },
  { id: 'I3V', cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }] },
  { id: 'L3R0', cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { id: 'L3R1', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }] },
  { id: 'L3R2', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }] },
  { id: 'L3R3', cells: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },

  { id: 'L4R0', cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }] },
  { id: 'L4R1', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }] },
  { id: 'L4R2', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }] },
  { id: 'L4R3', cells: [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  { id: 'T4R0', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }] },
  { id: 'T4R1', cells: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }] },
  { id: 'T4R2', cells: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  { id: 'T4R3', cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 1 }] },
  { id: 'O4', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { id: 'S4H', cells: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { id: 'S4V', cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }] },
  { id: 'I4H', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }] },
  { id: 'I4V', cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }] },

  { id: 'P5R0', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { id: 'P5R1', cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 2 }] },
  { id: 'P5R2', cells: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  { id: 'P5R3', cells: [{ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 2 }] },
  { id: 'U5R0', cells: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  { id: 'U5R1', cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }] },
  { id: 'U5R2', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 2, y: 1 }] },
  { id: 'U5R3', cells: [{ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 2 }] },
  { id: 'Z5R0', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }] },
  { id: 'Z5R1', cells: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }] },
  { id: 'Z5R2', cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }] },
  { id: 'Z5R3', cells: [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 2 }] },
  { id: 'T5R0', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }] },
  { id: 'T5R1', cells: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }] },
  { id: 'T5R2', cells: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }] },
  { id: 'T5R3', cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }] },
]
