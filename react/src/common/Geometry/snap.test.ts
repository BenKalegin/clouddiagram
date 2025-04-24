import { snapToGrid, snapToBounds } from './snap';
import { Coordinate, Bounds } from '../model';

describe('Snap Utilities', () => {
  describe('snapToGrid', () => {
    it('should snap coordinates to the nearest grid point', () => {
      const pos: Coordinate = { x: 23, y: 47 };
      const gridSize = 10;

      const result = snapToGrid(pos, gridSize);

      expect(result).toEqual({
        x: 20,
        y: 50
      });
    });

    it('should not change coordinates that are already on grid points', () => {
      const pos: Coordinate = { x: 20, y: 50 };
      const gridSize = 10;

      const result = snapToGrid(pos, gridSize);

      expect(result).toEqual({
        x: 20,
        y: 50
      });
    });

    it('should handle different grid sizes', () => {
      const pos: Coordinate = { x: 23, y: 47 };
      const gridSize = 5;

      const result = snapToGrid(pos, gridSize);

      expect(result).toEqual({
        x: 25,
        y: 45
      });
    });

    it('should handle negative coordinates', () => {
      const pos: Coordinate = { x: -23, y: -47 };
      const gridSize = 10;

      const result = snapToGrid(pos, gridSize);

      expect(result).toEqual({
        x: -20,
        y: -50
      });
    });
  });

  describe('snapToBounds', () => {
    it('should snap x coordinate to bounds x while keeping y coordinate', () => {
      const pos: Coordinate = { x: 23, y: 47 };
      const bounds: Bounds = { x: 10, y: 20, width: 100, height: 50 };

      const result = snapToBounds(pos, bounds);

      expect(result).toEqual({
        x: 10,
        y: 47
      });
    });

    it('should work with negative coordinates', () => {
      const pos: Coordinate = { x: -23, y: -47 };
      const bounds: Bounds = { x: -10, y: -20, width: 100, height: 50 };

      const result = snapToBounds(pos, bounds);

      expect(result).toEqual({
        x: -10,
        y: -47
      });
    });
  });
});
