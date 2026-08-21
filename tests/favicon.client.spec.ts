/**
 * ui-favicon-status favicon painting: wedge geometry, the annulus-sector paint
 * calls, and the canvas renderer's data-URL encoding (canvas stubbed — jsdom
 * provides no 2D context).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FaviconPainter, WedgeSlice } from '../src/client/favicon.ts'
import {
  createCanvasRenderer, END_GAP, paintFavicon, wedgeSlices,
} from '../src/client/favicon.ts'

const PALETTE = { running: '#00f', pending: '#ff0', done: '#0f0' }

/** One recorded arc call: the painter face's argument tuple (counterclockwise optional). */
type ArcCall = [number, number, number, number, number, boolean?]

/** Recording painter: captures every fill-style, arc, and drawImage call. */
function makePainter(): {
  painter: FaviconPainter
  fills: string[]
  arcs: ArcCall[]
  draws: [unknown, number, number, number, number][]
  clears: { count: number }
} {
  const fills: string[] = []
  const arcs: ArcCall[] = []
  const draws: [unknown, number, number, number, number][] = []
  const clears = { count: 0 }
  return {
    painter: {
      clearRect: () => { clears.count += 1 },
      setFillStyle: (color) => { fills.push(color) },
      beginPath: () => {},
      arc: (...args: ArcCall) => { arcs.push(args) },
      closePath: () => {},
      fill: () => {},
      drawImage: (image, x, y, width, height) => { draws.push([image, x, y, width, height]) },
    },
    fills,
    arcs,
    draws,
    clears,
  }
}

const TAU = Math.PI * 2

describe('wedgeSlices', () => {
  it('keeps the trailing gap at least 30 degrees so the spin anchor reads at 16px', () => {
    expect(END_GAP).toBeGreaterThanOrEqual(Math.PI / 6)
  })

  it('returns no slices for all-zero counts', () => {
    expect(wedgeSlices({ running: 0, pending: 0, done: 0 }, 0, PALETTE)).toEqual([])
  })

  it('splits the ring proportionally in running/pending/done order', () => {
    const slices = wedgeSlices({ running: 1, pending: 0, done: 1 }, 0, PALETTE)
    expect(slices).toHaveLength(2)
    expect(slices[0]!.color).toBe(PALETTE.running)
    expect(slices[1]!.color).toBe(PALETTE.done)
    // Two equal states: each spans half the visible ring (TAU minus the gap).
    const span = (slice: WedgeSlice) => slice.end - slice.start
    expect(span(slices[0]!)).toBeCloseTo(span(slices[1]!), 6)
    expect(span(slices[0]!) + span(slices[1]!)).toBeCloseTo(TAU - END_GAP, 6)
  })

  it('leaves the fixed trailing gap visible even for a single state', () => {
    const [slice] = wedgeSlices({ running: 1, pending: 0, done: 0 }, 0, PALETTE)
    expect(slice!.end - slice!.start).toBeCloseTo(TAU - END_GAP, 6)
    // The gap rides the phase, so rotation moves it: the anchor for the spin.
    const [rotated] = wedgeSlices({ running: 1, pending: 0, done: 0 }, Math.PI / 2, PALETTE)
    expect(rotated!.end - rotated!.start).toBeCloseTo(TAU - END_GAP, 6)
    expect(rotated!.start).toBeCloseTo(slice!.start + Math.PI / 2, 6)
  })

  it('draws a complete ring when nothing runs: static states need no gap', () => {
    // Green-only (done) and amber-only (pending) rings are static: the gap
    // exists to show rotation, so they stay complete circles.
    const [done] = wedgeSlices({ running: 0, pending: 0, done: 1 }, 0, PALETTE)
    expect(done!.end - done!.start).toBeCloseTo(TAU, 6)
    const [pending] = wedgeSlices({ running: 0, pending: 1, done: 0 }, 0, PALETTE)
    expect(pending!.end - pending!.start).toBeCloseTo(TAU, 6)
  })

  it('keeps the gap whenever any session runs, even in a mixed ring', () => {
    const [mixed] = wedgeSlices({ running: 1, pending: 0, done: 1 }, 0, PALETTE)
    expect(mixed!.end - mixed!.start).toBeCloseTo((TAU - END_GAP) / 2, 6)
  })

  it('skips zero-count states and keeps the rest contiguous', () => {
    const slices = wedgeSlices({ running: 0, pending: 2, done: 0 }, 0, PALETTE)
    expect(slices).toHaveLength(1)
    expect(slices[0]!.color).toBe(PALETTE.pending)
  })

  it('rotates the first segment start by the animation phase', () => {
    const [plain] = wedgeSlices({ running: 1, pending: 0, done: 0 }, 0, PALETTE)
    const [rotated] = wedgeSlices({ running: 1, pending: 0, done: 0 }, Math.PI, PALETTE)
    expect(rotated!.start).toBeCloseTo(plain!.start + Math.PI, 6)
  })
})

describe('paintFavicon', () => {
  it('paints one annulus sector per slice with a transparent hole', () => {
    const { painter, fills, arcs, clears } = makePainter()
    const slices: WedgeSlice[] = [
      { start: 0, end: Math.PI, color: '#00f' },
      { start: Math.PI, end: TAU, color: '#0f0' },
    ]
    paintFavicon(painter, slices, 32)
    expect(clears.count).toBe(1)
    expect(fills).toEqual(['#00f', '#0f0'])
    expect(arcs).toHaveLength(4)
    // Per slice: outer forward arc then inner reverse arc (counterclockwise).
    expect(arcs[0]![0]).toBe(16) // center x
    expect(arcs[0]![2]).toBe(15) // outer radius = size/2 - 1
    expect(arcs[0]![5]).toBeUndefined() // outer arc: no counterclockwise flag
    expect(arcs[1]![2]).toBeCloseTo(32 * 0.36, 6) // inner radius ratio
    expect(arcs[1]![5]).toBe(true)
  })

  it('draws the center graphic inside the hole when one is supplied', () => {
    const { painter, draws, clears } = makePainter()
    const center = { kind: 'image' } as unknown as CanvasImageSource
    paintFavicon(painter, [{ start: 0, end: Math.PI, color: '#00f' }], 64, center)
    expect(clears.count).toBe(1)
    expect(draws).toHaveLength(1)
    expect(draws[0]![0]).toBe(center)
    // Centered square: edge = 64 * 0.58, offset = (64 - edge) / 2 on both axes.
    const edge = 64 * 0.58
    expect(draws[0]![1]).toBeCloseTo((64 - edge) / 2, 6)
    expect(draws[0]![2]).toBeCloseTo((64 - edge) / 2, 6)
    expect(draws[0]![3]).toBeCloseTo(edge, 6)
    expect(draws[0]![4]).toBeCloseTo(edge, 6)
  })

  it('leaves the hole empty when no center graphic is supplied', () => {
    const { painter, draws } = makePainter()
    paintFavicon(painter, [{ start: 0, end: Math.PI, color: '#00f' }], 64)
    expect(draws).toHaveLength(0)
  })
})

describe('createCanvasRenderer', () => {
  afterEach(() => { vi.restoreAllMocks() })

  function stubCanvas(): { toDataURL: ReturnType<typeof vi.fn>; canvases: HTMLCanvasElement[] } {
    const toDataURL = vi.fn(() => 'data:image/png;base64,ZmFrZQ==')
    const canvases: HTMLCanvasElement[] = []
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(function (this: HTMLCanvasElement) {
        canvases.push(this)
        return {
          clearRect: vi.fn(),
          fillStyle: '',
          beginPath: vi.fn(),
          arc: vi.fn(),
          closePath: vi.fn(),
          fill: vi.fn(),
        } as unknown as CanvasRenderingContext2D
      })
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(toDataURL)
    return { toDataURL, canvases }
  }

  it('renders a PNG data URL for non-empty counts', () => {
    const { toDataURL } = stubCanvas()
    const renderer = createCanvasRenderer(document, PALETTE)
    const url = renderer.render({ running: 1, pending: 0, done: 0 }, 1.5)
    expect(url).toBe('data:image/png;base64,ZmFrZQ==')
    expect(toDataURL).toHaveBeenCalledWith('image/png')
  })

  it('defaults to a 64px canvas so the ring and gap stay crisp at 16px', () => {
    const { canvases } = stubCanvas()
    const renderer = createCanvasRenderer(document, PALETTE)
    renderer.render({ running: 1, pending: 0, done: 0 }, 0)
    expect(canvases[0]?.width).toBe(64)
    expect(canvases[0]?.height).toBe(64)
  })

  it('returns null for all-zero counts without touching the canvas', () => {
    const { toDataURL } = stubCanvas()
    const renderer = createCanvasRenderer(document, PALETTE)
    expect(renderer.render({ running: 0, pending: 0, done: 0 }, 0)).toBeNull()
    expect(toDataURL).not.toHaveBeenCalled()
  })

  it('renders the center graphic set through setCenter', () => {
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({
        clearRect: vi.fn(),
        fillStyle: '',
        beginPath: vi.fn(),
        arc: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        drawImage,
      } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,ZmFrZQ==')
    const renderer = createCanvasRenderer(document, PALETTE)
    renderer.setCenter({} as CanvasImageSource)
    expect(renderer.render({ running: 1, pending: 0, done: 0 }, 0)).toBe('data:image/png;base64,ZmFrZQ==')
    // Centered square: edge = 64 * 0.58, offset = (64 - edge) / 2 on both axes.
    const edge = 64 * 0.58
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), (64 - edge) / 2, (64 - edge) / 2, edge, edge)
  })

  it('returns null when no 2D context is available', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const renderer = createCanvasRenderer(document, PALETTE)
    expect(renderer.render({ running: 1, pending: 0, done: 0 }, 0)).toBeNull()
  })
})
