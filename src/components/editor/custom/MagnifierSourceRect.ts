
import { Rect, classRegistry } from 'fabric';

export class MagnifierSourceRect extends Rect {
    static type = 'magnifier-source-rect';
    viewId: string | null = null;
    id: string | null = null;

    magnifierShape: 'rect' | 'circle' = 'rect';

    constructor(options?: any) {
        super(options);
        this.magnifierShape = options?.magnifierShape || 'rect';
        this.viewId = options?.viewId || null;
        this.id = options?.id || null;
        this.fill = 'transparent';
        this.stroke = options?.stroke || '#00ccff';
        this.strokeWidth = options?.strokeWidth || 1;
        this.strokeDashArray = [5, 5];
        this.objectCaching = false;
        this.selectable = true;
        this.evented = true;
        this.strokeUniform = true;
    }

    _render(ctx: CanvasRenderingContext2D): void {
        if (this.magnifierShape === 'circle') {
            ctx.beginPath();
            ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, 2 * Math.PI);
            ctx.closePath();
            this._renderPaintInOrder(ctx);
        } else {
            super._render(ctx);
        }
    }

    /**
     * Override toObject to include custom properties
     */
    toObject(propertiesToInclude?: any): any {
        return super.toObject(['viewId', 'id', 'magnifierShape', ...(propertiesToInclude || [])] as any);
    }

    static fromObject(object: any): Promise<MagnifierSourceRect> {
        return Promise.resolve(new MagnifierSourceRect(object));
    }
}

classRegistry.setClass(MagnifierSourceRect, 'magnifier-source-rect');
export default MagnifierSourceRect;
