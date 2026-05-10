import React, { useEffect, useRef } from 'react';
import { Layer } from 'react-konva';
import Konva from 'konva';

interface GridLayerProps {
  spacing?: number;
  dotRadius?: number;
  dotColor?: string;
}

/**
 * A component that renders a lattice of dots for better element alignment.
 * The grid is positioned under the diagram elements.
 */
export const GridLayer: React.FC<GridLayerProps> = ({
  spacing = 20,
  dotRadius = 1,
  dotColor = '#CCCCCC'
}) => {

  const layerRef = useRef<Konva.Layer>(null);

  useEffect(() => {
    if (!layerRef.current) return;

    const layer = layerRef.current;
    const stage = layer.getStage();

    if (!stage) return;

    // Function to update the grid based on stage position and scale
    const updateGrid = () => {
      layer.clear();

      const scale = stage.scaleX();
      const position = stage.position();

      // Calculate the visible area in world coordinates
      const visibleArea = {
        x: -position.x / scale,
        y: -position.y / scale,
        width: stage.width() / scale,
        height: stage.height() / scale
      };

      // Calculate the grid boundaries
      const startX = Math.floor(visibleArea.x / spacing) * spacing;
      const startY = Math.floor(visibleArea.y / spacing) * spacing;
      const endX = Math.ceil((visibleArea.x + visibleArea.width) / spacing) * spacing;
      const endY = Math.ceil((visibleArea.y + visibleArea.height) / spacing) * spacing;

      // Draw the dots
      const context = layer.getContext();
      context.save();
      (context as unknown as CanvasRenderingContext2D).fillStyle = dotColor;

      for (let x = startX; x <= endX; x += spacing) {
        for (let y = startY; y <= endY; y += spacing) {
          context.beginPath();
          context.arc(x, y, dotRadius, 0, Math.PI * 2, false);
          context.fill();
        }
      }

      context.restore();
    };

    // Update grid initially
    updateGrid();

    // Add event listeners for stage transformations
    stage.on('dragmove', updateGrid);
    stage.on('wheel', updateGrid);
    stage.on('scaleChange', updateGrid);

    // Clean up event listeners
    return () => {
      stage.off('dragmove', updateGrid);
      stage.off('wheel', updateGrid);
      stage.off('scaleChange', updateGrid);
    };
  }, [spacing, dotRadius, dotColor]);

  return <Layer ref={layerRef} />;
};
