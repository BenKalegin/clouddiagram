import {
  addNewElementAt,
  addNodeAndConnect,
  autoConnectNodes,
  handleStructureElementCommand,
  handleStructureElementPropertyChanged,
  moveElement,
  resizeElement
} from './structureDiagramModel';
import { activeDiagramIdAtom } from '../diagramTabs/diagramTabsModel';
import { elementsAtom, linkingAtom, snapGridSizeAtom } from '../diagramEditor/diagramEditorModel';
import { Command } from '../propertiesEditor/propertiesEditorModel';
import { ElementType } from '../../package/packageModel';
import {Bounds, Coordinate, defaultDiagramDisplay} from '../../common/model';
import { StructureDiagramState } from './structureDiagramState';

jest.mock("react-konva-to-svg", () => ({
  exportStageSVG: jest.fn(),
}));

// Mock the recoil state
jest.mock('recoil', () => {
  const originalModule = jest.requireActual('recoil');
  const mockState = new Map();

  return {
    ...originalModule,
    useRecoilState: jest.fn((atom) => {
      const getValue = () => mockState.get(atom) || atom.default;
      const setValue = (newValue: any) => mockState.set(atom, newValue);
      return [getValue(), setValue];
    }),
    useRecoilValue: jest.fn((atom) => mockState.get(atom) || atom.default),
    useSetRecoilState: jest.fn((atom) => (newValue: any) => mockState.set(atom, newValue)),
  };
});

describe('Structure Diagram Integration Tests', () => {
  // Mock get and set functions for testing
  const mockState = new Map();
  const get = (atom: any) => mockState.get(atom) || atom.default;
  const set = (atom: any, value: any) => mockState.set(atom, value);

  const diagramId = 'test-diagram-id';

  beforeEach(() => {
    // Reset the mock state before each test
    mockState.clear();

    // Set up initial state
    const initialDiagram: StructureDiagramState = {
      id: diagramId,
      type: ElementType.ClassDiagram,
      title: 'Test Structure Diagram',
      nodes: {},
      links: {},
      ports: {},
      notes: {},
      selectedElements: [],
      display: defaultDiagramDisplay
    };

    mockState.set(activeDiagramIdAtom, diagramId);
    mockState.set(elementsAtom(diagramId), initialDiagram);
    mockState.set(snapGridSizeAtom, 10); // Set a default grid size
  });

  describe('addNewElementAt', () => {
    it('should add a node to the diagram', () => {
      // Arrange
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'TestNode';
      const elementType = { type: ElementType.ClassNode };

      // Act
      const result = addNewElementAt(get, set, droppedAt, name, elementType);

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as StructureDiagramState;
      const nodes = Object.keys(updatedDiagram.nodes);

      expect(nodes.length).toBe(1);
      expect(nodes[0]).toBe(result.id);

      // Check the node was created correctly
      const node = get(elementsAtom(result.id));
      expect(node.text).toBe('TestNode');
      expect(node.type).toBe(ElementType.ClassNode);

      // Check the node placement
      const nodePlacement = updatedDiagram.nodes[result.id];
      expect(nodePlacement.bounds.x).toBe(50); // 100 - 100/2 (centered)
      expect(nodePlacement.bounds.y).toBe(50);
    });

    it('should add a note to the diagram', () => {
      // Arrange
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'Test Note';
      const elementType = { type: ElementType.Note };

      // Act
      const result = addNewElementAt(get, set, droppedAt, name, elementType);

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as StructureDiagramState;
      const notes = Object.keys(updatedDiagram.notes);

      expect(notes.length).toBe(1);
      expect(notes[0]).toBe(result.id);
      expect(updatedDiagram.notes[result.id].text).toBe('Test Note');
      expect(updatedDiagram.notes[result.id].type).toBe(ElementType.Note);
    });
  });

  describe('moveElement', () => {
    it('should move a node', () => {
      // Arrange
      // First add a node
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'TestNode';
      const elementType = { type: ElementType.ClassNode };
      const node = addNewElementAt(get, set, droppedAt, name, elementType);

      // Set up move parameters
      const element = { id: node.id, type: ElementType.ClassNode };
      const currentPointerPos: Coordinate = { x: 150, y: 70 };
      const startPointerPos: Coordinate = { x: 100, y: 50 };
      const startNodePos: Coordinate = { x: 50, y: 30 };

      // Act
      moveElement(get, set, element, currentPointerPos, startPointerPos, startNodePos);

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as StructureDiagramState;
      const nodePlacement = updatedDiagram.nodes[node.id];

      // Should snap to grid (grid size is 10)
      expect(nodePlacement.bounds.x).toBe(100); // 50 + (150 - 100), rounded to nearest 10
      expect(nodePlacement.bounds.y).toBe(50); // 30 + (70 - 50), rounded to nearest 10
    });
  });

  describe('resizeElement', () => {
    it('should resize a node', () => {
      // Arrange
      // First add a node
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'TestNode';
      const elementType = { type: ElementType.ClassNode };
      const node = addNewElementAt(get, set, droppedAt, name, elementType);

      // Set up resize parameters
      const element = { id: node.id, type: ElementType.ClassNode };
      const suggestedBounds: Bounds = { x: 120, y: 70, width: 150, height: 80 };

      // Act
      resizeElement(get, set, element, suggestedBounds);

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as StructureDiagramState;
      const nodePlacement = updatedDiagram.nodes[node.id];

      expect(nodePlacement.bounds.x).toBe(120);
      expect(nodePlacement.bounds.y).toBe(70);
      expect(nodePlacement.bounds.width).toBe(150);
      expect(nodePlacement.bounds.height).toBe(80);
    });

    it('should enforce minimum size when resizing', () => {
      // Arrange
      // First add a node
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'TestNode';
      const elementType = { type: ElementType.ClassNode };
      const node = addNewElementAt(get, set, droppedAt, name, elementType);

      // Set up resize parameters with very small dimensions
      const element = { id: node.id, type: ElementType.ClassNode };
      const suggestedBounds: Bounds = { x: 120, y: 70, width: 5, height: 5 };

      // Act
      resizeElement(get, set, element, suggestedBounds);

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as StructureDiagramState;
      const nodePlacement = updatedDiagram.nodes[node.id];

      expect(nodePlacement.bounds.width).toBe(10); // Minimum width
      expect(nodePlacement.bounds.height).toBe(10); // Minimum height
    });
  });

  describe('handleStructureElementPropertyChanged', () => {
    it('should change a node property', () => {
      // Arrange
      // First add a node
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'TestNode';
      const elementType = { type: ElementType.ClassNode };
      const node = addNewElementAt(get, set, droppedAt, name, elementType);

      // Set up property change parameters
      const elements = [{ id: node.id, type: ElementType.ClassNode }];
      const propertyName = 'text';
      const value = 'Updated Node';

      // Act
      handleStructureElementPropertyChanged(get, set, elements, propertyName, value);

      // Assert
      const updatedNode = get(elementsAtom(node.id));
      expect(updatedNode.text).toBe('Updated Node');
    });

    it('should change a note property', () => {
      // Arrange
      // First add a note
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'Test Note';
      const elementType = { type: ElementType.Note };
      const note = addNewElementAt(get, set, droppedAt, name, elementType);

      // Set up property change parameters
      const elements = [{ id: note.id, type: ElementType.Note }];
      const propertyName = 'text';
      const value = 'Updated Note';

      // Act
      handleStructureElementPropertyChanged(get, set, elements, propertyName, value);

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as StructureDiagramState;
      expect(updatedDiagram.notes[note.id].text).toBe('Updated Note');
    });
  });

  describe('handleStructureElementCommand', () => {
    it('should delete a node', () => {
      // Arrange
      // First add a node
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'TestNode';
      const elementType = { type: ElementType.ClassNode };
      const node = addNewElementAt(get, set, droppedAt, name, elementType);

      // Set up command parameters
      const elements = [{ id: node.id, type: ElementType.ClassNode }];

      // Act
      handleStructureElementCommand(get, set, elements, Command.Delete);

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as StructureDiagramState;
      expect(Object.keys(updatedDiagram.nodes).length).toBe(0);

      // The node itself should be deleted
      const deletedNode = get(elementsAtom(node.id));
      expect(deletedNode).toEqual({ id: "", type: 1 }); // This is what a deleted node actually looks like
    });
  });

  describe('autoConnectNodes', () => {
    it('should connect two nodes with a link', () => {
      // Arrange
      // Add two nodes
      const droppedAt1: Coordinate = { x: 100, y: 50 };
      const name1 = 'Node1';
      const elementType = { type: ElementType.ClassNode };
      const node1 = addNewElementAt(get, set, droppedAt1, name1, elementType);

      const droppedAt2: Coordinate = { x: 300, y: 50 };
      const name2 = 'Node2';
      const node2 = addNewElementAt(get, set, droppedAt2, name2, elementType);

      // Act
      autoConnectNodes(get, set, node1.id, { id: node2.id, type: ElementType.ClassNode });

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as StructureDiagramState;

      // Should have created ports
      const node1Updated = get(elementsAtom(node1.id));
      const node2Updated = get(elementsAtom(node2.id));
      expect(node1Updated.ports.length).toBe(1);
      expect(node2Updated.ports.length).toBe(1);

      // Should have created a link
      const port1 = get(elementsAtom(node1Updated.ports[0]));
      expect(port1.links.length).toBe(1);

      const linkId = port1.links[0];
      const link = get(elementsAtom(linkId));
      expect(link.port1).toBe(node1Updated.ports[0]);
      expect(link.port2).toBe(node2Updated.ports[0]);
    });
  });

  describe('addNodeAndConnect', () => {
    it('should create a new node and connect it to an existing one', () => {
      // Arrange
      // Add a node
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'Node1';
      const elementType = { type: ElementType.ClassNode };
      const node = addNewElementAt(get, set, droppedAt, name, elementType);

      // Mock the linking state
      mockState.set(linkingAtom, {
        sourceElement: node.id,
        diagramPos: { x: 300, y: 100 },
        showLinkToNewDialog: true
      });

      // Act
      addNodeAndConnect(get, set, 'NewNode');

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as StructureDiagramState;

      // Should have two nodes
      expect(Object.keys(updatedDiagram.nodes).length).toBe(2);

      // The original node should have a port
      const originalNode = get(elementsAtom(node.id));
      expect(originalNode.ports.length).toBe(1);

      // The port should have a link
      const port = get(elementsAtom(originalNode.ports[0]));
      expect(port.links.length).toBe(1);

      // The link should connect to the new node
      const link = get(elementsAtom(port.links[0]));
      const newNodeId = Object.keys(updatedDiagram.nodes).find(id => id !== node.id)!;
      const newNode = get(elementsAtom(newNodeId));
      expect(newNode.text).toBe('NewNode');
      expect(newNode.ports.length).toBe(1);
      expect(link.port2).toBe(newNode.ports[0]);
    });
  });
});
