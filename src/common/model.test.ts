import {
  Coordinate,
  Bounds,
  inflate,
  rightOf,
  withinBounds,
  withinYBounds,
  withinXBounds,
  minus,
  center
} from './model';

describe('Geometric Utilities', () => {
  describe('inflate', () => {
    it('should inflate bounds by the specified amounts', () => {
      const bounds: Bounds = { x: 10, y: 20, width: 100, height: 50 };
      const result = inflate(bounds, 5, 10);

      expect(result).toEqual({
        x: 5,
        y: 10,
        width: 110,
        height: 70
      });
    });

    it('should deflate bounds when given negative values', () => {
      const bounds: Bounds = { x: 10, y: 20, width: 100, height: 50 };
      const result = inflate(bounds, -5, -10);

      expect(result).toEqual({
        x: 15,
        y: 30,
        width: 90,
        height: 30
      });
    });
  });

  describe('rightOf', () => {
    it('should create bounds to the right of the given bounds', () => {
      const bounds: Bounds = { x: 10, y: 20, width: 100, height: 50 };
      const result = rightOf(bounds, 75);

      expect(result).toEqual({
        x: 110,
        y: 20,
        width: 75,
        height: 50
      });
    });
  });

  describe('withinBounds', () => {
    const bounds: Bounds = { x: 10, y: 20, width: 100, height: 50 };

    it('should return true when coordinate is within bounds', () => {
      const pos: Coordinate = { x: 50, y: 40 };
      expect(withinBounds(bounds, pos, 0)).toBe(true);
    });

    it('should return true when coordinate is within bounds plus tolerance', () => {
      const pos: Coordinate = { x: 5, y: 15 };
      expect(withinBounds(bounds, pos, 5)).toBe(true);
    });

    it('should return false when coordinate is outside bounds plus tolerance', () => {
      const pos: Coordinate = { x: 0, y: 0 };
      expect(withinBounds(bounds, pos, 5)).toBe(false);
    });
  });

  describe('withinYBounds', () => {
    const bounds: Bounds = { x: 10, y: 20, width: 100, height: 50 };

    it('should return true when y is within bounds', () => {
      expect(withinYBounds(bounds, 40, 0)).toBe(true);
    });

    it('should return true when y is within bounds plus tolerance', () => {
      expect(withinYBounds(bounds, 15, 5)).toBe(true);
    });

    it('should return false when y is outside bounds plus tolerance', () => {
      expect(withinYBounds(bounds, 0, 5)).toBe(false);
    });
  });

  describe('withinXBounds', () => {
    const bounds: Bounds = { x: 10, y: 20, width: 100, height: 50 };

    it('should return true when x is within bounds', () => {
      expect(withinXBounds(bounds, 50, 0)).toBe(true);
    });

    it('should return true when x is within bounds plus tolerance', () => {
      expect(withinXBounds(bounds, 5, 5)).toBe(true);
    });

    it('should return false when x is outside bounds plus tolerance', () => {
      expect(withinXBounds(bounds, 0, 5)).toBe(false);
    });
  });

  describe('minus', () => {
    it('should subtract the second coordinate from the first', () => {
      const coord1: Coordinate = { x: 10, y: 20 };
      const coord2: Coordinate = { x: 3, y: 7 };
      const result = minus(coord1, coord2);

      expect(result).toEqual({
        x: 7,
        y: 13
      });
    });
  });

  describe('center', () => {
    it('should calculate the center of the bounds', () => {
      const bounds: Bounds = { x: 10, y: 20, width: 100, height: 50 };
      const result = center(bounds);

      expect(result).toEqual({
        x: 60,
        y: 45
      });
    });
  });
});
