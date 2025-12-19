import { FabricObject, classRegistry, TOptions, FabricObjectProps } from 'fabric';

export interface NumberMarkerOptions extends TOptions<FabricObjectProps> {
    count?: number;
    fill?: string;
    textColor?: string;
    fontSize?: number;
}

/**
 * Custom NumberMarker class
 * Draws a circle with a number inside
 * Now uses fontSize as the primary property, with radius calculated from it
 */
export class NumberMarker extends FabricObject {
    static type = 'number-marker';

    count: number;
    textColor: string;
    fontSize: number;

    constructor(options?: NumberMarkerOptions) {
        super(options);

        this.count = options?.count || 1;
        // Default fill is handled by super if passed in options, usually red from callsite
        this.fill = options?.fill || 'red';
        this.textColor = options?.textColor || 'white';
        this.fontSize = options?.fontSize || 20;

        // Calculate radius from fontSize
        const radius = this.fontSize * 0.8;

        // precise dimensions
        this.width = radius * 2;
        this.height = radius * 2;

        this.objectCaching = false;

        // No stroke by default unless specified
        this.stroke = options?.stroke || null;
        this.strokeWidth = options?.strokeWidth || 0;

        // Allow proportional scaling only
        this.lockScalingX = false;
        this.lockScalingY = false;
        this.lockRotation = true;
        this.lockSkewingX = true;
        this.lockSkewingY = true;

        // Hide rotation control but keep corner scaling controls
        this.setControlsVisibility({
            mtr: false,
        });
    }

    /**
     * Get the calculated radius from fontSize
     */
    get radius(): number {
        return this.fontSize * 0.8;
    }

    /**
     * Get the effective fontSize accounting for scaling
     */
    getEffectiveFontSize(): number {
        return Math.round(this.fontSize * (this.scaleX || 1));
    }

    _render(ctx: CanvasRenderingContext2D) {
        ctx.save();

        // Calculate radius from fontSize
        const radius = this.radius;

        // Draw the circle background
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);

        if (this.fill) {
            ctx.fillStyle = this.fill as string;
            ctx.fill();
        }

        if (this.stroke) {
            ctx.strokeStyle = this.stroke as string;
            ctx.lineWidth = this.strokeWidth || 0;
            ctx.stroke();
        }

        // Draw the number
        ctx.fillStyle = this.textColor;
        // Font size matches the fontSize property
        ctx.font = `bold ${this.fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Minor optical adjustment for vertical centering
        ctx.fillText(this.count.toString(), 0, this.fontSize * 0.05);

        ctx.restore();
    }

    /**
     * Override toObject to include custom properties
     */
    toObject(propertiesToInclude: any[] = []): any {
        return super.toObject(['count', 'textColor', 'fontSize', ...propertiesToInclude]);
    }
}

classRegistry.setClass(NumberMarker);

export default NumberMarker;
