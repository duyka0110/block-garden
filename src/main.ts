import './style.css'
import {
  BOARD_SIZE,
  DRAG_LIFT_Y,
  ELEMENT_COLORS,
  ELEMENT_ICONS,
  ELEMENTS,
  FIXED_ELEMENT_PATTERN,
  LOGICAL_H,
  LOGICAL_W,
  PLANT_TEMPLATES,
  SHAPES,
} from './gameData'
import type {
  Cell,
  ElementType,
  FlyingElement,
  GameStatus,
  Layout,
  MapMode,
  Plant,
  RingSlot,
  ShapeData,
} from './types'

type Shape = ShapeData

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const value = Number.parseInt(full, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const SHAPE_POOL: Shape[] = SHAPES

const RING_SLOTS: RingSlot[] = (() => {
  const slots: RingSlot[] = []
  for (let x = 0; x < BOARD_SIZE; x += 1) {
    slots.push({ x, y: -1, adjacentRows: [0], adjacentCols: [x] })
  }
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    slots.push({ x: BOARD_SIZE, y, adjacentRows: [y], adjacentCols: [BOARD_SIZE - 1] })
  }
  for (let x = BOARD_SIZE - 1; x >= 0; x -= 1) {
    slots.push({ x, y: BOARD_SIZE, adjacentRows: [BOARD_SIZE - 1], adjacentCols: [x] })
  }
  for (let y = BOARD_SIZE - 1; y >= 0; y -= 1) {
    slots.push({ x: -1, y, adjacentRows: [y], adjacentCols: [0] })
  }
  return slots
})()

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('Missing #app root')
}

app.innerHTML = `
<main class="game-shell">
  <header class="hud">
    <div class="left">
      <h1>Block Fill Garden</h1>
      <p>Clear rows/columns, earn elements, grow all plants.</p>
    </div>
    <div class="controls">
      <label>
        Element Map
        <select id="map-mode">
          <option value="fixed">Fixed pattern</option>
          <option value="random">Random</option>
        </select>
      </label>
      <button id="new-game">New Game</button>
    </div>
  </header>
  <section class="viewport-wrap">
    <canvas id="game-canvas"></canvas>
  </section>
  <section id="plants-panel"></section>
</main>
`

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!
const plantsPanel = document.querySelector<HTMLElement>('#plants-panel')!
const viewportWrap = document.querySelector<HTMLElement>('.viewport-wrap')!
const hud = document.querySelector<HTMLElement>('.hud')!
const mapModeSelect = document.querySelector<HTMLSelectElement>('#map-mode')!
const newGameButton = document.querySelector<HTMLButtonElement>('#new-game')!
const ctx = canvas.getContext('2d')!

const FRAME_PAD = 8
/** Tallest block in the tray is 5 cells; center sits at trayY. */
const MAX_TRAY_SHAPE_CELLS_H = 5

function computeTrayY(boardY: number, boardSize: number, trayCell: number): number {
  const boardCell = boardSize / BOARD_SIZE
  const gardenBottom = boardY + BOARD_SIZE * boardCell + boardCell
  const maxTrayHalf = (MAX_TRAY_SHAPE_CELLS_H / 2) * trayCell
  const boardToTrayGap = 0

  // Keep blocks close to the board, then clamp to remain in-frame.
  let trayY = gardenBottom + boardToTrayGap + maxTrayHalf
  const maxTrayY = LOGICAL_H - FRAME_PAD - maxTrayHalf - 10
  if (trayY > maxTrayY) {
    trayY = maxTrayY
  }
  return Math.round(trayY)
}

let layout: Layout = {
  boardX: 63,
  boardY: 112,
  boardSize: 279,
  boardCell: 279 / BOARD_SIZE,
  trayY: 651,
  trayCentersX: [86, 203, 320],
  trayCell: 19,
  gardenSize: 279 / BOARD_SIZE,
}

let level = 1
let status: GameStatus = 'playing'
let mapMode: MapMode = 'fixed'
let message = 'Drag blocks into the 7x7 board.'

let board: Cell[][] = []
let tray: Shape[] = []
let plants: Plant[] = []
let flyingElements: FlyingElement[] = []
let isResolvingAnimation = false
let lastFrameTime = performance.now()

let dragIndex: number | null = null
let dragOffset = { x: 0, y: 0 }
let dragPos = { x: 0, y: 0 }
let trayBounds: Array<{ x: number; y: number; w: number; h: number }> = []

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)]
}

function createBoard(mode: MapMode): Cell[][] {
  return Array.from({ length: BOARD_SIZE }, (_, y) =>
    Array.from({ length: BOARD_SIZE }, (_, x) => ({
      occupied: false,
      element: mode === 'fixed' ? FIXED_ELEMENT_PATTERN[y][x] : pick(ELEMENTS),
    })),
  )
}

function shapeBounds(shape: Shape): { w: number; h: number } {
  const maxX = Math.max(...shape.cells.map((c) => c.x))
  const maxY = Math.max(...shape.cells.map((c) => c.y))
  return { w: maxX + 1, h: maxY + 1 }
}

function generateTray(): Shape[] {
  const threeCellShapes = SHAPE_POOL.filter((shape) => shape.cells.length === 3)
  const randomShape = () => pick(SHAPE_POOL)
  const guaranteedThree = pick(threeCellShapes)
  const trayLocal = [guaranteedThree, randomShape(), randomShape()]

  // Shuffle so the guaranteed 3-cell block can appear in any slot.
  for (let i = trayLocal.length - 1; i > 0; i -= 1) {
    const j = rand(0, i)
    const tmp = trayLocal[i]
    trayLocal[i] = trayLocal[j]
    trayLocal[j] = tmp
  }

  return trayLocal
}

function createPlantRequirements(size: number): Record<ElementType, number> {
  return {
    Water: rand(2, 3) + Math.floor(size / 2),
    Sun: rand(2, 3) + Math.floor(size / 2),
    Nutrient: rand(2, 4) + Math.floor(size / 2),
    Soil: rand(1, 3) + Math.floor(size / 3),
  }
}

function generatePlants(targetLevel: number): Plant[] {
  const plantsLocal: Plant[] = []
  let cursor = 0
  let i = 0
  // Fill the full ring continuously with plants sized 3..5 slots.
  while (cursor < RING_SLOTS.length) {
    const remaining = RING_SLOTS.length - cursor
    let len: number
    if (remaining <= 5) {
      len = remaining
    } else {
      const validLens = [3, 4, 5].filter((candidate) => {
        const tail = remaining - candidate
        return tail === 0 || tail >= 3
      })
      len = pick(validLens)
    }

    const slots = Array.from({ length: len }, (_, idx) => cursor + idx)
    cursor += len

    const requirements = createPlantRequirements(len)
    const levelBonus = Math.floor(targetLevel / 2)
    for (const element of ELEMENTS) {
      requirements[element] += levelBonus
    }
    const template = PLANT_TEMPLATES[i % PLANT_TEMPLATES.length]

    plantsLocal.push({
      id: i + 1,
      name: template.name,
      icon: template.icon,
      slots,
      requirements,
      progress: { Water: 0, Sun: 0, Nutrient: 0, Soil: 0 },
      grown: false,
    })
    i += 1
  }

  return plantsLocal
}

function resetLevel(targetLevel: number): void {
  level = targetLevel
  board = createBoard(mapMode)
  tray = generateTray()
  plants = generatePlants(level)
  status = 'playing'
  message = `Level ${level}: grow all plants.`
  dragIndex = null
  renderPlantsPanel()
}

function renderPlantsPanel(): void {
  plantsPanel.innerHTML = `
    <div class="panel-head">
      <strong>Lv ${level}</strong>
      <span>${plants.filter((p) => p.grown).length}/${plants.length}</span>
    </div>
    <div class="plants-list">
      ${plants
        .map((plant) => {
          const req = plant.requirements
          const prog = plant.progress
          const metrics = ELEMENTS.map((el) => {
            const cur = Math.min(prog[el], req[el])
            return `
              <div class="req-item" style="--el:${ELEMENT_COLORS[el]}">
                <span class="req-icon" aria-hidden="true">${ELEMENT_ICONS[el]}</span>
                <span class="req-num">${cur}<span class="req-sep">/</span>${req[el]}</span>
              </div>`
          }).join('')
          return `
            <article class="plant-card ${plant.grown ? 'grown' : ''}">
              <header class="plant-card-head">
                <span class="plant-title">${plant.icon} ${plant.name}</span>
                <span class="plant-status">${plant.grown ? '✓' : '…'}</span>
              </header>
              <div class="plant-reqs">${metrics}</div>
            </article>
          `
        })
        .join('')}
    </div>
  `
}

function canPlace(shape: Shape, col: number, row: number): boolean {
  return shape.cells.every((cell) => {
    const x = col + cell.x
    const y = row + cell.y
    return (
      x >= 0 &&
      x < BOARD_SIZE &&
      y >= 0 &&
      y < BOARD_SIZE &&
      board[y][x] &&
      !board[y][x].occupied
    )
  })
}

function applyGrowth(distribution: Record<ElementType, number>, eligiblePlants: Plant[]): void {
  for (const element of ELEMENTS) {
    const amount = distribution[element]
    if (amount <= 0 || eligiblePlants.length === 0) {
      continue
    }

    const base = Math.floor(amount / eligiblePlants.length)
    let remainder = amount % eligiblePlants.length

    for (const plant of eligiblePlants) {
      const delta = base + (remainder > 0 ? 1 : 0)
      plant.progress[element] += delta
      if (remainder > 0) {
        remainder -= 1
      }
    }
  }

  for (const plant of plants) {
    plant.grown = ELEMENTS.every((el) => plant.progress[el] >= plant.requirements[el])
  }
}

function getPlantCenter(plant: Plant): { x: number; y: number } {
  let sumX = 0
  let sumY = 0
  for (const slotIndex of plant.slots) {
    const slot = RING_SLOTS[slotIndex]
    sumX += layout.boardX + slot.x * layout.boardCell + layout.gardenSize / 2
    sumY += layout.boardY + slot.y * layout.boardCell + layout.gardenSize / 2
  }
  return {
    x: sumX / plant.slots.length,
    y: sumY / plant.slots.length,
  }
}

function finalizeTurnAfterPlacement(): void {
  if (plants.every((plant) => plant.grown)) {
    status = 'won'
    message = `Level ${level} complete! Tap Next Level.`
  } else {
    if (tray.length === 0) {
      tray = generateTray()
    }
    if (!hasAnyMove()) {
      status = 'lost'
      message = 'No valid placement left. Restart level.'
    }
  }
  renderPlantsPanel()
}

function startDistributionAnimation(
  clearedCells: Array<{ col: number; row: number; element: ElementType }>,
  eligiblePlants: Plant[],
): void {
  if (eligiblePlants.length === 0 || clearedCells.length === 0) {
    flyingElements = []
    isResolvingAnimation = false
    return
  }

  const targets = eligiblePlants.map((plant) => getPlantCenter(plant))
  flyingElements = clearedCells.map((cell, idx) => {
    const startX = layout.boardX + cell.col * layout.boardCell + layout.boardCell / 2
    const startY = layout.boardY + cell.row * layout.boardCell + layout.boardCell / 2
    const target = targets[idx % targets.length]
    return {
      element: cell.element,
      startX,
      startY,
      endX: target.x,
      endY: target.y,
      elapsedMs: 0,
      durationMs: rand(520, 760),
    }
  })
  isResolvingAnimation = true
}

function processClears(): boolean {
  const fullRows: number[] = []
  const fullCols: number[] = []

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    if (board[row].every((cell) => cell.occupied)) {
      fullRows.push(row)
    }
  }

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    let full = true
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      if (!board[row][col].occupied) {
        full = false
        break
      }
    }
    if (full) {
      fullCols.push(col)
    }
  }

  if (!fullRows.length && !fullCols.length) {
    return false
  }

  const toClear = new Set<string>()
  for (const row of fullRows) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      toClear.add(`${col},${row}`)
    }
  }
  for (const col of fullCols) {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      toClear.add(`${col},${row}`)
    }
  }

  const earned: Record<ElementType, number> = { Water: 0, Sun: 0, Nutrient: 0, Soil: 0 }
  const clearedCells: Array<{ col: number; row: number; element: ElementType }> = []
  for (const key of toClear) {
    const [colStr, rowStr] = key.split(',')
    const col = Number(colStr)
    const row = Number(rowStr)
    const element = board[row][col].element
    earned[element] += 1
    clearedCells.push({ col, row, element })
  }

  const eligible = plants.filter((plant) =>
    plant.slots.some((slotIndex) => {
      const slot = RING_SLOTS[slotIndex]
      return fullRows.some((row) => slot.adjacentRows.includes(row)) || fullCols.some((col) => slot.adjacentCols.includes(col))
    }),
  )

  for (const key of toClear) {
    const [colStr, rowStr] = key.split(',')
    const col = Number(colStr)
    const row = Number(rowStr)
    board[row][col].occupied = false
  }

  const earnedText = ELEMENTS.map((el) => `${el.slice(0, 1)}:${earned[el]}`).join(' ')
  message = `Cleared ${fullRows.length} row(s), ${fullCols.length} col(s). Earned ${earnedText}`
  startDistributionAnimation(clearedCells, eligible)

  if (!isResolvingAnimation) {
    applyGrowth(earned, eligible)
    finalizeTurnAfterPlacement()
    return true
  }

  // Apply growth after animation finishes so feedback matches outcomes.
  const growthPayload = { ...earned }
  const eligiblePayload = [...eligible]
  const completeAnimation = () => {
    applyGrowth(growthPayload, eligiblePayload)
    finalizeTurnAfterPlacement()
  }
  pendingAnimationComplete = completeAnimation
  return true
}

function hasAnyMove(): boolean {
  return tray.some((shape) => {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (canPlace(shape, col, row)) {
          return true
        }
      }
    }
    return false
  })
}

function placeBlock(shape: Shape, col: number, row: number): void {
  for (const cell of shape.cells) {
    board[row + cell.y][col + cell.x].occupied = true
  }
}

function tryDropCurrentBlock(): void {
  if (dragIndex === null || status !== 'playing' || isResolvingAnimation) {
    return
  }

  const shape = tray[dragIndex]
  if (!shape) {
    dragIndex = null
    return
  }

  const blockTopLeftX = dragPos.x - dragOffset.x
  const blockTopLeftY = dragPos.y - dragOffset.y - DRAG_LIFT_Y
  const col = Math.round((blockTopLeftX - layout.boardX) / layout.boardCell)
  const row = Math.round((blockTopLeftY - layout.boardY) / layout.boardCell)

  if (canPlace(shape, col, row)) {
    placeBlock(shape, col, row)
    tray.splice(dragIndex, 1)
    const clearHandledTurn = processClears()
    if (!clearHandledTurn) {
      finalizeTurnAfterPlacement()
    }
  }

  dragIndex = null
}

function pointerToLogical(event: PointerEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * LOGICAL_W,
    y: ((event.clientY - rect.top) / rect.height) * LOGICAL_H,
  }
}

function updateCanvasSize(): void {
  const viewportPadding = 40
  const hudHeight = hud.getBoundingClientRect().height
  const plantsHeight = plantsPanel.getBoundingClientRect().height
  const availableHeight = Math.max(
    320,
    window.innerHeight - hudHeight - plantsHeight - viewportPadding,
  )

  const maxWidth = Math.min(window.innerWidth - 28, 520)
  let width = maxWidth
  let height = (width * LOGICAL_H) / LOGICAL_W

  if (height > availableHeight) {
    height = availableHeight
    width = (height * LOGICAL_W) / LOGICAL_H
  }

  const outerFrameBottomCrop = 180
  const visibleHeight = Math.max(220, height - outerFrameBottomCrop)
  viewportWrap.style.height = `${Math.floor(visibleHeight + 8)}px`
  viewportWrap.style.maxHeight = `${Math.floor(visibleHeight + 8)}px`

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  canvas.style.marginBottom = `-${outerFrameBottomCrop}px`
  const scaleX = width / LOGICAL_W
  const scaleY = height / LOGICAL_H
  ctx.setTransform(scaleX * dpr, 0, 0, scaleY * dpr, 0, 0)

  const boardSize = 279
  const boardY = 112
  const trayCell = 19
  layout = {
    boardX: (LOGICAL_W - boardSize) / 2,
    boardY,
    boardSize,
    boardCell: boardSize / BOARD_SIZE,
    trayY: computeTrayY(boardY, boardSize, trayCell),
    trayCentersX: [86, 203, 320],
    trayCell,
    gardenSize: boardSize / BOARD_SIZE,
  }
}

function drawRoundedRect(x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawBlock(
  shape: Shape,
  originX: number,
  originY: number,
  cellSize: number,
  alpha = 1,
  strokeWidth = 1.5,
  strokeColor = '#7CF3A0',
): void {
  ctx.globalAlpha = alpha
  for (const cell of shape.cells) {
    const x = originX + cell.x * cellSize
    const y = originY + cell.y * cellSize
    drawRoundedRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 1)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fill()
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeWidth
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function draw(): void {
  ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H)

  const frameBottomInset = 96
  drawRoundedRect(
    FRAME_PAD,
    FRAME_PAD,
    LOGICAL_W - FRAME_PAD * 2,
    LOGICAL_H - FRAME_PAD * 2 - frameBottomInset,
    10,
  )
  ctx.fillStyle = '#142014'
  ctx.fill()

  const textPad = 14
  ctx.fillStyle = '#E8FBEA'
  ctx.font = 'bold 20px system-ui'
  ctx.fillText('Block Fill Garden', textPad, 40)
  ctx.font = '12px system-ui'
  ctx.fillStyle = '#B7D7BA'
  ctx.fillText(`Lv ${level} • ${mapMode === 'fixed' ? 'Fixed' : 'Random'}`, textPad, 56)
  ctx.fillText(message, textPad, 70)

  const { boardX, boardY, boardCell, trayY, trayCentersX, trayCell, gardenSize } = layout
  const elementIconSize = Math.max(15, Math.floor(boardCell * 0.21))
  const plantIconSize = Math.max(17, Math.floor(gardenSize * 0.25))

  drawRoundedRect(boardX - 8, boardY - 8, layout.boardSize + 16, layout.boardSize + 16, 8)
  ctx.fillStyle = '#28402A'
  ctx.fill()

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const x = boardX + col * boardCell
      const y = boardY + row * boardCell
      drawRoundedRect(x + 1, y + 1, boardCell - 2, boardCell - 2, 1)
      ctx.fillStyle = '#1B2E1C'
      ctx.fill()
      ctx.strokeStyle = board[row][col].occupied
        ? 'rgba(88, 255, 136, 1)'
        : hexToRgba(ELEMENT_COLORS[board[row][col].element], 0.35)
      ctx.lineWidth = board[row][col].occupied ? 4 : 1
      ctx.stroke()
      ctx.fillStyle = '#DDF2E0'
      ctx.font = `${elementIconSize}px system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha = board[row][col].occupied ? 1 : 0.5
      ctx.fillText(ELEMENT_ICONS[board[row][col].element], x + boardCell / 2, y + boardCell / 2 + 1)
      ctx.globalAlpha = 1
    }
  }
  ctx.textAlign = 'start'
  ctx.textBaseline = 'alphabetic'

  for (const plant of plants) {
    const plantColor = plant.grown ? '#92FF8A' : '#FBAF5A'
    for (const slotIndex of plant.slots) {
      const slot = RING_SLOTS[slotIndex]
      const x = boardX + slot.x * boardCell + (boardCell - gardenSize) / 2
      const y = boardY + slot.y * boardCell + (boardCell - gardenSize) / 2
      drawRoundedRect(x, y, gardenSize, gardenSize, 8)
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fill()
      ctx.strokeStyle = plantColor
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.fillStyle = '#E8FBEA'
      ctx.font = `${plantIconSize}px system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(plant.icon, x + gardenSize / 2, y + gardenSize / 2 + 1)
    }
  }
  ctx.textAlign = 'start'
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = '#DFF3E1'
  ctx.font = 'bold 13px system-ui'
  ctx.fillText('Blocks', textPad, trayY - 18)
  ctx.font = '11px system-ui'
  ctx.fillText('No rotation', 72, trayY - 18)

  trayBounds = []
  tray.forEach((shape, idx) => {
    const bounds = shapeBounds(shape)
    const pxW = bounds.w * trayCell
    const pxH = bounds.h * trayCell
    const x = trayCentersX[idx] - pxW / 2
    const y = trayY - pxH / 2
    trayBounds.push({ x, y, w: pxW, h: pxH })

    drawRoundedRect(x - 6, y - 6, pxW + 12, pxH + 12, 6)
    ctx.fillStyle = '#1E3320'
    ctx.fill()
    if (dragIndex !== idx) {
      drawBlock(shape, x, y, trayCell, 1)
    }
  })

  if (dragIndex !== null && tray[dragIndex]) {
    const shape = tray[dragIndex]
    const dragX = dragPos.x - dragOffset.x
    const dragY = dragPos.y - dragOffset.y - DRAG_LIFT_Y

    const col = Math.round((dragX - boardX) / boardCell)
    const row = Math.round((dragY - boardY) / boardCell)
    if (canPlace(shape, col, row)) {
      drawBlock(shape, boardX + col * boardCell, boardY + row * boardCell, boardCell, 0.95, 4, '#7DFFAE')
    }
    drawBlock(shape, dragX, dragY, trayCell, 0.9)
  }

  for (const particle of flyingElements) {
    const t = Math.min(1, particle.elapsedMs / particle.durationMs)
    const eased = 1 - (1 - t) * (1 - t)
    const x = particle.startX + (particle.endX - particle.startX) * eased
    const y = particle.startY + (particle.endY - particle.startY) * eased - Math.sin(eased * Math.PI) * 18

    const baseSize = 11
    const peakSize = 21
    const popPhase = 0.2
    let size: number
    if (t < popPhase) {
      const popT = t / popPhase
      size = baseSize + (peakSize - baseSize) * popT
    } else {
      const shrinkT = (t - popPhase) / (1 - popPhase)
      size = peakSize + (baseSize - peakSize) * shrinkT
    }

    ctx.globalAlpha = 0.45 + (1 - t) * 0.55
    ctx.fillStyle = '#E8FBEA'
    ctx.font = `${size}px system-ui`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(ELEMENT_ICONS[particle.element], x, y)
    ctx.globalAlpha = 1
  }
  ctx.textAlign = 'start'
  ctx.textBaseline = 'alphabetic'

  if (status !== 'playing') {
    const ox = 28
    const oy = 300
    const ow = LOGICAL_W - 56
    const oh = 108
    drawRoundedRect(ox, oy, ow, oh, 10)
    ctx.fillStyle = 'rgba(14, 18, 14, 0.9)'
    ctx.fill()
    ctx.fillStyle = '#ECFFEE'
    ctx.font = 'bold 21px system-ui'
    ctx.fillText(status === 'won' ? 'Level Cleared!' : 'No More Moves', ox + 18, oy + 44)
    ctx.font = '12px system-ui'
    ctx.fillText(status === 'won' ? 'Next: button below' : 'New Game to restart', ox + 18, oy + 72)
  }
}

let pendingAnimationComplete: null | (() => void) = null

function updateAnimation(deltaMs: number): void {
  if (!isResolvingAnimation || flyingElements.length === 0) {
    return
  }
  for (const particle of flyingElements) {
    particle.elapsedMs += deltaMs
  }
  flyingElements = flyingElements.filter((particle) => particle.elapsedMs < particle.durationMs)
  if (flyingElements.length === 0) {
    isResolvingAnimation = false
    if (pendingAnimationComplete) {
      pendingAnimationComplete()
      pendingAnimationComplete = null
    }
  }
}

canvas.addEventListener('pointerdown', (event) => {
  if (status !== 'playing') {
    return
  }
  const point = pointerToLogical(event)
  for (let i = trayBounds.length - 1; i >= 0; i -= 1) {
    const box = trayBounds[i]
    if (point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h) {
      dragIndex = i
      dragOffset = { x: point.x - box.x, y: point.y - box.y }
      dragPos = point
      canvas.setPointerCapture(event.pointerId)
      break
    }
  }
})

canvas.addEventListener('pointermove', (event) => {
  if (dragIndex === null) {
    return
  }
  dragPos = pointerToLogical(event)
})

canvas.addEventListener('pointerup', () => {
  tryDropCurrentBlock()
})

canvas.addEventListener('pointercancel', () => {
  dragIndex = null
})

mapModeSelect.addEventListener('change', () => {
  mapMode = mapModeSelect.value === 'random' ? 'random' : 'fixed'
  resetLevel(1)
})

newGameButton.addEventListener('click', () => {
  if (status === 'won') {
    resetLevel(level + 1)
  } else {
    resetLevel(1)
  }
})

function loop(): void {
  const now = performance.now()
  const deltaMs = Math.min(50, now - lastFrameTime)
  lastFrameTime = now
  updateAnimation(deltaMs)
  draw()
  requestAnimationFrame(loop)
}

window.addEventListener('resize', updateCanvasSize)
updateCanvasSize()
resetLevel(1)
loop()
