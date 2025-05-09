import { RecoilRoot, RecoilState} from 'recoil';
import {
  autoConnectActivations,
  createLifelineAndConnectTo,
  handleSequenceCommand,
  handleSequenceDropFromLibrary,
  handleSequenceElementPropertyChanged,
  handleSequenceMoveElement,
  handleSequenceResizeElement,
  SequenceDiagramState
} from './sequenceDiagramModel';
import {activeDiagramIdAtom} from '../diagramTabs/diagramTabsModel';
import {elementsAtom, generateId, linkingAtom} from '../diagramEditor/diagramEditorModel';
import {Command} from '../propertiesEditor/propertiesEditorModel';
import {DiagramElement, ElementType} from '../../package/packageModel';
import {Coordinate, defaultDiagramDisplay} from '../../common/model';

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

jest.mock("react-konva-to-svg", () => ({
  exportStageSVG: jest.fn(),
}));

describe('Sequence Diagram Integration Tests', () => {
  // Mock get and set functions for testing
  const mockState = new Map();
  const get = (atom: any) => mockState.get(atom) || (atom as any).default;
  const set = (atom: any, value: any) => mockState.set(atom, value);

  const diagramId = 'test-diagram-id';

  beforeEach(() => {
    // Reset the mock state before each test
    mockState.clear();

    // Set up initial state
    const initialDiagram: SequenceDiagramState = {
      id: diagramId,
      type: ElementType.SequenceDiagram,
      title: 'Test Sequence Diagram',
      lifelines: {},
      messages: {},
      activations: {},
      notes: {},
      selectedElements: [],
      display: defaultDiagramDisplay
    };

    mockState.set(activeDiagramIdAtom, diagramId);
    mockState.set(elementsAtom(diagramId), initialDiagram);
  });

  describe('handleSequenceDropFromLibrary', () => {
    it('should add a lifeline to the diagram', () => {
      // Arrange
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'TestLifeline';
      const kind = { type: ElementType.SequenceLifeLine };

      // Act
      handleSequenceDropFromLibrary(get, set, droppedAt, name, kind);

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
      const lifelines = Object.values(updatedDiagram.lifelines);

      expect(lifelines.length).toBe(1);
      expect(lifelines[0].title).toBe('TestLifeline');
      expect(lifelines[0].type).toBe(ElementType.SequenceLifeLine);
    });

    it('should add a note to the diagram', () => {
      // Arrange
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'Test Note';
      const kind = { type: ElementType.Note };

      // Act
      handleSequenceDropFromLibrary(get, set, droppedAt, name, kind);

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
      const notes = Object.values(updatedDiagram.notes);

      expect(notes.length).toBe(1);
      expect(notes[0].text).toBe('Test Note');
      expect(notes[0].type).toBe(ElementType.Note);
    });
  });

  describe('handleSequenceMoveElement', () => {
    it('should move a lifeline', () => {
      // Arrange
      // First add a lifeline
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'TestLifeline';
      const kind = { type: ElementType.SequenceLifeLine };
      handleSequenceDropFromLibrary(get, set, droppedAt, name, kind);

      // Get the lifeline ID
      const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
      const lifelineId = Object.keys(diagram.lifelines)[0];

      // Set up move parameters
      const element = { id: lifelineId, type: ElementType.SequenceLifeLine };
      const currentPointerPos: Coordinate = { x: 150, y: 50 };
      const startPointerPos: Coordinate = { x: 100, y: 50 };
      const startNodePos: Coordinate = { x: 50, y: 30 };

      // Act
      handleSequenceMoveElement(get, set, element, currentPointerPos, startPointerPos, startNodePos);

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
      const lifeline = updatedDiagram.lifelines[lifelineId];

      expect(lifeline.placement.headBounds.x).toBe(100); // 50 + (150 - 100)
      expect(lifeline.placement.headBounds.y).toBe(30); // startNodePos.y is preserved
    });
  });

  describe('handleSequenceResizeElement', () => {
    it('should resize a lifeline', () => {
      // Arrange
      // First add a lifeline
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'TestLifeline';
      const kind = { type: ElementType.SequenceLifeLine };
      handleSequenceDropFromLibrary(get, set, droppedAt, name, kind);

      // Get the lifeline ID
      const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
      const lifelineId = Object.keys(diagram.lifelines)[0];

      // Set up resize parameters
      const element = { id: lifelineId, type: ElementType.SequenceLifeLine };
      const suggestedBounds = { x: 120, y: 30, width: 150, height: 60 };

      // Act
      handleSequenceResizeElement(get, set, element, suggestedBounds);

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
      const lifeline = updatedDiagram.lifelines[lifelineId];

      expect(lifeline.placement.headBounds.x).toBe(120);
      expect(lifeline.placement.headBounds.width).toBe(150);
    });
  });

  describe('handleSequenceElementPropertyChanged', () => {
    it('should change a lifeline property', () => {
      // Arrange
      // First add a lifeline
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'TestLifeline';
      const kind = { type: ElementType.SequenceLifeLine };
      handleSequenceDropFromLibrary(get, set, droppedAt, name, kind);

      // Get the lifeline ID
      const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
      const lifelineId = Object.keys(diagram.lifelines)[0];

      // Set up property change parameters
      const elements = [{ id: lifelineId, type: ElementType.SequenceLifeLine }];
      const propertyName = 'title';
      const value = 'Updated Lifeline';

      // Act
      handleSequenceElementPropertyChanged(get, set, elements, propertyName, value);

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
      const lifeline = updatedDiagram.lifelines[lifelineId];

      expect(lifeline.title).toBe('Updated Lifeline');
    });
  });

  describe('handleSequenceCommand', () => {
    it('should delete a lifeline', () => {
      // Arrange
      // First add a lifeline
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'TestLifeline';
      const kind = { type: ElementType.SequenceLifeLine };
      handleSequenceDropFromLibrary(get, set, droppedAt, name, kind);

      // Get the lifeline ID
      const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
      const lifelineId = Object.keys(diagram.lifelines)[0];

      // Set up command parameters
      const elements = [{ id: lifelineId, type: ElementType.SequenceLifeLine }];

      // Act
      handleSequenceCommand(get, set, elements, Command.Delete);

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as SequenceDiagramState;

      expect(Object.keys(updatedDiagram.lifelines).length).toBe(0);
    });
  });

  describe('autoConnectActivations', () => {
    it('should connect two lifelines with a message', () => {
      // Arrange
      // Add two lifelines
      const droppedAt1: Coordinate = { x: 100, y: 50 };
      const name1 = 'Lifeline1';
      const kind = { type: ElementType.SequenceLifeLine };
      handleSequenceDropFromLibrary(get, set, droppedAt1, name1, kind);

      const droppedAt2: Coordinate = { x: 300, y: 50 };
      const name2 = 'Lifeline2';
      handleSequenceDropFromLibrary(get, set, droppedAt2, name2, kind);

      // Get the lifeline IDs
      const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
      const lifelineIds = Object.keys(diagram.lifelines);

      // Set up connection parameters
      const sourceId = lifelineIds[0];
      const target = { id: lifelineIds[1], type: ElementType.SequenceLifeLine };
      const diagramPos: Coordinate = { x: 200, y: 100 };

      // Act
      autoConnectActivations(get, set, sourceId, target, diagramPos);

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as SequenceDiagramState;

      // Should have created activations
      expect(Object.keys(updatedDiagram.activations).length).toBe(2);

      // Should have created a message
      expect(Object.keys(updatedDiagram.messages).length).toBe(1);

      // The message should connect the two activations
      const message = Object.values(updatedDiagram.messages)[0];
      const activationIds = Object.keys(updatedDiagram.activations);
      expect([message.activation1, message.activation2].sort()).toEqual(activationIds.sort());
    });
  });

  describe('createLifelineAndConnectTo', () => {
    it('should create a new lifeline and connect it to an existing one', () => {
      // Arrange
      // Add a lifeline
      const droppedAt: Coordinate = { x: 100, y: 50 };
      const name = 'Lifeline1';
      const kind = { type: ElementType.SequenceLifeLine };
      handleSequenceDropFromLibrary(get, set, droppedAt, name, kind);

      // Get the lifeline ID
      const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
      const lifelineId = Object.keys(diagram.lifelines)[0];

      // Mock the linking state
      mockState.set(linkingAtom, {
        sourceElement: lifelineId,
        diagramPos: { x: 300, y: 100 },
        showLinkToNewDialog: true
      });

      // Act
      createLifelineAndConnectTo(get, set, 'NewLifeline');

      // Assert
      const updatedDiagram = get(elementsAtom(diagramId)) as SequenceDiagramState;

      // Should have two lifelines
      expect(Object.keys(updatedDiagram.lifelines).length).toBe(2);

      // Should have created activations
      expect(Object.keys(updatedDiagram.activations).length).toBe(2);

      // Should have created a message
      expect(Object.keys(updatedDiagram.messages).length).toBe(1);

      // The second lifeline should have the correct name
      const newLifeline = Object.values(updatedDiagram.lifelines).find(l => l.id !== lifelineId);
      expect(newLifeline?.title).toBe('NewLifeline');
    });
  });
});
