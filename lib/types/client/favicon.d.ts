/**
 * Favicon painting: a donut ring segmented by state proportions, rotated by
 * the caller's animation phase so a running mix reads as a spinner. Canvas
 * access goes through the minimal {@link FaviconPainter} face so geometry and
 * painting stay unit-testable without a canvas implementation (jsdom has
 * none); the browser renderer adapts a real 2D context.
 */
import type { TabCounts } from './status.ts';
/** Per-state fill colors (any CSS color the canvas fill accepts). */
export interface FaviconPalette {
    /** Sessions executing. */
    running: string;
    /** Sessions waiting on the user. */
    pending: string;
    /** Sessions finished in the background. */
    done: string;
}
/** Minimal 2D-canvas face the painter needs (adapter over CanvasRenderingContext2D). */
export interface FaviconPainter {
    clearRect(x: number, y: number, width: number, height: number): void;
    setFillStyle(color: string): void;
    beginPath(): void;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
    closePath(): void;
    fill(): void;
    drawImage(image: CanvasImageSource, x: number, y: number, width: number, height: number): void;
}
/** One colored ring segment in radians (clockwise from 12 o'clock). */
export interface WedgeSlice {
    /** Segment start angle. */
    start: number;
    /** Segment end angle. */
    end: number;
    /** State fill color. */
    color: string;
}
/**
 * Fixed trailing gap in radians — at least 30° so the anchor reads clearly at
 * 16 px. The gap exists to show rotation: while any session runs the ring
 * spans TAU - END_GAP and the gap rides the rotation phase, so even a
 * single-color ring visibly spins; a static ring (nothing running) is
 * complete. 0.6 rad ≈ 34.4°.
 */
export declare const END_GAP = 0.6;
/**
 * Split the ring into state segments proportional to counts, rotated by the
 * animation phase (a running mix spins; a static mix stays put at 0). While
 * anything runs, the ring leaves the fixed {@link END_GAP} gap, which moves
 * with the phase and makes the rotation legible; with nothing running the
 * ring is complete — the gap exists to show rotation, and a static done or
 * pending ring needs no anchor.
 * @param counts - aggregate tab counts.
 * @param rotation - clockwise rotation of the first segment start, radians.
 * @param palette - per-state fill colors.
 * @returns the wedge list in running/pending/done order, empty for all-zero counts.
 */
export declare function wedgeSlices(counts: TabCounts, rotation: number, palette: FaviconPalette): WedgeSlice[];
/**
 * Paint one favicon frame: the segmented annulus described by the slices,
 * then the center graphic (the default favicon's whale) inside the hole when
 * one was loaded. Each slice is an outer arc, an inner reverse arc, and a
 * closing chord — the nonzero winding rule fills exactly the ring sector,
 * leaving the hole and the outside transparent.
 * @param painter - canvas face to paint on (already sized by the caller).
 * @param slices - ring segments to fill.
 * @param size - icon side length in px (geometry derives from it).
 * @param center - optional graphic drawn centered inside the ring hole.
 */
export declare function paintFavicon(painter: FaviconPainter, slices: readonly WedgeSlice[], size: number, center?: CanvasImageSource | null): void;
/** Paint-and-encode face: one frame to a favicon data URL. */
export interface FaviconRenderer {
    /**
     * Render one frame.
     * @param counts - aggregate tab counts.
     * @param rotation - animation phase, radians.
     * @returns a PNG data URL, or null when there is nothing to paint (all-zero counts or no canvas context).
     */
    render(counts: TabCounts, rotation: number): string | null;
    /**
     * Replace the center graphic drawn inside the ring hole (the default
     * favicon's whale). The caller loads the image and repaints after this.
     * @param image - loaded graphic, or null to leave the hole empty.
     */
    setCenter(image: CanvasImageSource | null): void;
}
/**
 * Browser renderer: one reusable offscreen canvas, painted and PNG-encoded
 * per frame.
 * @param doc - document owning the offscreen canvas.
 * @param palette - per-state fill colors.
 * @param size - icon side length in px (64 keeps the ring and its gap crisp
 * when the browser downscales to the 16 px tab bar).
 * @returns the renderer.
 */
export declare function createCanvasRenderer(doc: Document, palette: FaviconPalette, size?: number): FaviconRenderer;
/**
 * Adapt a real 2D context to the painter face.
 * @param ctx - a canvas 2D context.
 * @returns the painter face over it.
 */
export declare function createCanvasPainter(ctx: CanvasRenderingContext2D): FaviconPainter;
//# sourceMappingURL=favicon.d.ts.map