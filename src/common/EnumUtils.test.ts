import { enumKeys } from './EnumUtils';

describe('EnumUtils', () => {
  describe('enumKeys', () => {
    it('should return string keys from an enum', () => {
      enum TestEnum {
        A = 'A',
        B = 'B',
        C = 'C'
      }

      const keys = enumKeys(TestEnum);

      expect(keys).toEqual(['A', 'B', 'C']);
    });

    it('should return string keys from a numeric enum', () => {
      enum NumericEnum {
        One = 1,
        Two = 2,
        Three = 3
      }

      const keys = enumKeys(NumericEnum);

      expect(keys).toEqual(['One', 'Two', 'Three']);
    });

    it('should return string keys from a mixed enum', () => {
      enum MixedEnum {
        A = 'A',
        One = 1,
        B = 'B',
        Two = 2
      }

      const keys = enumKeys(MixedEnum);

      expect(keys).toEqual(['A', 'One', 'B', 'Two']);
    });

    it('should return empty array for an empty object', () => {
      const emptyObj = {};

      const keys = enumKeys(emptyObj);

      expect(keys).toEqual([]);
    });

    it('should filter out numeric keys from an object', () => {
      const obj = {
        '0': 'zero',
        'one': 1,
        '2': 'two',
        'three': 3
      };

      const keys = enumKeys(obj);

      expect(keys).toEqual(['one', 'three']);
    });
  });
});
