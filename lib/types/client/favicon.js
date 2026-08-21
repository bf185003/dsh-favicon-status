import { isEmptyTabCounts } from "./status.js";
const TAU = Math.PI * 2;
/**
 * Fixed trailing gap in radians — at least 30° so the anchor reads clearly at
 * 16 px. The gap exists to show rotation: while any session runs the ring
 * spans TAU - END_GAP and the gap rides the rotation phase, so even a
 * single-color ring visibly spins; a static ring (nothing running) is
 * complete. 0.6 rad ≈ 34.4°.
 */
export const END_GAP = 0.6;
/** Ring hole radius as a fraction of the icon size. */
const INNER_RADIUS_RATIO = 0.36;
/** Outer radius inset in px, so the ring never touches the icon edge. */
const OUTER_INSET = 1;
/** Center-graphic edge as a fraction of the icon size, kept inside the hole. */
const CENTER_EDGE_RATIO = 0.58;
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
export function wedgeSlices(counts, rotation, palette) {
    const total = counts.running + counts.pending + counts.done;
    if (total === 0)
        return [];
    const gap = counts.running > 0 ? END_GAP : 0;
    const slices = [];
    let cursor = -Math.PI / 2 + rotation;
    const push = (count, color) => {
        if (count <= 0)
            return;
        const span = ((count / total) * (TAU - gap));
        slices.push({ start: cursor, end: cursor + span, color });
        cursor += span;
    };
    push(counts.running, palette.running);
    push(counts.pending, palette.pending);
    push(counts.done, palette.done);
    return slices;
}
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
export function paintFavicon(painter, slices, size, center = null) {
    const centerPoint = size / 2;
    const outerRadius = size / 2 - OUTER_INSET;
    const innerRadius = size * INNER_RADIUS_RATIO;
    painter.clearRect(0, 0, size, size);
    for (const slice of slices) {
        painter.setFillStyle(slice.color);
        painter.beginPath();
        painter.arc(centerPoint, centerPoint, outerRadius, slice.start, slice.end);
        painter.arc(centerPoint, centerPoint, innerRadius, slice.end, slice.start, true);
        painter.closePath();
        painter.fill();
    }
    if (center !== null) {
        const edge = size * CENTER_EDGE_RATIO;
        const offset = (size - edge) / 2;
        painter.drawImage(center, offset, offset, edge, edge);
    }
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
export function createCanvasRenderer(doc, palette, size = 64) {
    const canvas = doc.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    let center = null;
    return {
        render(counts, rotation) {
            if (isEmptyTabCounts(counts))
                return null;
            const ctx = canvas.getContext('2d');
            if (ctx === null)
                return null;
            paintFavicon(createCanvasPainter(ctx), wedgeSlices(counts, rotation, palette), size, center);
            return canvas.toDataURL('image/png');
        },
        setCenter(image) {
            center = image;
        },
    };
}
/**
 * Adapt a real 2D context to the painter face.
 * @param ctx - a canvas 2D context.
 * @returns the painter face over it.
 */
export function createCanvasPainter(ctx) {
    return {
        clearRect: (x, y, width, height) => { ctx.clearRect(x, y, width, height); },
        setFillStyle: (color) => { ctx.fillStyle = color; },
        beginPath: () => { ctx.beginPath(); },
        arc: (x, y, radius, startAngle, endAngle, counterclockwise) => {
            ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
        },
        closePath: () => { ctx.closePath(); },
        fill: () => { ctx.fill(); },
        drawImage: (image, x, y, width, height) => { ctx.drawImage(image, x, y, width, height); },
    };
}
//# sourceMappingURL=favicon.js.map