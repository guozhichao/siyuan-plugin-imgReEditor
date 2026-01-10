import {
    Line,
    TOptions,
    FabricObjectProps,
    classRegistry,
    Control,
    controlsUtils,
    util,
    Point,
    FabricObject,
    TPointerEvent,
    Transform,
} from 'fabric';
import edgeImg from '../assets/edgecontrol.svg';
const edgeImgIcon = document.createElement('img');
edgeImgIcon.src = edgeImg;
const deleteIcon =
    "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E";
const delImgIcon = document.createElement('img');
delImgIcon.src = deleteIcon;
function createIconRenderer(icon: HTMLImageElement, width: number, height: number) {
    return (
        ctx: CanvasRenderingContext2D,
        left: number,
        top: number,
        _styleOverride: any,
        fabricObject: FabricObject
    ) => {
        ctx.save();
        ctx.translate(left, top);
        ctx.rotate(util.degreesToRadians(fabricObject.angle));
        ctx.drawImage(icon, -width / 2, -height / 2, width, height);
        ctx.restore();
    };
}
// Custom action handler for Line endpoints (Fabric 6)
const lineActionHandler = (
    eventData: TPointerEvent,
    transform: Transform,
    x: number,
    y: number
) => {
    const { target, corner } = transform;
    const line = target as any;
    const canvas = line.canvas;
    if (!canvas) return false;
    // x, y are already in canvas coordinates - use them directly
    const currentMouseCanvas = new Point(x, y);
    // Get current canvas positions of both endpoints
    const matrix = line.calcTransformMatrix();
    const centerX = (line.x1 + line.x2) / 2;
    const centerY = (line.y1 + line.y2) / 2;
    let p1Local = new Point(line.x1 - centerX, line.y1 - centerY);
    let p2Local = new Point(line.x2 - centerX, line.y2 - centerY);
    let p1Canvas = util.transformPoint(p1Local, matrix);
    let p2Canvas = util.transformPoint(p2Local, matrix);
    // Update the canvas position of the dragged endpoint to mouse position
    if (corner === 'p1') {
        p1Canvas = currentMouseCanvas;
    } else {
        p2Canvas = currentMouseCanvas;
    }
    // Recalculate line properties from the two canvas endpoints
    // Set new x1, y1, x2, y2 as if creating a new line (absolute canvas coords temporarily)
    line.set({
        x1: p1Canvas.x,
        y1: p1Canvas.y,
        x2: p2Canvas.x,
        y2: p2Canvas.y,
        left: undefined,
        top: undefined,
    });
    // Recalculate width, height and position
    if (typeof line._setWidthHeight === 'function') {
        line._setWidthHeight();
    }
    // Now make x1,y1,x2,y2 relative to the new left/top
    line.x1 -= line.left;
    line.y1 -= line.top;
    line.x2 -= line.left;
    line.y2 -= line.top;
    line.setCoords();
    line.set('dirty', true);
    return true;
};
// --- MODIFIED POSITION HANDLERS ---
// Custom position handlers to map controls to x1,y1 and x2,y2
function p1PositionHandler(_dim: any, finalMatrix: any, fabricObject: any) {
    const line = fabricObject as any;
    const canvas = line.canvas;
    // 计算端点相对于对象中心的局部坐标
    const centerX = (line.x1 + line.x2) / 2;
    const centerY = (line.y1 + line.y2) / 2;
    const localPoint = new Point(line.x1 - centerX, line.y1 - centerY);
    // 转换到画布坐标
    const canvasPoint = util.transformPoint(localPoint, line.calcTransformMatrix());
    // 应用 viewport transform 转换到屏幕坐标
    if (canvas && canvas.viewportTransform) {
        return util.transformPoint(canvasPoint, canvas.viewportTransform);
    }
    return canvasPoint;
}
function p2PositionHandler(_dim: any, finalMatrix: any, fabricObject: any) {
    const line = fabricObject as any;
    const canvas = line.canvas;
    // 计算端点相对于对象中心的局部坐标
    const centerX = (line.x1 + line.x2) / 2;
    const centerY = (line.y1 + line.y2) / 2;
    const localPoint = new Point(line.x2 - centerX, line.y2 - centerY);
    // 转换到画布坐标
    const canvasPoint = util.transformPoint(localPoint, line.calcTransformMatrix());
    // 应用 viewport transform 转换到屏幕坐标
    if (canvas && canvas.viewportTransform) {
        return util.transformPoint(canvasPoint, canvas.viewportTransform);
    }
    return canvasPoint;
}
// Delete control position handler - positioned above the second endpoint
function deletePositionHandler(_dim: any, finalMatrix: any, fabricObject: any) {
    const line = fabricObject as any;
    const canvas = line.canvas;
    // 计算端点相对于对象中心的局部坐标
    const centerX = (line.x1 + line.x2) / 2;
    const centerY = (line.y1 + line.y2) / 2;
    const localPoint = new Point(line.x2 - centerX, line.y2 - centerY);
    // 转换到画布坐标
    const canvasPoint = util.transformPoint(localPoint, line.calcTransformMatrix());
    // 在画布坐标系中保持固定偏移
    canvasPoint.y -= 30;
    // 应用 viewport transform 转换到屏幕坐标
    if (canvas && canvas.viewportTransform) {
        return util.transformPoint(canvasPoint, canvas.viewportTransform);
    }
    return canvasPoint;
}
// Center control point position handler for curve control
function centerControlPositionHandler(_dim: any, finalMatrix: any, fabricObject: any) {
    const arrow = fabricObject as any;
    const canvas = arrow.canvas;
    // 计算曲线控制点在 t=0.5 处的位置（在对象局部坐标系中）
    const t = 0.5;
    // 对于二次贝塞尔曲线，中点的控制点影响为：2*t*(1-t)*controlOffset
    const localX = arrow.controlOffsetX * 2 * t * (1 - t);
    const localY = arrow.controlOffsetY * 2 * t * (1 - t);
    const localPoint = new Point(localX, localY);
    // 转换到画布坐标
    const canvasPoint = util.transformPoint(localPoint, arrow.calcTransformMatrix());
    // 应用 viewport transform 转换到屏幕坐标
    if (canvas && canvas.viewportTransform) {
        return util.transformPoint(canvasPoint, canvas.viewportTransform);
    }
    return canvasPoint;
}
// --- END OF MODIFIED HANDLERS ---
// Action handler for center control point
const centerControlActionHandler = (
    eventData: TPointerEvent,
    transform: Transform,
    x: number,
    y: number
) => {
    const { target } = transform;
    const arrow = target as any;
    const canvas = arrow.canvas;
    if (!canvas) return false;
    // x, y are already in canvas coordinates - use them directly
    const currentMouseCanvas = new Point(x, y);
    // Convert mouse position to local coordinates
    const matrix = arrow.calcTransformMatrix();
    const invertedMatrix = util.invertTransform(matrix);
    const newLocal = util.transformPoint(currentMouseCanvas, invertedMatrix);
    // Update control offsets
    arrow.controlOffsetX = newLocal.x * 2;
    arrow.controlOffsetY = newLocal.y * 2;
    arrow.setCoords();
    arrow.set('dirty', true);
    return true;
};
export type ArrowHeadType = 'none' | 'left' | 'right' | 'both';
export type ArrowHeadStyle = 'sharp' | 'swallowtail' | 'sharp-hollow' | 'swallowtail-hollow';
export type ArrowLineStyle = 'solid' | 'dashed' | 'dotted' | 'dash-dot';
export type ArrowThicknessStyle = 'uniform' | 'varying';
interface ArrowOptions extends TOptions<FabricObjectProps> {
    arrowHead?: ArrowHeadType;
    headStyle?: ArrowHeadStyle;
    lineStyle?: ArrowLineStyle;
    thicknessStyle?: ArrowThicknessStyle;
    useCustomSelection?: boolean;
    controlOffsetX?: number;
    controlOffsetY?: number;
}
/**
 * Custom Arrow class that extends Line
 * Draws arrow heads that don't deform when the arrow is scaled
 */
export class Arrow extends Line {
    static type = 'arrow';
    arrowHead: ArrowHeadType;
    headStyle: ArrowHeadStyle;
    lineStyle: ArrowLineStyle;
    thicknessStyle: ArrowThicknessStyle;
    useCustomSelection: boolean;
    controlOffsetX: number;
    controlOffsetY: number;
    constructor(points: [number, number, number, number], options?: ArrowOptions) {
        super(points, options);
        this.arrowHead = options?.arrowHead || 'right';
        this.headStyle = options?.headStyle || 'sharp';
        this.lineStyle = options?.lineStyle || 'solid';
        this.thicknessStyle = options?.thicknessStyle || 'uniform';
        this.useCustomSelection = true;
        this.strokeLineCap = 'butt'; // Flat ends as requested
        this.strokeLineJoin = 'round';
        this.objectCaching = false;
        this.hasBorders = !this.useCustomSelection;
        // Initialize control point offset at 0 (on the line, straight arrow by default)
        this.controlOffsetX = options?.controlOffsetX ?? 0;
        this.controlOffsetY = options?.controlOffsetY ?? 0;
        if (this.useCustomSelection) {
            // Define custom controls for arrow endpoints
            this.controls = {
                p1: new Control({
                    actionHandler: lineActionHandler,
                    cursorStyleHandler: controlsUtils.scaleCursorStyleHandler,
                    actionName: 'modifyLine',
                    render: createIconRenderer(edgeImgIcon, 25, 25),
                    positionHandler: p1PositionHandler,
                }),
                p2: new Control({
                    actionHandler: lineActionHandler,
                    cursorStyleHandler: controlsUtils.scaleCursorStyleHandler,
                    actionName: 'modifyLine',
                    render: createIconRenderer(edgeImgIcon, 25, 25),
                    positionHandler: p2PositionHandler,
                }),
                centerControl: new Control({
                    actionHandler: centerControlActionHandler,
                    cursorStyleHandler: controlsUtils.scaleCursorStyleHandler,
                    actionName: 'modifyCurve',
                    mouseDownHandler: (eventData: TPointerEvent, transform: Transform) => {
                        // Check for double click to reset curve to straight line
                        const arrow = transform.target as any;
                        const now = Date.now();
                        const lastClick = arrow._lastCenterControlClick || 0;
                        const timeDiff = now - lastClick;
                        
                        if (timeDiff < 300) {
                            // Double click detected - reset to straight line
                            arrow.controlOffsetX = 0;
                            arrow.controlOffsetY = 0;
                            arrow.setCoords();
                            arrow.set('dirty', true);
                            if (arrow.canvas) {
                                arrow.canvas.requestRenderAll();
                            }
                            arrow._lastCenterControlClick = 0; // Reset
                            return true;
                        }
                        
                        arrow._lastCenterControlClick = now;
                        return false;
                    },
                    render: (ctx: CanvasRenderingContext2D, left: number, top: number) => {
                        const size = 12;
                        ctx.save();
                        ctx.translate(left, top);
                        ctx.beginPath();
                        ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
                        ctx.fillStyle = '#4285f4';
                        ctx.fill();
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.restore();
                    },
                    positionHandler: centerControlPositionHandler,
                }),
                deleteControl: new Control({
                    x: 0,
                    y: 0,
                    offsetY: 0,
                    offsetX: 0,
                    cursorStyle: 'pointer',
                    mouseUpHandler: (_eventData, transform: any) => {
                        const target = transform.target;
                        const canvas = target.canvas;
                        if (canvas) {
                            canvas.remove(target);
                            canvas.requestRenderAll();
                        }
                        return true;
                    },
                    render: createIconRenderer(delImgIcon, 24, 24),
                    positionHandler: deletePositionHandler,
                    sizeX: 24,
                    sizeY: 24,
                }),
            };
        }
    }
    /**
     * Helper to get dash array based on line style
     */
    private getDashArray(visualStrokeWidth: number): number[] {
        switch (this.lineStyle) {
            case 'dashed':
                return [visualStrokeWidth * 3, visualStrokeWidth * 3];
            case 'dotted':
                return [visualStrokeWidth, visualStrokeWidth * 2];
            case 'dash-dot':
                return [
                    visualStrokeWidth * 4,
                    visualStrokeWidth * 2,
                    visualStrokeWidth,
                    visualStrokeWidth * 2,
                ];
            default:
                return [];
        }
    }
    /**
     * Calculate the visual stroke width taking scale into account.
     */
    getVisualStrokeWidth(): number {
        const localXDiff = this.x2 - this.x1;
        const localYDiff = this.y2 - this.y1;
        const localAngle = Math.atan2(localYDiff, localXDiff);
        const perpScale = Math.sqrt(
            Math.pow(this.scaleX * Math.sin(localAngle), 2) +
            Math.pow(this.scaleY * Math.cos(localAngle), 2)
        );
        return this.strokeWidth * (this.strokeUniform ? 1 : perpScale);
    }
    /**
     * Override _render to draw both the line and arrow heads with scale compensation
     * This prevents the line ends and heads from deforming during non-uniform scaling.
     */
    _render(ctx: CanvasRenderingContext2D) {
        if (!this.stroke) return;
        ctx.save();
        // Compensate for scaling to prevent deformation of all components
        // We move to a coordinate system where 1 unit = 1 physical pixel
        ctx.scale(1 / this.scaleX, 1 / this.scaleY);
        // Visual stroke width on screen
        const visualStrokeWidth = this.getVisualStrokeWidth();
        // Calculate visual properties for rendering
        const localXDiff = this.x2 - this.x1;
        const localYDiff = this.y2 - this.y1;
        const xDiff = localXDiff * this.scaleX;
        const yDiff = localYDiff * this.scaleY;
        const visualAngle = Math.atan2(yDiff, xDiff);
        const visualLength = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
        // Arrow head size based on visual stroke width
        const headLength = Math.max(10, visualStrokeWidth * 2.5);
        const headWidth = Math.max(6, visualStrokeWidth * 1.5);
        ctx.rotate(visualAngle);
        // Set common styles
        ctx.strokeStyle = this.stroke as string;
        ctx.fillStyle = this.stroke as string;
        ctx.lineWidth = visualStrokeWidth;
        ctx.lineCap = this.strokeLineCap;
        ctx.lineJoin = this.strokeLineJoin;
        // 1. Check for Hollow Integrated Contour Mode
        const isHollowContour = this.headStyle.endsWith('-hollow');
        if (isHollowContour && (this.arrowHead === 'right' || this.arrowHead === 'left')) {
            // Draw the entire arrow as a single closed path (Contour)
            const style = this.headStyle.replace('-hollow', '');
            // Increased multipliers for a much larger hollow area
            const hL = Math.max(10, visualStrokeWidth * 7.5);
            const hW = Math.max(6, visualStrokeWidth * 3.5);
            // For sharp triangle, the neck point is at the same X as the wings (flat back)
            // For swallowtail, the neck is indented towards the tip
            const indent = style === 'swallowtail' ? hL * 0.75 : hL;
            const bWNeck = visualStrokeWidth * 2.0;
            const bWStart = this.thicknessStyle === 'varying' ? visualStrokeWidth * 0.2 : bWNeck;
            // Use a thinner stroke for the outline in hollow mode to match user expectation
            ctx.lineWidth = Math.max(1, visualStrokeWidth * 0.4);
            ctx.lineJoin = 'miter';
            ctx.miterLimit = 10;
            ctx.beginPath();
            const dir = this.arrowHead === 'right' ? 1 : -1;
            const L = visualLength;
            // Calculate key points
            const tipX = (L / 2) * dir;
            const startX = (-L / 2) * dir;
            const neckX = tipX - indent * dir;
            const wingX = tipX - hL * dir;
            ctx.moveTo(tipX, 0);
            ctx.lineTo(wingX, hW);
            ctx.lineTo(neckX, bWNeck / 2);
            ctx.lineTo(startX, bWStart / 2);
            ctx.lineTo(startX, -bWStart / 2);
            ctx.lineTo(neckX, -bWNeck / 2);
            ctx.lineTo(wingX, -hW);
            ctx.closePath();
            const dashes = this.getDashArray(visualStrokeWidth);
            if (dashes.length > 0) ctx.setLineDash(dashes);
            ctx.stroke();
            if (dashes.length > 0) ctx.setLineDash([]);
            ctx.restore();
            return;
        }
        // 2. Default Rendering Mode (Solid or traditional hollow heads)
        const isVarying =
            this.thicknessStyle === 'varying' &&
            (this.arrowHead === 'left' || this.arrowHead === 'right');
        // Calculate control point in the rotated coordinate system
        // controlOffsetX/Y are already relative to center (0,0)
        const controlXLocal = this.controlOffsetX;
        const controlYLocal = this.controlOffsetY;
        // Transform control point to match the rotated canvas
        const cosA = Math.cos(-visualAngle);
        const sinA = Math.sin(-visualAngle);
        const rotatedControlX = controlXLocal * this.scaleX * cosA - controlYLocal * this.scaleY * sinA;
        const rotatedControlY = controlXLocal * this.scaleX * sinA + controlYLocal * this.scaleY * cosA;
        // Check if the arrow is curved (control point is not on the line)
        const isCurved = Math.abs(rotatedControlY) > 0.1;
        if (isVarying) {
            // Draw tapered line as a filled polygon
            const startWidth = this.arrowHead === 'right' ? visualStrokeWidth * 0.2 : visualStrokeWidth;
            const endWidth = this.arrowHead === 'right' ? visualStrokeWidth : visualStrokeWidth * 0.2;
            ctx.beginPath();
            if (isCurved) {
                // For curved varying thickness, approximate with line segments
                const steps = 20;
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const x = -visualLength / 2 * (1 - t) * (1 - t) + rotatedControlX * 2 * (1 - t) * t + visualLength / 2 * t * t;
                    const width = startWidth * (1 - t) + endWidth * t;
                    if (i === 0) {
                        ctx.moveTo(x, -width / 2);
                    } else {
                        ctx.lineTo(x, -width / 2);
                    }
                }
                for (let i = steps; i >= 0; i--) {
                    const t = i / steps;
                    const x = -visualLength / 2 * (1 - t) * (1 - t) + rotatedControlX * 2 * (1 - t) * t + visualLength / 2 * t * t;
                    const width = startWidth * (1 - t) + endWidth * t;
                    ctx.lineTo(x, width / 2);
                }
            } else {
                ctx.moveTo(-visualLength / 2, -startWidth / 2);
                ctx.lineTo(visualLength / 2, -endWidth / 2);
                ctx.lineTo(visualLength / 2, endWidth / 2);
                ctx.lineTo(-visualLength / 2, startWidth / 2);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            const dashes = this.getDashArray(visualStrokeWidth);
            const hasDashes = dashes.length > 0;
            if (hasDashes) {
                ctx.setLineDash(dashes);
            }
            ctx.beginPath();
            ctx.moveTo(-visualLength / 2, 0);
            if (isCurved) {
                // Draw quadratic bezier curve
                ctx.quadraticCurveTo(rotatedControlX, rotatedControlY, visualLength / 2, 0);
            } else {
                // Draw straight line
                ctx.lineTo(visualLength / 2, 0);
            }
            ctx.stroke();
            // Disable dashes for arrow heads
            if (hasDashes) {
                ctx.setLineDash([]);
            }
        }
        // 3. Helper to draw an arrow head
        const drawArrowHead = (x: number, direction: number) => {
            if (this.arrowHead === 'none') return; // Only draw if arrow heads are enabled
            ctx.save();
            ctx.translate(x, 0);
            // Calculate tangent angle at the endpoint for curved arrows
            if (isCurved) {
                let tangentAngle = 0;
                if (direction === 1) {
                    // Right endpoint (p2) - tangent at t=1
                    const dx = visualLength / 2 - rotatedControlX;
                    const dy = -rotatedControlY;
                    tangentAngle = Math.atan2(dy, dx);
                } else {
                    // Left endpoint (p1) - tangent at t=0
                    const dx = rotatedControlX - (-visualLength / 2);
                    const dy = rotatedControlY;
                    tangentAngle = Math.atan2(dy, dx);
                }
                ctx.rotate(tangentAngle);
            }
            const isHollow = this.headStyle.endsWith('-hollow');
            const style = isHollow ? this.headStyle.replace('-hollow', '') : this.headStyle;
            // Make heads larger for traditional hollow to ensure visibility
            const currentHeadLength = isHollow ? headLength * 1.5 : headLength;
            const currentHeadWidth = isHollow ? headWidth * 1.5 : headWidth;
            ctx.beginPath();
            if (style === 'swallowtail') {
                // Swallowtail: indented back
                ctx.moveTo(0, 0);
                ctx.lineTo(-currentHeadLength * direction, currentHeadWidth);
                ctx.lineTo(-currentHeadLength * 0.6 * direction, 0);
                ctx.lineTo(-currentHeadLength * direction, -currentHeadWidth);
            } else {
                // Sharp (default triangle)
                ctx.moveTo(0, 0);
                ctx.lineTo(-currentHeadLength * direction, currentHeadWidth);
                ctx.lineTo(-currentHeadLength * direction, -currentHeadWidth);
            }
            ctx.closePath();
            if (isHollow) {
                // Hollow: only stroke and clear background
                ctx.save();
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fill();
                ctx.restore();
                ctx.stroke();
            } else {
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();
        };
        // 4. Draw arrow heads based on direction
        if (this.arrowHead === 'right' || this.arrowHead === 'both') {
            drawArrowHead(visualLength / 2, 1);
        }
        if (this.arrowHead === 'left' || this.arrowHead === 'both') {
            drawArrowHead(-visualLength / 2, -1);
        }
        ctx.restore();
    }
    /**
     * Override containsPoint to support curve hit detection
     * This allows clicking on the curved line to select the arrow
     */
    containsPoint(point: Point): boolean {
        // Check if the arrow is curved
        const isCurved = Math.abs(this.controlOffsetX) > 0.1 || Math.abs(this.controlOffsetY) > 0.1;
        
        if (!isCurved) {
            // For straight arrows, use default line hit detection
            return super.containsPoint(point);
        }
        
        // For curved arrows, check distance to bezier curve
        const visualStrokeWidth = this.getVisualStrokeWidth();
        const threshold = Math.max(visualStrokeWidth / 2 + 5, 10); // Hit area threshold
        
        // Transform point to local coordinates
        const localPoint = util.transformPoint(
            point,
            util.invertTransform(this.calcTransformMatrix())
        );
        
        // Scale local point to match the scaled coordinate system
        const scaledLocalX = localPoint.x * this.scaleX;
        const scaledLocalY = localPoint.y * this.scaleY;
        
        // Calculate curve parameters
        const localXDiff = this.x2 - this.x1;
        const localYDiff = this.y2 - this.y1;
        const localAngle = Math.atan2(localYDiff, localXDiff);
        const visualLength = Math.sqrt(
            Math.pow(localXDiff * this.scaleX, 2) + 
            Math.pow(localYDiff * this.scaleY, 2)
        );
        
        // Transform control point to rotated coordinate system
        const cosA = Math.cos(-localAngle);
        const sinA = Math.sin(-localAngle);
        const rotatedControlX = this.controlOffsetX * this.scaleX * cosA - 
                                this.controlOffsetY * this.scaleY * sinA;
        const rotatedControlY = this.controlOffsetX * this.scaleX * sinA + 
                                this.controlOffsetY * this.scaleY * sinA;
        
        // Rotate the test point to align with the curve's coordinate system
        const rotatedX = scaledLocalX * cosA - scaledLocalY * sinA;
        const rotatedY = scaledLocalX * sinA + scaledLocalY * cosA;
        
        // Sample points along the quadratic bezier curve
        const samples = 20;
        let minDistance = Infinity;
        
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            // Quadratic bezier formula: P(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
            const curveX = Math.pow(1 - t, 2) * (-visualLength / 2) +
                          2 * (1 - t) * t * rotatedControlX +
                          Math.pow(t, 2) * (visualLength / 2);
            const curveY = 2 * (1 - t) * t * rotatedControlY;
            
            const dx = rotatedX - curveX;
            const dy = rotatedY - curveY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
            }
        }
        
        return minDistance <= threshold;
    }
    
    /**
     * Override toObject to include custom properties
     */
    toObject(propertiesToInclude: any[] = []): any {
        return super.toObject(['arrowHead', 'headStyle', 'lineStyle', 'thicknessStyle', 'useCustomSelection', 'controlOffsetX', 'controlOffsetY', ...propertiesToInclude] as any);
    }
}
classRegistry.setClass(Arrow);
export default Arrow;