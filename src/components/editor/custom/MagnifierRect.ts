import { Rect, classRegistry, Canvas, util } from 'fabric';

/**
 * MagnifierRect - A custom rectangle that shows a magnified view of the area it covers
 */
export class MagnifierRect extends Rect {
    magnification: number = 2;
    sourceId: string | null = null;
    id: string | null = null;
    magnifierShape: 'rect' | 'circle' = 'rect';
    static type = 'magnifier-rect';
    constructor(options?: any) {
        if (options) {
            const { type, ...otherOptions } = options;
            super(otherOptions);
        } else {
            super(options);
        }
        this.magnifierShape = options?.magnifierShape || 'rect';
        this.magnification = options?.magnification || 2;
        this.sourceId = options?.sourceId || null;
        this.id = options?.id || null;
        this.fill = 'transparent';
        this.stroke = options?.stroke || '#000000';
        this.strokeWidth = options?.strokeWidth || 2;
        this.strokeDashArray = null;
        this.objectCaching = false;
        this.strokeUniform = true;

        this.setControlsVisibility({
            mt: false,
            mb: false,
            ml: false,
            mr: false,
            mtr: false,
        });
    }

    _render(ctx: CanvasRenderingContext2D): void {
        const fabricCanvas = this.canvas as Canvas;
        if (!fabricCanvas) return;

        // Auto-correct physical dimensions to match content ratio before rendering
        if (this.sourceId) {
            const sourceObj = fabricCanvas.getObjects().find((o: any) => (o as any).id === this.sourceId);
            if (sourceObj) {
                const sW = sourceObj.getScaledWidth();
                const sH = sourceObj.getScaledHeight();
                const mag = this.magnification || 2;

                const targetW = sW * mag;
                const targetH = sH * mag;

                // If dimensions differ significantly, update them
                // This ensures the selection box (bounding box) follows the content
                if (Math.abs(this.width - targetW) > 0.1 || Math.abs(this.height - targetH) > 0.1) {
                    this.set({
                        width: targetW,
                        height: targetH,
                        scaleX: 1,
                        scaleY: 1
                    });
                    this.setCoords();
                }
            }
        }

        const w = this.width || 0;
        const h = this.height || 0;

        this._drawMagnifiedEffect(ctx, w, h, fabricCanvas);
        this._drawBorder(ctx, w, h);
    }

    private _drawBorder(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        if (this.stroke && this.strokeWidth) {
            ctx.save();
            ctx.strokeStyle = this.stroke as string;
            ctx.lineWidth = this.strokeWidth;
            if (this.strokeDashArray && this.strokeDashArray.length > 0) {
                ctx.setLineDash(this.strokeDashArray);
            }
            if (this.magnifierShape === 'circle') {
                ctx.beginPath();
                ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, 2 * Math.PI);
                ctx.stroke();
            } else {
                ctx.strokeRect(-w / 2, -h / 2, w, h);
            }
            ctx.restore();
        }
    }

    private _drawPlaceholder(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
        if (this.magnifierShape === 'circle') {
            ctx.beginPath();
            ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            ctx.fillRect(-width / 2, -height / 2, width, height);
        }
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No Image', 0, 0);
    }

    private _drawMagnifiedEffect(ctx: CanvasRenderingContext2D, width: number, height: number, fabricCanvas: Canvas): void {
        const magnification = Math.max(1, this.magnification);

        // 1. Calculate Source Center (center of the area we want to view)
        let sourceCenter = { x: 0, y: 0 };
        let foundSource = false;
        let sourceObj: any = null;

        if (this.sourceId) {
            const objects = fabricCanvas.getObjects();
            sourceObj = objects.find((o: any) => o.id === this.sourceId);

            if (sourceObj) {
                const m = sourceObj.calcTransformMatrix();
                sourceCenter = util.transformPoint({ x: 0, y: 0 } as any, m);
                foundSource = true;
            }
        }

        if (!foundSource) {
            const matrix = this.calcTransformMatrix();
            sourceCenter = util.transformPoint({ x: 0, y: 0 } as any, matrix);
        }

        // 2. Setup High-Res Temp Canvas
        // Use retina scaling to ensure crisp rendering on high DPI screens
        const pixelRatio = (fabricCanvas as any).getRetinaScaling ? (fabricCanvas as any).getRetinaScaling() : 1;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width * pixelRatio;
        tempCanvas.height = height * pixelRatio;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
            this._drawPlaceholder(ctx, width, height);
            return;
        }

        // 3. Render Scene to Temp Canvas with Transform
        tempCtx.save();

        // Apply coordinate system transformations:
        // 1. Scale for pixel ratio (physical pixels)
        tempCtx.scale(pixelRatio, pixelRatio);
        // 2. Center the "camera" in the temp canvas
        tempCtx.translate(width / 2, height / 2);
        // 3. Apply magnification zoom
        tempCtx.scale(magnification, magnification);
        // 4. Move "world" so that sourceCenter is at (0,0)
        tempCtx.translate(-sourceCenter.x, -sourceCenter.y);

        // Render Background Image
        const bgImage = fabricCanvas.backgroundImage as any;
        if (bgImage && bgImage.render) {
            bgImage.render(tempCtx);
        }

        // Render Objects
        const objects = fabricCanvas.getObjects();
        objects.forEach((obj: any) => {
            // Exclude self and magnifier parts
            if (obj === this) return;
            if (obj.type === 'magnifier-rect' ||
                obj.type === 'magnifier-source-rect' ||
                obj.type === 'magnifier-connection-line' ||
                obj.type === 'crop-rect' ||
                (obj as any)._isCropRect) {
                return;
            }
            if (!obj.visible) return;

            // Render object to tempCtx
            // Object's own coordinates/transform will combine with our context transform
            obj.render(tempCtx);
        });

        tempCtx.restore();

        // 4. Draw temp canvas to main context
        ctx.save();
        ctx.beginPath();
        if (this.magnifierShape === 'circle') {
            ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, 2 * Math.PI);
        } else {
            ctx.rect(-width / 2, -height / 2, width, height);
        }
        ctx.clip();

        // Draw the temp canvas
        // tempCanvas represents the full view port (width x height) in logic pixels
        // but has physical size (width*ratio x height*ratio)
        // drawImage will stick it into the rect [-w/2, -h/2, w, h]
        ctx.drawImage(
            tempCanvas,
            -width / 2, -height / 2, width, height
        );

        ctx.restore();
    }

    /**
     * Override toObject to include custom properties
     */
    toObject(propertiesToInclude?: any): any {
        return super.toObject(['magnification', 'sourceId', 'id', 'magnifierShape', ...(propertiesToInclude || [])] as any);
    }

    /**
    * Static method for creating from object (for deserialization)
    */
    static fromObject(object: any): Promise<MagnifierRect> {
        return Promise.resolve(new MagnifierRect(object));
    }
}

classRegistry.setClass(MagnifierRect, 'magnifier-rect');
export default MagnifierRect;
