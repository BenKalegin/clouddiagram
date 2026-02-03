jest.mock("konva", () => ({}));
jest.mock("react-konva", () => ({}));
jest.mock("react-konva-to-svg", () => ({
    exportStageSVG: jest.fn(),
}));

import { importMermaidStructureDiagram, importMermaidSequenceDiagram } from './mermaidFormat';
import { Diagram } from '../../common/model';
import { StructureDiagramState } from '../structureDiagram/structureDiagramState';
import { SequenceDiagramState } from '../sequenceDiagram/sequenceDiagramModel';
import { NodeState, LinkState, ElementType } from '../../package/packageModel';

describe('mermaidFormat', () => {
    describe('importMermaidSequenceDiagram', () => {
        it('should correctly import a sequence diagram', () => {
            const baseDiagram: Diagram = {
                id: 'test-seq',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.SequenceDiagram,
                selectedElements: [],
                notes: {}
            };

            const content = `sequenceDiagram
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>Alice: Howdy Alice, I am good!`;

            const result = importMermaidSequenceDiagram(baseDiagram, content) as SequenceDiagramState;

            expect(result.id).toBe(baseDiagram.id);
            expect(result.type).toBe(ElementType.SequenceDiagram);

            const lifelines = Object.values(result.lifelines);
            expect(lifelines).toHaveLength(2);
            expect(lifelines.map(l => l.title).sort()).toEqual(['Alice', 'Bob']);

            const messages = Object.values(result.messages);
            expect(messages).toHaveLength(2);
            expect(messages[0].text).toBe('Hello Bob, how are you?');
            expect(messages[1].text).toBe('Howdy Alice, I am good!');
        });

        it('should handle actor and participant with aliases', () => {
            const baseDiagram: Diagram = {
                id: 'test-seq-alias',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.SequenceDiagram,
                selectedElements: [],
                notes: {}
            };

            const content = `sequenceDiagram
    participant A as Alice
    actor B as Bob
    A->>B: message`;

            const result = importMermaidSequenceDiagram(baseDiagram, content) as SequenceDiagramState;
            const lifelines = Object.values(result.lifelines);
            expect(lifelines).toHaveLength(2);
            expect(lifelines.map(l => l.title).sort()).toEqual(['Alice', 'Bob']);
            
            const messages = Object.values(result.messages);
            expect(messages).toHaveLength(1);
            expect(messages[0].text).toBe('message');
        });
    });

    describe('importMermaidStructureDiagram', () => {
        it('should correctly import a flowchart with multiple nodes and links', () => {
            const baseDiagram: Diagram = {
                id: 'test-diagram',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.ClassDiagram,
                selectedElements: [],
                notes: {}
            };

            const flowchart = `flowchart LR
    A[User] --> B[Client App]
    B --> C[Authorization Server]
    C --> D[Login & Consent]
    D --> C
    C --> B
    B --> E[Token Endpoint]
    E --> B
    B --> F[Resource Server]
    F --> B`;

            const result = importMermaidStructureDiagram(baseDiagram, flowchart) as StructureDiagramState & { elements: { [id: string]: any } };

            // Verify basic properties
            expect(result.id).toBe(baseDiagram.id);
            expect(result.type).toBe(ElementType.ClassDiagram);

            // Verify nodes
            const nodeEntries = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            expect(nodeEntries).toHaveLength(6);

            const nodeLabels = nodeEntries.map(n => n.text).sort();
            expect(nodeLabels).toEqual([
                'Authorization Server',
                'Client App',
                'Login & Consent',
                'Resource Server',
                'Token Endpoint',
                'User'
            ]);

            // Map identifiers to node IDs
            const nodesByLabel: { [label: string]: NodeState } = {};
            nodeEntries.forEach(n => {
                nodesByLabel[n.text] = n;
            });

            // Verify links
            const links = Object.values(result.elements).filter(e => e.type === ElementType.ClassLink) as LinkState[];
            expect(links).toHaveLength(9);

            const verifyLink = (fromLabel: string, toLabel: string) => {
                const fromNode = nodesByLabel[fromLabel];
                const toNode = nodesByLabel[toLabel];
                
                const link = links.find(l => {
                    const port1 = result.elements[l.port1] as any;
                    const port2 = result.elements[l.port2] as any;
                    return port1.nodeId === fromNode.id && port2.nodeId === toNode.id;
                });
                
                expect(link).toBeDefined();
            };

            verifyLink('User', 'Client App');
            verifyLink('Client App', 'Authorization Server');
            verifyLink('Authorization Server', 'Login & Consent');
            verifyLink('Login & Consent', 'Authorization Server');
            verifyLink('Authorization Server', 'Client App');
            verifyLink('Client App', 'Token Endpoint');
            verifyLink('Token Endpoint', 'Client App');
            verifyLink('Client App', 'Resource Server');
            verifyLink('Resource Server', 'Client App');
        });

        it('should handle flowchart with arrows that have no explicit labels', () => {
            const baseDiagram: Diagram = {
                id: 'test-diagram',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.ClassDiagram,
                selectedElements: [],
                notes: {}
            };

            const flowchart = `flowchart LR
    A --> B`;

            const result = importMermaidStructureDiagram(baseDiagram, flowchart) as StructureDiagramState & { elements: { [id: string]: any } };
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            expect(nodes).toHaveLength(2);
            expect(nodes.map(n => n.text).sort()).toEqual(['A', 'B']);
        });
    });
});
