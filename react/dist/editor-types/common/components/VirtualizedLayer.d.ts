import React, { ReactNode } from 'react';
import { Bounds } from '../model';
interface VirtualizedLayerProps {
    children: ReactNode;
    padding?: number;
}
export interface VirtualizedItemProps {
    getBounds: () => Bounds;
    children: ReactNode;
}
/**
 * A component that wraps a diagram element and only renders it if it's visible in the viewport.
 */
export declare const VirtualizedItem: React.FC<VirtualizedItemProps>;
/**
 * A virtualized layer that only renders children that are visible in the viewport.
 * This improves performance for large diagrams by reducing the number of elements rendered.
 */
export declare const VirtualizedLayer: React.FC<VirtualizedLayerProps>;
export {};
//# sourceMappingURL=VirtualizedLayer.d.ts.map