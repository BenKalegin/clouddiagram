import { portBounds } from './structureDiagramModel';
import { Bounds } from '../../common/model';
import { PortAlignment, PortState } from '../../package/packageModel';
import {PortPlacement} from "./structureDiagramState";

jest.mock("react-konva-to-svg", () => ({
  exportStageSVG: jest.fn(),
}));


describe('structureDiagramModel', () => {
  describe('portBounds', () => {
    // Create test data
    const nodePlacement: Bounds = { x: 100, y: 100, width: 200, height: 100 };
    const port: PortState = {
      id: 'port1',
      nodeId: 'node1',
      type: 0, // ElementType.ClassPort
      depthRatio: 50,
      latitude: 10,
      longitude: 10,
      links: []
    };

    it('should calculate bounds for a port with Top alignment', () => {
      const portPlacement: PortPlacement = {
        alignment: PortAlignment.Top,
        edgePosRatio: 50
      };

      const result = portBounds(nodePlacement, port, portPlacement);

      expect(result).toEqual({
        x: 195, // 100 + 200 * 50/100 - 10/2
        y: 95,  // 100 - 10 * (100-50)/100
        width: 10,
        height: 10
      });
    });

    it('should calculate bounds for a port with Bottom alignment', () => {
      const portPlacement: PortPlacement = {
        alignment: PortAlignment.Bottom,
        edgePosRatio: 50
      };

      const result = portBounds(nodePlacement, port, portPlacement);

      expect(result).toEqual({
        x: 195, // 100 + 200 * 50/100 - 10/2
        y: 195, // 100 + 100 - 10 * 50/100
        width: 10,
        height: 10
      });
    });

    it('should calculate bounds for a port with Left alignment', () => {
      const portPlacement: PortPlacement = {
        alignment: PortAlignment.Left,
        edgePosRatio: 50
      };

      const result = portBounds(nodePlacement, port, portPlacement);

      expect(result).toEqual({
        x: 95,  // 100 - 10 * (100-50)/100
        y: 145, // 100 + 100 * 50/100 - 10/2
        width: 10,
        height: 10
      });
    });

    it('should calculate bounds for a port with Right alignment', () => {
      const portPlacement: PortPlacement = {
        alignment: PortAlignment.Right,
        edgePosRatio: 50
      };

      const result = portBounds(nodePlacement, port, portPlacement);

      expect(result).toEqual({
        x: 295, // 100 + 200 - 10 * 50/100
        y: 145, // 100 + 100 * 50/100 - 10/2
        width: 10,
        height: 10
      });
    });

    it('should throw an error for an invalid alignment', () => {
      const portPlacement: PortPlacement = {
        alignment: 999 as PortAlignment, // Invalid alignment
        edgePosRatio: 50
      };

      expect(() => portBounds(nodePlacement, port, portPlacement)).toThrow('Unknown port alignment:999');
    });

    it('should handle different port sizes', () => {
      const largePort: PortState = {
        ...port,
        latitude: 20,
        longitude: 30
      };

      const portPlacement: PortPlacement = {
        alignment: PortAlignment.Top,
        edgePosRatio: 50
      };

      const result = portBounds(nodePlacement, largePort, portPlacement);

      expect(result).toEqual({
        x: 190, // 100 + 200 * 50/100 - 20/2
        y: 85,  // 100 - 30 * (100-50)/100
        width: 20,
        height: 30
      });
    });

    it('should handle different edge position ratios', () => {
      const portPlacement: PortPlacement = {
        alignment: PortAlignment.Top,
        edgePosRatio: 25
      };

      const result = portBounds(nodePlacement, port, portPlacement);

      expect(result).toEqual({
        x: 145, // 100 + 200 * 25/100 - 10/2
        y: 95,  // 100 - 10 * (100-50)/100
        width: 10,
        height: 10
      });
    });
  });
});
