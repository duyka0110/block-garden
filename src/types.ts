export type ElementType = 'Water' | 'Sun' | 'Nutrient' | 'Soil'
export type GameStatus = 'playing' | 'won' | 'lost'
export type MapMode = 'fixed' | 'random'

export interface ShapeData {
  id: string
  cells: Array<{ x: number; y: number }>
}

export interface PlantTemplateData {
  name: string
  icon: string
}

export interface Cell {
  occupied: boolean
  element: ElementType
}

export interface Plant {
  id: number
  name: string
  icon: string
  slots: number[]
  requirements: Record<ElementType, number>
  progress: Record<ElementType, number>
  grown: boolean
}

export interface RingSlot {
  x: number
  y: number
  adjacentRows: number[]
  adjacentCols: number[]
}

export interface Layout {
  boardX: number
  boardY: number
  boardSize: number
  boardCell: number
  trayY: number
  trayCentersX: number[]
  trayCell: number
  gardenSize: number
}

export interface FlyingElement {
  element: ElementType
  startX: number
  startY: number
  endX: number
  endY: number
  elapsedMs: number
  durationMs: number
}
