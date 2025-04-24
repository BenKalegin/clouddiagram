import React, { useRef, useEffect, useState, ReactNode, Children, isValidElement, cloneElement } from 'react';
import { Layer } from 'react-konva';
import Konva from 'konva';
import { Bounds } from '../model';

// Define props for the VirtualizedLayer component
interface VirtualizedLayerProps {
  children: ReactNode;
  padding?: number; // Additional padding around the viewport to render elements (helps with smooth scrolling)
}

// Interface for the virtualized item props
export interface VirtualizedItemProps {
  getBounds: () => Bounds;
  children: ReactNode;
}

/**
 * A component that wraps a diagram element and only renders it if it's visible in the viewport.
 */
export const VirtualizedItem: React.FC<VirtualizedItemProps> = ({
  getBounds,
  children
}) => {
  // The actual rendering is handled by the parent VirtualizedLayer
  return <>{children}</>;
};

/**
 * A virtualized layer that only renders children that are visible in the viewport.
 * This improves performance for large diagrams by reducing the number of elements rendered.
 */
export const VirtualizedLayer: React.FC<VirtualizedLayerProps> = ({
  children,
  padding = 100 // Default padding of 100px around the viewport
}) => {
  // Reference to the Layer component
  const layerRef = useRef<Konva.Layer>(null);

  // State to track the current viewport bounds
  const [viewport, setViewport] = useState<Bounds>({
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Update viewport when the stage is transformed (panned/zoomed)
  useEffect(() => {
    if (!layerRef.current) return;

    const layer = layerRef.current;
    const stage = layer.getStage();

    if (!stage) return;

    // Function to update the viewport bounds
    const updateViewport = () => {
      const scale = stage.scaleX();
      const position = stage.position();

      // Calculate the viewport in world coordinates
      const viewportBounds: Bounds = {
        x: -position.x / scale - padding,
        y: -position.y / scale - padding,
        width: stage.width() / scale + padding * 2,
        height: stage.height() / scale + padding * 2
      };

      setViewport(viewportBounds);
    };

    // Update viewport initially
    updateViewport();

    // Add event listeners for stage transformations
    stage.on('dragmove', updateViewport);
    stage.on('wheel', updateViewport);
    stage.on('scaleChange', updateViewport);

    // Clean up event listeners
    return () => {
      stage.off('dragmove', updateViewport);
      stage.off('wheel', updateViewport);
      stage.off('scaleChange', updateViewport);
    };
  }, [padding]);

  // Helper function to check if bounds are visible in the viewport
  const isBoundsVisible = (bounds: Bounds): boolean => {
    // If bounds can't be determined, assume it's visible
    if (!bounds) return true;

    // Check if the bounds intersect with the viewport
    return (
      bounds.x < viewport.x + viewport.width &&
      bounds.x + bounds.width > viewport.x &&
      bounds.y < viewport.y + viewport.height &&
      bounds.y + bounds.height > viewport.y
    );
  };

  // Filter children to only include VirtualizedItems that are visible in the viewport
  const visibleChildren = Children.map(children, child => {
    if (!isValidElement(child)) return child;

    // If it's a VirtualizedItem, check if it's visible
    if (child.type === VirtualizedItem) {
      const getBounds = child.props.getBounds;

      if (typeof getBounds === 'function') {
        const bounds = getBounds();
        if (!isBoundsVisible(bounds)) {
          // Skip rendering this item if it's not visible
          return null;
        }
      }
    }

    return child;
  });

  return <Layer ref={layerRef}>{visibleChildren}</Layer>;
};
