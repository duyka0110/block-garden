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
