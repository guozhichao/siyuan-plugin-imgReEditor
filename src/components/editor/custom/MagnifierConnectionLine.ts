
import { Line, classRegistry } from 'fabric';

export class MagnifierConnectionLine extends Line {
    static type = 'magnifier-connection-line';
    viewId: string | null = null;
    sourceId: string | null = null;

    constructor(points: [number, number, number, number], options?: any) {
        if (options) {
            const { type, ...otherOptions } = options;
            super(points, otherOptions);
        } else {
            super(points, options);
        }
        this.viewId = options?.viewId || null;
        this.sourceId = options?.sourceId || null;
        this.stroke = options?.stroke || '#00ccff';
        this.strokeWidth = options?.strokeWidth || 1;
        this.strokeDashArray = options?.strokeDashArray || [5, 5];
        this.selectable = false;
        this.evented = false;
        this.objectCaching = false;
    }

    /**
     * Override toObject to include custom properties
     */
    toObject(propertiesToInclude?: any): any {
        return super.toObject(['viewId', 'sourceId', ...(propertiesToInclude || [])] as any);
    }

    static fromObject(object: any): Promise<MagnifierConnectionLine> {
        const points = [object.x1, object.y1, object.x2, object.y2] as [number, number, number, number];
        return Promise.resolve(new MagnifierConnectionLine(points, object));
    }
}

classRegistry.setClass(MagnifierConnectionLine, 'magnifier-connection-line');
export default MagnifierConnectionLine;
