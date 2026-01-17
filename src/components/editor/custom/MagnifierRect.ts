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
        super(options);
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

        if (!fabricCanvas.backgroundImage) {
            this._drawPlaceholder(ctx, w, h);
            this._drawBorder(ctx, w, h);
            return;
        }

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
        const bgImage = fabricCanvas.backgroundImage as any;
        if (!bgImage) return;

        const magnification = Math.max(1, this.magnification);
        const bgElement = bgImage.getElement();
        if (!bgElement) {
            this._drawPlaceholder(ctx, width, height);
            return;
        }

        const boundingRect = bgImage.getBoundingRect();
        const tempWidth = Math.ceil(boundingRect.width);
        const tempHeight = Math.ceil(boundingRect.height);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = tempWidth;
        tempCanvas.height = tempHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
            this._drawPlaceholder(ctx, width, height);
            return;
        }

        // Render background to temp canvas
        tempCtx.save();
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.translate(-boundingRect.left, -boundingRect.top);

        tempCtx.translate(bgImage.left || 0, bgImage.top || 0);
        tempCtx.rotate((bgImage.angle || 0) * Math.PI / 180);
        tempCtx.scale(bgImage.scaleX || 1, bgImage.scaleY || 1);
        if (bgImage.flipX) {
            tempCtx.scale(-1, 1);
            tempCtx.translate(-bgImage.width, 0);
        }
        if (bgImage.flipY) {
            tempCtx.scale(1, -1);
            tempCtx.translate(0, -bgImage.height);
        }
        if (bgImage.originX === 'center') tempCtx.translate(-bgImage.width / 2, 0);
        if (bgImage.originY === 'center') tempCtx.translate(0, -bgImage.height / 2);

        tempCtx.drawImage(bgElement, 0, 0);
        tempCtx.restore();

        // Determine Source Area
        let sourceCenter = { x: 0, y: 0 };
        // Default to self if no sourceId found
        let foundSource = false;

        let sourceObj: any = null;

        if (this.sourceId) {
            // Find the source object
            const objects = fabricCanvas.getObjects();
            sourceObj = objects.find((o: any) => o.id === this.sourceId);

            if (sourceObj) {
                // Calculate center of source object
                const m = sourceObj.calcTransformMatrix();
                sourceCenter = util.transformPoint({ x: 0, y: 0 } as any, m);
                foundSource = true;
            }
        }

        if (!foundSource) {
            // Fallback to self
            const matrix = this.calcTransformMatrix();
            sourceCenter = util.transformPoint({ x: 0, y: 0 } as any, matrix);
        }

        // Convert global center to temp canvas coordinates
        const tempCenterX = sourceCenter.x - boundingRect.left;
        const tempCenterY = sourceCenter.y - boundingRect.top;

        // Source dimensions
        let srcW, srcH;
        if (foundSource && sourceObj) {
            // Use actual source object dimensions
            srcW = sourceObj.getScaledWidth();
            srcH = sourceObj.getScaledHeight();
        } else {
            // Fallback: calculate from view dimensions and magnification
            srcW = width / magnification;
            srcH = height / magnification;
        }

        const srcX = tempCenterX - srcW / 2;
        const srcY = tempCenterY - srcH / 2;

        // Since width/height are already corrected in _render, 
        // they now perfectly match the source aspect ratio * magnification.
        ctx.save();
        ctx.beginPath();
        if (this.magnifierShape === 'circle') {
            ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, 2 * Math.PI);
        } else {
            ctx.rect(-width / 2, -height / 2, width, height);
        }
        ctx.clip();

        // The content should perfectly fill the width/height
        const destX = -width / 2;
        const destY = -height / 2;

        ctx.drawImage(
            tempCanvas,
            srcX, srcY, srcW, srcH,
            destX, destY, width, height
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
