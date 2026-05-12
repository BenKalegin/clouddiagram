import { vi } from "vitest";
vi.mock("konva", () => ({}));
vi.mock("react-konva", () => ({}));
vi.mock("react-konva-to-svg", () => ({
    exportStageSVG: vi.fn(),
}));

import {
    detectMermaidDiagramType,
    importMermaidDiagram,
    importMermaidErDiagram,
    importMermaidFlowchartDiagram,
    importMermaidGanttDiagram,
    importMermaidMindMapDiagram,
    importMermaidPieChartDiagram,
    importMermaidStructureDiagram,
    importMermaidSequenceDiagram,
    importMermaidStateDiagram,
    importMermaidDeploymentDiagram,
    mermaidDiagramTypes
} from './mermaidFormat';
import { Diagram } from '../../common/model';
import { StructureDiagramState } from '../structureDiagram/structureDiagramState';
import { SequenceDiagramState } from '../sequenceDiagram/sequenceDiagramModel';
import { NodeState, LinkState, PortState, PortAlignment, RouteStyle, ElementType, FlowchartNodeKind } from '../../package/packageModel';
import { PredefinedSvg } from '../graphics/graphicsReader';
import { Bounds } from '../../common/model';
import { exportGanttDiagramAsMermaid } from './mermaid/mermaidGanttExporter';
import { exportClassDiagramAsMermaid } from './mermaid/mermaidClassExporter';
import { exportErDiagramAsMermaid } from './mermaid/mermaidErExporter';
import { exportPieChartDiagramAsMermaid } from './mermaid/mermaidPieExporter';
import { getClassFieldsText, replaceClassMembersText } from '../classDiagram/classDiagramUtils';

describe('mermaidFormat', () => {
    describe('mermaid diagram type coverage', () => {
        it('recognizes the Mermaid diagram types currently listed by Mermaid docs', () => {
            expect(mermaidDiagramTypes.map(type => type.kind)).toEqual([
                'flowchart',
                'sequence',
                'class',
                'state',
                'er',
                'journey',
                'gantt',
                'pie',
                'quadrant',
                'requirement',
                'gitgraph',
                'c4',
                'mindmap',
                'timeline',
                'zenuml',
                'sankey',
                'xychart',
                'block',
                'packet',
                'kanban',
                'architecture',
                'radar',
                'treemap',
                'venn',
                'ishikawa',
                'treeview'
            ]);

            const declarations = [
                ['flowchart TD', 'flowchart'],
                ['graph LR', 'flowchart'],
                ['sequenceDiagram', 'sequence'],
                ['classDiagram', 'class'],
                ['stateDiagram-v2', 'state'],
                ['erDiagram', 'er'],
                ['journey', 'journey'],
                ['gantt', 'gantt'],
                ['pie title Pets', 'pie'],
                ['quadrantChart', 'quadrant'],
                ['requirementDiagram', 'requirement'],
                ['gitGraph', 'gitgraph'],
                ['C4Context', 'c4'],
                ['mindmap', 'mindmap'],
                ['timeline', 'timeline'],
                ['zenuml', 'zenuml'],
                ['sankey-beta', 'sankey'],
                ['xychart-beta', 'xychart'],
                ['block-beta', 'block'],
                ['packet-beta', 'packet'],
                ['kanban', 'kanban'],
                ['architecture-beta', 'architecture'],
                ['radar-beta', 'radar'],
                ['treemap-beta', 'treemap'],
                ['venn', 'venn'],
                ['ishikawa', 'ishikawa'],
                ['treeview', 'treeview']
            ] as const;

            declarations.forEach(([source, kind]) => {
                expect(detectMermaidDiagramType(source)?.kind).toBe(kind);
            });

            expect(mermaidDiagramTypes.find(type => type.kind === 'er')?.nativeImport).toBe(true);
            expect(mermaidDiagramTypes.find(type => type.kind === 'gantt')?.nativeImport).toBe(true);
            expect(mermaidDiagramTypes.find(type => type.kind === 'pie')?.nativeImport).toBe(true);
            expect(mermaidDiagramTypes.find(type => type.kind === 'state')?.nativeImport).toBe(true);
        });
    });

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

        it('should strip <b>/<i>/<em>/<strong>/<u> formatting tags from node labels', () => {
            const baseDiagram: Diagram = {
                id: 'test-diagram',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.ClassDiagram,
                selectedElements: [],
                notes: {}
            };

            const flowchart = `flowchart LR
    A["<b>Long tail</b><br>~3,000+ transactions"] --> B["<i>italic</i> and <STRONG>strong</STRONG>"]`;

            const result = importMermaidStructureDiagram(baseDiagram, flowchart) as StructureDiagramState & { elements: { [id: string]: any } };
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            expect(nodes.map(n => n.text).sort()).toEqual([
                'Long tail\n~3,000+ transactions',
                'italic and strong'
            ]);
        });

        it('should convert <br> tags in node and edge labels to newlines', () => {
            const baseDiagram: Diagram = {
                id: 'test-diagram',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.ClassDiagram,
                selectedElements: [],
                notes: {}
            };

            const flowchart = `flowchart LR
    A["First line<br>second line"] -->|edge<br/>label| B["mixed<BR />case<br />break"]`;

            const result = importMermaidStructureDiagram(baseDiagram, flowchart) as StructureDiagramState & { elements: { [id: string]: any } };
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            expect(nodes.map(n => n.text).sort()).toEqual(['First line\nsecond line', 'mixed\ncase\nbreak']);

            const links = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink) as LinkState[];
            expect(links).toHaveLength(1);
            expect(links[0].text).toBe('edge\nlabel');
        });

        it('should clear old notes and selected elements on import', () => {
            const baseDiagram: Diagram = {
                id: 'test-diagram',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.ClassDiagram,
                selectedElements: [
                    { id: 'old-element-1', type: ElementType.ClassNode },
                    { id: 'old-element-2', type: ElementType.ClassNode }
                ],
                notes: {
                    'note-1': {
                        id: 'note-1',
                        type: ElementType.Note,
                        text: 'Old note',
                        bounds: { x: 0, y: 0, width: 100, height: 50 },
                        colorSchema: { fillColor: '#fff', strokeColor: '#000' }
                    }
                }
            };

            const flowchart = `flowchart LR
    A --> B`;

            const result = importMermaidStructureDiagram(baseDiagram, flowchart) as StructureDiagramState;
            expect(Object.keys(result.notes)).toHaveLength(0);
            expect(result.selectedElements).toHaveLength(0);
        });

        it('imports Mermaid class fields, methods, and annotations', () => {
            const baseDiagram: Diagram = {
                id: 'test-class-members',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.ClassDiagram,
                selectedElements: [],
                notes: {}
            };

            const classDiagram = `classDiagram
    Animal : +int age
    Animal : +String gender$
    Animal : +isMammal()
    class Duck {
      <<interface>>
      +String beakColor
      +quack() bool
    }
    Animal <|-- Duck`;

            const result = importMermaidStructureDiagram(baseDiagram, classDiagram) as StructureDiagramState & { elements: { [id: string]: any } };
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            const byText = Object.fromEntries(nodes.map(node => [node.text, node]));

            expect(byText.Animal.classMembers).toEqual([
                {kind: 'field', text: '+int age'},
                {kind: 'field', text: '+String gender$'},
                {kind: 'method', text: '+isMammal()'}
            ]);
            expect(byText.Duck.classAnnotation).toBe('interface');
            expect(byText.Duck.classMembers).toEqual([
                {kind: 'field', text: '+String beakColor'},
                {kind: 'method', text: '+quack() bool'}
            ]);
            expect(result.nodes[byText.Animal.id].bounds.height).toBeGreaterThan(60);
        });

        it('exports class fields, methods, and annotations to Mermaid', () => {
            const diagram = importMermaidStructureDiagram({
                id: 'test-class-export',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.ClassDiagram,
                selectedElements: [],
                notes: {}
            }, `classDiagram
    Animal : +int age
    Animal : +isMammal()
    class Duck {
      <<interface>>
      +String beakColor
      +quack()
    }
    Animal <|-- Duck`) as StructureDiagramState & { elements: { [id: string]: any } };

            expect(exportClassDiagramAsMermaid(diagram)).toBe(`classDiagram
    class Animal {
        +int age
        +isMammal()
    }
    class Duck {
        <<interface>>
        +String beakColor
        +quack()
    }
    Animal <|-- Duck
`);
        });

        it('preserves a blank member row while editing fields', () => {
            const classMembers = replaceClassMembersText(undefined, 'field', '+int age\n');
            expect(getClassFieldsText({
                id: 'animal',
                type: ElementType.ClassNode,
                text: 'Animal',
                ports: [],
                colorSchema: {strokeColor: 'black', fillColor: 'white'},
                classMembers
            })).toBe('+int age\n');
        });
    });

    describe('importMermaidFlowchartDiagram', () => {
        it('should import decision branches with one-directional links', () => {
            const baseDiagram: Diagram = {
                id: 'test-flowchart',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.FlowchartDiagram,
                selectedElements: [],
                notes: {}
            };

            const flowchart = `flowchart TD
    Start([Start]) --> Check{Valid?}
    Check -->|Yes| End([End])
    Check <--|No| Retry[/Retry Input/]`;

            const result = importMermaidFlowchartDiagram(baseDiagram, flowchart) as StructureDiagramState & { elements: { [id: string]: any } };
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            const links = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink) as LinkState[];

            expect(result.type).toBe(ElementType.FlowchartDiagram);
            expect(nodes).toHaveLength(4);

            const byLabel: Record<string, NodeState> = {};
            nodes.forEach(n => {
                byLabel[n.text] = n;
            });

            expect(byLabel['Valid?'].flowchartKind).toBe('decision');

            const hasLink = (fromLabel: string, toLabel: string, text?: string) =>
                links.some(l => {
                    const p1 = result.elements[l.port1] as any;
                    const p2 = result.elements[l.port2] as any;
                    const fromNode = byLabel[fromLabel];
                    const toNode = byLabel[toLabel];
                    return p1.nodeId === fromNode.id
                        && p2.nodeId === toNode.id
                        && (!text || l.text === text);
                });

            expect(hasLink('Start', 'Valid?')).toBe(true);
            expect(hasLink('Valid?', 'End', 'Yes')).toBe(true);
            // Reverse arrow in Mermaid must still become a one-directional source->target link.
            expect(hasLink('Retry Input', 'Valid?', 'No')).toBe(true);
            expect(links.every(l => l.tipStyle1 === 'none' && l.tipStyle2 === 'arrow')).toBe(true);
        });

        it('should import basic C4 nodes and relationships', () => {
            const baseDiagram: Diagram = {
                id: 'test-c4-flowchart',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.FlowchartDiagram,
                selectedElements: [],
                notes: {}
            };

            const c4 = `flowchart LR
    Person(user, "User")
    System(core, "Core System")
    Container(web, "Web App")
    Component(api, "API")
    Rel(user, web, "Uses")
    Rel(web, api, "Calls")
    Rel(api, core, "Reads")`;

            const result = importMermaidFlowchartDiagram(baseDiagram, c4) as StructureDiagramState & { elements: { [id: string]: any } };
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            const links = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink) as LinkState[];

            const byLabel: Record<string, NodeState> = {};
            nodes.forEach(n => {
                byLabel[n.text] = n;
            });

            expect(byLabel['User'].flowchartKind).toBe('c4-person');
            expect(byLabel['Core System'].flowchartKind).toBe('c4-system');
            expect(byLabel['Web App'].flowchartKind).toBe('c4-container');
            expect(byLabel['API'].flowchartKind).toBe('c4-component');
            expect(links.map(l => l.text).sort()).toEqual(['Calls', 'Reads', 'Uses']);
        });
    });

    describe('importMermaidGanttDiagram', () => {
        it('imports sections, tasks, durations, and after dependencies as editable bars', () => {
            const baseDiagram: Diagram = {
                id: 'test-gantt',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.GanttDiagram,
                selectedElements: [],
                notes: {}
            };

            const gantt = `gantt
    title Release Plan
    dateFormat YYYY-MM-DD
    section Discovery
    Research :done, research, 2026-01-01, 3d
    Prototype :active, proto, after research, 4d
    section Delivery
    Launch :crit, launch, after proto, 2d`;

            const result = importMermaidGanttDiagram(baseDiagram, gantt) as StructureDiagramState & { elements: { [id: string]: any } };
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            const links = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink) as LinkState[];
            const notes = Object.values(result.notes);

            expect(result.type).toBe(ElementType.GanttDiagram);
            expect(result.title).toBe('Release Plan');
            expect(nodes).toHaveLength(3);
            expect(nodes.map(node => node.text.split('\n')[0]).sort()).toEqual(['Launch', 'Prototype', 'Research']);
            expect(nodes.map(node => node.ganttTask?.label).sort()).toEqual(['Launch', 'Prototype', 'Research']);
            expect(links).toHaveLength(2);
            expect(notes.map(note => note.text)).toEqual(expect.arrayContaining(['Discovery', 'Delivery']));
            expect((result as any).gantt).toEqual({dateFormat: 'YYYY-MM-DD', chartStart: '2026-01-01'});

            const byText = Object.fromEntries(nodes.map(node => [node.text.split('\n')[0], node]));
            expect(byText.Research.ganttTask).toEqual({
                taskId: 'research',
                label: 'Research',
                section: 'Discovery',
                start: '2026-01-01',
                end: '2026-01-04',
                status: 'done'
            });
            expect(byText.Prototype.ganttTask?.start).toBe('2026-01-05');
            expect(byText.Launch.ganttTask?.start).toBe('2026-01-10');
            expect(byText.Research.colorSchema.fillColor).toBe('#D1FADF');
            expect(byText.Prototype.colorSchema.fillColor).toBe('#D1E9FF');
            expect(byText.Launch.colorSchema.fillColor).toBe('#FEE4E2');
            expect(result.nodes[byText.Research.id].bounds.x).toBe(220);
            expect(links.every(link => link.ganttDependency)).toBe(true);
        });

        it('routes generic Mermaid import to native Gantt import', () => {
            const baseDiagram: Diagram = {
                id: 'test-gantt-generic',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.GanttDiagram,
                selectedElements: [],
                notes: {}
            };

            const result = importMermaidDiagram(baseDiagram, `gantt
    Task :task, 2026-01-01, 1d`) as StructureDiagramState & { elements: { [id: string]: any } };

            expect(result.type).toBe(ElementType.GanttDiagram);
            expect(Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode)).toHaveLength(1);
        });

        it('resolves dependencies regardless of declaration order', () => {
            const baseDiagram: Diagram = {
                id: 'test-gantt-order',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.GanttDiagram,
                selectedElements: [],
                notes: {}
            };

            const result = importMermaidGanttDiagram(baseDiagram, `gantt
    dateFormat YYYY-MM-DD
    Dependent :a, after b, 2d
    Source :b, 2026-01-10, 1d`) as StructureDiagramState & { elements: { [id: string]: any } };

            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            const byText = Object.fromEntries(nodes.map(node => [node.text.split('\n')[0], node]));

            expect(byText.Source.text).toContain('2026-01-10 - 2026-01-11');
            expect(byText.Dependent.text).toContain('2026-01-12 - 2026-01-14');
            expect(byText.Dependent.ganttTask?.start).toBe('2026-01-12');
            expect(byText.Dependent.ganttTask?.end).toBe('2026-01-14');
            expect(result.nodes[byText.Source.id].bounds.x).toBe(220);
            expect(result.nodes[byText.Dependent.id].bounds.x).toBe(256);
        });

        it('exports editable Gantt tasks back to Mermaid', () => {
            const baseDiagram: Diagram = {
                id: 'test-gantt-export',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.GanttDiagram,
                selectedElements: [],
                notes: {}
            };

            const result = importMermaidGanttDiagram(baseDiagram, `gantt
    title Release Plan
    dateFormat YYYY-MM-DD
    section Discovery
    Research :done, research, 2026-01-01, 3d
    Prototype :active, proto, after research, 4d`) as StructureDiagramState & { elements: { [id: string]: any } };

            expect(exportGanttDiagramAsMermaid(result)).toBe(`gantt
    title Release Plan
    dateFormat YYYY-MM-DD
    section Discovery
    Research :done, research, 2026-01-01, 2026-01-04
    Prototype :active, proto, after research, 4d
`);
        });
    });

    describe('importMermaidErDiagram', () => {
        it('imports entities, aliases, attributes, cardinalities, and identifying links', () => {
            const baseDiagram: Diagram = {
                id: 'test-er',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.ErDiagram,
                selectedElements: [],
                notes: {}
            };

            const erDiagram = `erDiagram
    direction LR
    CUSTOMER["Customer"] ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    CUSTOMER }|..|{ DELIVERY_ADDRESS : uses
    CUSTOMER {
        string name PK "Customer name"
        string email UK
    }
    ORDER {
        int id PK
    }`;

            const result = importMermaidErDiagram(baseDiagram, erDiagram) as StructureDiagramState & { elements: { [id: string]: any }, er: { direction: string } };
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            const links = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink) as LinkState[];
            const byEntity = Object.fromEntries(nodes.map(node => [node.erEntity?.entityId, node]));

            expect(result.type).toBe(ElementType.ErDiagram);
            expect(result.er.direction).toBe('LR');
            expect(nodes).toHaveLength(4);
            expect(byEntity.CUSTOMER.text).toBe('Customer');
            expect(byEntity.CUSTOMER.erEntity?.attributes).toEqual([
                {type: 'string', name: 'name', keys: 'PK', comment: 'Customer name'},
                {type: 'string', name: 'email', keys: 'UK', comment: undefined}
            ]);
            expect(result.nodes[byEntity.CUSTOMER.id].bounds.height).toBeGreaterThan(76);

            const relationships = links.map(link => link.erRelationship);
            expect(relationships).toEqual(expect.arrayContaining([
                {sourceCardinality: '||', targetCardinality: '}o', identifying: true, label: 'places'},
                {sourceCardinality: '||', targetCardinality: '}|', identifying: true, label: 'contains'},
                {sourceCardinality: '}|', targetCardinality: '}|', identifying: false, label: 'uses'}
            ]));
        });

        it('routes generic Mermaid import to native ER import', () => {
            const baseDiagram: Diagram = {
                id: 'test-er-generic',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.ErDiagram,
                selectedElements: [],
                notes: {}
            };

            const result = importMermaidDiagram(baseDiagram, `erDiagram
    CUSTOMER ||--o{ ORDER : places`) as StructureDiagramState & { elements: { [id: string]: any } };

            expect(result.type).toBe(ElementType.ErDiagram);
            expect(Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode)).toHaveLength(2);
            expect(Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink)).toHaveLength(1);
        });

        it('exports editable ER diagrams back to Mermaid', () => {
            const baseDiagram: Diagram = {
                id: 'test-er-export',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.ErDiagram,
                selectedElements: [],
                notes: {}
            };

            const result = importMermaidErDiagram(baseDiagram, `erDiagram
    direction LR
    CUSTOMER["Customer"] ||--o{ ORDER : places
    CUSTOMER {
        string name PK "Customer name"
        string email UK
    }
    ORDER {
        int id PK
    }`) as StructureDiagramState & { elements: { [id: string]: any } };

            expect(exportErDiagramAsMermaid(result)).toBe(`erDiagram
    direction LR
    CUSTOMER["Customer"] {
        string name PK "Customer name"
        string email UK
    }
    ORDER {
        int id PK
    }
    CUSTOMER ||--o{ ORDER : places
`);
        });
    });

    describe('importMermaidPieChartDiagram', () => {
        it('imports showData, title, and positive quoted slices', () => {
            const baseDiagram: Diagram = {
                id: 'test-pie',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.PieChartDiagram,
                selectedElements: [],
                notes: {}
            };

            const pieChart = `pie showData
    title Key elements in Product X
    "Calcium" : 42.96
    "Potassium" : 50.05
    "Magnesium" : 10.01
    "Iron" : 5`;

            const result = importMermaidPieChartDiagram(baseDiagram, pieChart) as any;

            expect(result.type).toBe(ElementType.PieChartDiagram);
            expect(result.title).toBe('Key elements in Product X');
            expect(result.pie.showData).toBe(true);
            expect(result.pie.textPosition).toBe(0.75);
            expect(result.pie.slices).toEqual([
                {label: 'Calcium', value: 42.96},
                {label: 'Potassium', value: 50.05},
                {label: 'Magnesium', value: 10.01},
                {label: 'Iron', value: 5}
            ]);
        });

        it('imports inline title syntax and routes generic Mermaid import to native pie import', () => {
            const baseDiagram: Diagram = {
                id: 'test-pie-inline',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.PieChartDiagram,
                selectedElements: [],
                notes: {}
            };

            const result = importMermaidDiagram(baseDiagram, `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85`) as any;

            expect(result.type).toBe(ElementType.PieChartDiagram);
            expect(result.title).toBe('Pets adopted by volunteers');
            expect(result.pie.showData).toBe(false);
            expect(result.pie.slices).toEqual([
                {label: 'Dogs', value: 386},
                {label: 'Cats', value: 85}
            ]);
        });

        it('exports editable pie charts back to Mermaid', () => {
            const baseDiagram: Diagram = {
                id: 'test-pie-export',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
                type: ElementType.PieChartDiagram,
                selectedElements: [],
                notes: {}
            };

            const result = importMermaidPieChartDiagram(baseDiagram, `pie showData
    title Key elements in Product X
    "Calcium" : 42.96
    "Potassium" : 50.05`) as any;

            expect(exportPieChartDiagramAsMermaid(result)).toBe(`pie showData
    title Key elements in Product X
    "Calcium" : 42.96
    "Potassium" : 50.05
`);
        });
    });
});

describe('importMermaidStructureDiagram - nested subgraph cluster layout', () => {
    // Generic media-processing platform with flat subgraphs (Clients, AppLayer, Functions)
    // and two-level nesting (Tables and Queues inside AWSLayer). graph TD = top-to-bottom.
    const mermaidContent = String.raw`graph TD
    subgraph Clients["Client Applications"]
        Web["Web App"]
        Mobile["Mobile App"]
        Partners["Partner API"]
    end

    LB["API Gateway / Load Balancer"]

    subgraph AppLayer["Application Services"]
        Api["REST API Server"]
        Worker["Background Worker"]
        Frontend["Static Frontend"]
    end

    subgraph AWSLayer["AWS Services"]
        Events["Kinesis\n(event stream)"]
        Files["S3"]
        subgraph Tables["DynamoDB Tables"]
            ScansTable["media-scan-results\n(scan jobs)"]
            JobsTable["print-jobs-table\n(FIFO ordering)"]
        end
        subgraph Queues["SQS Queues"]
            QScan["media.scan.queue\nStandard"]
            QEmail["email.delivery.queue\nStandard"]
            QText["text.extraction.queue\nStandard"]
            QConvert["file.conversion.queue\nStandard"]
            QAudit["audit.collection.queue\nStandard"]
            QBatch["batch.export.queues\n(Standard x4)\n• batch.small.queue\nbatch.large.queue"]
        end
    end

    subgraph Functions["Lambda Functions"]
        SearchFn["Search Indexer"]
        EmailFn["Email Sender"]
        ScanFn["Media Scanner"]
        TextFn["Text Extractor"]
        ConvertFn["File Converter"]
    end

    DB[("Database\n(PostgreSQL / MySQL)")]

    Clients --> LB
    LB --> Api & Worker & Frontend
    Api --> Events & Files
    Api --> ScansTable & JobsTable
    Api --> QScan & QEmail & QText & QConvert & QAudit
    Worker --> QConvert & QEmail
    Worker --> JobsTable
    Files --> QScan
    QScan --> ScanFn
    QEmail --> EmailFn
    QText --> TextFn
    QConvert --> ConvertFn
    Events --> SearchFn
    ScanFn --> ScansTable
    ScanFn --> Files
    SearchFn & EmailFn --> DB
    Api --> DB`;

    type TestResult = StructureDiagramState & { elements: { [id: string]: any } };

    const result = importMermaidStructureDiagram({
        id: 'test-nested-subgraph-layout',
        display: { width: 2000, height: 2000, scale: 1, offset: { x: 0, y: 0 } },
        type: ElementType.FlowchartDiagram,
        selectedElements: [],
        notes: {}
    }, mermaidContent) as TestResult;

    function getNodeBounds(textPrefix: string) {
        const entry = Object.entries(result.elements).find(
            ([, e]) => (e as NodeState).type === ElementType.ClassNode && (e as NodeState).text.startsWith(textPrefix)
        );
        if (!entry) throw new Error(`Node not found with text prefix: "${textPrefix}"`);
        return result.nodes[entry[0]].bounds;
    }

    function isContainedIn(
        inner: { x: number; y: number; width: number; height: number },
        outer: { x: number; y: number; width: number; height: number },
        tolerance = 5
    ): boolean {
        return inner.x >= outer.x - tolerance
            && inner.y >= outer.y - tolerance
            && inner.x + inner.width <= outer.x + outer.width + tolerance
            && inner.y + inner.height <= outer.y + outer.height + tolerance;
    }

    it('creates all expected nodes', () => {
        const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
        // 3 Clients + 1 LB + 3 AppLayer + 2 AWS-direct + 2 Tables + 6 Queues + 5 Functions + 1 DB = 23
        expect(nodes.length).toBeGreaterThanOrEqual(23);
        const labels = nodes.map(n => n.text.split('\n')[0]);
        expect(labels).toContain('Web App');
        expect(labels).toContain('API Gateway / Load Balancer');
        expect(labels).toContain('REST API Server');
        expect(labels).toContain('S3');
        expect(labels).toContain('media-scan-results');
        expect(labels).toContain('media.scan.queue');
        expect(labels).toContain('Search Indexer');
    });

    it('creates cluster objects for all 6 subgraphs with correct labels', () => {
        const clusterElements = Object.values(result.elements as Record<string, any>)
            .filter(e => e.type === ElementType.Cluster);
        expect(clusterElements).toHaveLength(6);
        expect((result.elements['Clients'] as any)?.text).toBe('Client Applications');
        expect((result.elements['AppLayer'] as any)?.text).toBe('Application Services');
        expect((result.elements['AWSLayer'] as any)?.text).toBe('AWS Services');
        expect((result.elements['Functions'] as any)?.text).toBe('Lambda Functions');
        expect((result.elements['Tables'] as any)?.text).toBe('DynamoDB Tables');
        expect((result.elements['Queues'] as any)?.text).toBe('SQS Queues');
    });

    it('Clients cluster bounds contain all three client nodes', () => {
        const cb = result.nodes['Clients'].bounds;
        expect(isContainedIn(getNodeBounds('Web App'), cb)).toBe(true);
        expect(isContainedIn(getNodeBounds('Mobile App'), cb)).toBe(true);
        expect(isContainedIn(getNodeBounds('Partner API'), cb)).toBe(true);
    });

    it('AppLayer cluster bounds contain Api, Worker, and Frontend nodes', () => {
        const cb = result.nodes['AppLayer'].bounds;
        expect(isContainedIn(getNodeBounds('REST API Server'), cb)).toBe(true);
        expect(isContainedIn(getNodeBounds('Background Worker'), cb)).toBe(true);
        expect(isContainedIn(getNodeBounds('Static Frontend'), cb)).toBe(true);
    });

    it('AWSLayer cluster bounds contain Kinesis and S3 nodes', () => {
        const cb = result.nodes['AWSLayer'].bounds;
        expect(isContainedIn(getNodeBounds('Kinesis'), cb)).toBe(true);
        expect(isContainedIn(getNodeBounds('S3'), cb)).toBe(true);
    });

    it('Tables cluster is nested inside AWSLayer cluster bounds', () => {
        const aws = result.nodes['AWSLayer'].bounds;
        const tables = result.nodes['Tables'].bounds;
        expect(isContainedIn(tables, aws)).toBe(true);
    });

    it('Queues cluster is nested inside AWSLayer cluster bounds', () => {
        const aws = result.nodes['AWSLayer'].bounds;
        const queues = result.nodes['Queues'].bounds;
        expect(isContainedIn(queues, aws)).toBe(true);
    });

    it('Tables cluster bounds contain ScansTable and JobsTable nodes', () => {
        const cb = result.nodes['Tables'].bounds;
        expect(isContainedIn(getNodeBounds('media-scan-results'), cb)).toBe(true);
        expect(isContainedIn(getNodeBounds('print-jobs-table'), cb)).toBe(true);
    });

    it('Queues cluster bounds contain all five standard queue nodes', () => {
        const cb = result.nodes['Queues'].bounds;
        for (const prefix of [
            'media.scan.queue',
            'email.delivery.queue',
            'text.extraction.queue',
            'file.conversion.queue',
            'audit.collection.queue'
        ]) {
            expect(isContainedIn(getNodeBounds(prefix), cb), `${prefix} should be within Queues`).toBe(true);
        }
    });

    it('Functions cluster bounds contain all five lambda nodes', () => {
        const cb = result.nodes['Functions'].bounds;
        for (const label of ['Search Indexer', 'Email Sender', 'Media Scanner', 'Text Extractor', 'File Converter']) {
            expect(isContainedIn(getNodeBounds(label), cb), `${label} should be within Functions`).toBe(true);
        }
    });

    it('layout flows top-to-bottom: Clients above AppLayer, AppLayer above AWSLayer, AWSLayer above Functions', () => {
        const c = result.nodes;
        const clientsBottom = c['Clients'].bounds.y + c['Clients'].bounds.height;
        const appTop = c['AppLayer'].bounds.y;
        const appBottom = c['AppLayer'].bounds.y + c['AppLayer'].bounds.height;
        const awsTop = c['AWSLayer'].bounds.y;
        const awsBottom = c['AWSLayer'].bounds.y + c['AWSLayer'].bounds.height;
        const fnTop = c['Functions'].bounds.y;

        expect(clientsBottom).toBeLessThan(appTop + 50);
        expect(appBottom).toBeLessThan(awsTop + 50);
        expect(awsBottom).toBeLessThan(fnTop + 50);
    });

    it('LB node sits vertically between Clients and AppLayer clusters', () => {
        const lbBounds = getNodeBounds('API Gateway / Load Balancer');
        const clientsBottom = result.nodes['Clients'].bounds.y + result.nodes['Clients'].bounds.height;
        const appTop = result.nodes['AppLayer'].bounds.y;

        expect(lbBounds.y + lbBounds.height).toBeGreaterThan(clientsBottom - 50);
        expect(lbBounds.y).toBeLessThan(appTop + 50);
    });

    it('AppLayer width is not excessively wider than Clients (both have 3 nodes)', () => {
        const clients = result.nodes['Clients'].bounds;
        const app = result.nodes['AppLayer'].bounds;
        // AppLayer inflates because Api fans out to many targets in AWSLayer — fundamental dagre limitation.
        expect(app.width).toBeLessThan(clients.width * 4);
    });

    it('AWSLayer cluster bounds contain Kinesis (not pushed outside by wide Queues cluster)', () => {
        const aws = result.nodes['AWSLayer'].bounds;
        const kinesis = getNodeBounds('Kinesis');
        expect(kinesis.x).toBeGreaterThan(aws.x - 5);
        expect(kinesis.x + kinesis.width).toBeLessThan(aws.x + aws.width + 5);
    });
});

describe('importMermaidStructureDiagram - node declared in subgraph after edge reference', () => {
    // If a node is first created via an edge (outside any subgraph) and then
    // declared inside a subgraph, it must still receive the correct parent.
    const mermaidContent = `graph TD
    Outside[Standalone]
    Outside --> Inner
    subgraph Cluster["My Cluster"]
        Inner["Inner Node"]
    end`;

    it('node referenced in edge before subgraph declaration is contained in cluster', () => {
        const result = importMermaidStructureDiagram({
            id: 'test-late-parent',
            display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
            type: ElementType.FlowchartDiagram,
            selectedElements: [],
            notes: {}
        }, mermaidContent) as StructureDiagramState & { elements: any };

        expect(result.nodes['Cluster']).toBeDefined();
        const clusterBounds = result.nodes['Cluster'].bounds;
        const innerEntry = Object.entries(result.elements).find(
            ([, e]: any) => e.type === ElementType.ClassNode && e.text === 'Inner Node'
        );
        expect(innerEntry).toBeDefined();
        const innerBounds = result.nodes[innerEntry![0]].bounds;
        const isContained = innerBounds.x >= clusterBounds.x - 5
            && innerBounds.y >= clusterBounds.y - 5
            && innerBounds.x + innerBounds.width <= clusterBounds.x + clusterBounds.width + 5
            && innerBounds.y + innerBounds.height <= clusterBounds.y + clusterBounds.height + 5;
        expect(isContained).toBe(true);
    });
});

describe('importMermaidStructureDiagram - classDiagram with x-axonize frontmatter and link routing', () => {
    const mermaidContent = `---
x-axonize:
  version: 1
  editor: clouddiagram
  layout:
    nodes:
      User: { x: 100, y: 100, width: 140, height: 90 }
      Order: { x: 300, y: 100, width: 140, height: 108 }
      PaymentService: { x: 500, y: 100, width: 140, height: 78 }
      Inventory: { x: 700, y: 100, width: 140, height: 78 }
    spacing:
      User-Order: 260
      Order-PaymentService: 300
  presentation:
    steps:
      - highlight: [User]
      - highlight: [User, Order]
      - highlight: [Order, PaymentService, Inventory]
---
classDiagram
direction TB
class User {
  +string id
  +placeOrder()
}
class Order {
  +string id
  +decimal total
  +submit()
}
class PaymentService {
  +authorize(orderId)
  +capture(orderId)
}
class Inventory {
  +reserve(orderId)
  +release(orderId)
}
User --> Order : places
Order --> PaymentService : charges
Order --> Inventory : reserves`;

    type TestResult = StructureDiagramState & { elements: { [id: string]: any } };

    const result = importMermaidStructureDiagram({
        id: 'test-class-routing',
        display: { width: 1200, height: 800, scale: 1, offset: { x: 0, y: 0 } },
        type: ElementType.ClassDiagram,
        selectedElements: [],
        notes: {}
    }, mermaidContent) as TestResult;

    function nodeById(text: string): [id: string, node: NodeState] {
        const entry = Object.entries(result.elements).find(
            ([, e]) => (e as NodeState).type === ElementType.ClassNode && (e as NodeState).text === text
        );
        if (!entry) throw new Error(`Node not found: "${text}"`);
        return [entry[0], entry[1] as NodeState];
    }

    it('imports 4 class nodes with correct names', () => {
        const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
        expect(nodes).toHaveLength(4);
        expect(nodes.map(n => n.text).sort()).toEqual(['Inventory', 'Order', 'PaymentService', 'User']);
    });

    it('strips markdown code fence wrapper without leaking YAML as nodes', () => {
        // When pasted from a chat message the content arrives wrapped in ```mermaid ... ```.
        // The opening fence must not block frontmatter detection (hasSeenContent stays false).
        const fenced = `\`\`\`mermaid\n${mermaidContent}\n\`\`\``;
        const r = importMermaidStructureDiagram({
            id: 'test-fenced',
            display: { width: 1200, height: 800, scale: 1, offset: { x: 0, y: 0 } },
            type: ElementType.ClassDiagram,
            selectedElements: [],
            notes: {}
        }, fenced) as StructureDiagramState & { elements: { [id: string]: any } };
        const nodes = Object.values(r.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
        expect(nodes).toHaveLength(4);
        expect(nodes.map(n => n.text).sort()).toEqual(['Inventory', 'Order', 'PaymentService', 'User']);
        // No YAML keys (version, editor, User-Order…) should appear as nodes
        expect(nodes.some(n => n.text === 'version')).toBe(false);
        expect(nodes.some(n => n.text === 'editor')).toBe(false);
        // YAML braces must not appear as class members
        const userNode = nodes.find(n => n.text === 'User')!;
        expect(userNode.classMembers?.every(m => !m.text.startsWith('{'))).toBe(true);
    });

    it('imports User class members', () => {
        const [, user] = nodeById('User');
        expect(user.classMembers).toEqual([
            { kind: 'field', text: '+string id' },
            { kind: 'method', text: '+placeOrder()' }
        ]);
    });

    it('imports Order class members', () => {
        const [, order] = nodeById('Order');
        expect(order.classMembers).toEqual([
            { kind: 'field', text: '+string id' },
            { kind: 'field', text: '+decimal total' },
            { kind: 'method', text: '+submit()' }
        ]);
    });

    it('imports PaymentService class members', () => {
        const [, ps] = nodeById('PaymentService');
        expect(ps.classMembers).toEqual([
            { kind: 'method', text: '+authorize(orderId)' },
            { kind: 'method', text: '+capture(orderId)' }
        ]);
    });

    it('imports Inventory class members', () => {
        const [, inv] = nodeById('Inventory');
        expect(inv.classMembers).toEqual([
            { kind: 'method', text: '+reserve(orderId)' },
            { kind: 'method', text: '+release(orderId)' }
        ]);
    });

    it('imports 3 links with correct labels', () => {
        const links = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink) as LinkState[];
        expect(links).toHaveLength(3);
        expect(links.map(l => l.text).sort()).toEqual(['charges', 'places', 'reserves']);
    });

    it('link route style is OrthogonalRounded for class diagram', () => {
        const links = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink) as LinkState[];
        for (const link of links) {
            expect(link.routeStyle).toBe(RouteStyle.OrthogonalRounded);
        }
    });

    it('all source ports (port1) are Bottom-aligned for TB class diagram', () => {
        const links = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink) as LinkState[];
        for (const link of links) {
            expect(result.ports[link.port1].alignment).toBe(PortAlignment.Bottom);
        }
    });

    it('all target ports (port2) are Top-aligned for TB class diagram', () => {
        const links = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink) as LinkState[];
        for (const link of links) {
            expect(result.ports[link.port2].alignment).toBe(PortAlignment.Top);
        }
    });

    describe('link path geometry using auto-layout node positions', () => {
        // Port center formulas (depthRatio=50, longitude=10, latitude=10, edgePosRatio=50):
        //   Bottom port center = (node.x + node.width/2,  node.y + node.height)
        //   Top    port center = (node.x + node.width/2,  node.y)
        function bottomPortCenter(nodeId: string) {
            const b = result.nodes[nodeId].bounds;
            return { x: b.x + b.width / 2, y: b.y + b.height };
        }

        function topPortCenter(nodeId: string) {
            const b = result.nodes[nodeId].bounds;
            return { x: b.x + b.width / 2, y: b.y };
        }

        // Returns true if the open line segment (excluding t≈0 and t≈1 endpoints)
        // passes strictly through the interior of the rectangle (shrunk by margin).
        function segmentCrossesRect(
            x1: number, y1: number, x2: number, y2: number,
            rect: Bounds,
            margin = 3
        ): boolean {
            const left = rect.x + margin;
            const right = rect.x + rect.width - margin;
            const top = rect.y + margin;
            const bottom = rect.y + rect.height - margin;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const candidates = [
                Math.abs(dx) > 1e-6 ? (left - x1) / dx : NaN,
                Math.abs(dx) > 1e-6 ? (right - x1) / dx : NaN,
                Math.abs(dy) > 1e-6 ? (top - y1) / dy : NaN,
                Math.abs(dy) > 1e-6 ? (bottom - y1) / dy : NaN,
            ];
            for (const t of candidates) {
                if (!isNaN(t) && t > 0.02 && t < 0.98) {
                    const px = x1 + t * dx;
                    const py = y1 + t * dy;
                    if (px >= left && px <= right && py >= top && py <= bottom) return true;
                }
            }
            return false;
        }

        it('source port of each link is at the bottom-center of its node', () => {
            const links = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink) as LinkState[];
            for (const link of links) {
                const srcPort = result.elements[link.port1] as PortState;
                const nodeBounds = result.nodes[srcPort.nodeId].bounds;
                const srcCenter = bottomPortCenter(srcPort.nodeId);
                expect(srcCenter.x).toBeCloseTo(nodeBounds.x + nodeBounds.width / 2, 1);
                expect(srcCenter.y).toBeCloseTo(nodeBounds.y + nodeBounds.height, 1);
            }
        });

        it('target port of each link is at the top-center of its node', () => {
            const links = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink) as LinkState[];
            for (const link of links) {
                const tgtPort = result.elements[link.port2] as PortState;
                const nodeBounds = result.nodes[tgtPort.nodeId].bounds;
                const tgtCenter = topPortCenter(tgtPort.nodeId);
                expect(tgtCenter.x).toBeCloseTo(nodeBounds.x + nodeBounds.width / 2, 1);
                expect(tgtCenter.y).toBeCloseTo(nodeBounds.y, 1);
            }
        });

        it('bottom-to-top link path does not cross through any intermediate node', () => {
            // With TB auto-layout, dagre places nodes so edges don't cross each other.
            // A straight segment from source bottom-center to target top-center should
            // therefore not pierce any third node's bounding box.
            const links = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink) as LinkState[];
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];

            for (const link of links) {
                const srcPort = result.elements[link.port1] as PortState;
                const tgtPort = result.elements[link.port2] as PortState;
                const src = bottomPortCenter(srcPort.nodeId);
                const tgt = topPortCenter(tgtPort.nodeId);

                for (const node of nodes) {
                    if (node.id === srcPort.nodeId || node.id === tgtPort.nodeId) continue;
                    const nb = result.nodes[node.id].bounds;
                    expect(
                        segmentCrossesRect(src.x, src.y, tgt.x, tgt.y, nb),
                        `Link "${link.text}" (${Math.round(src.x)},${Math.round(src.y)})→` +
                        `(${Math.round(tgt.x)},${Math.round(tgt.y)}) must not cross ` +
                        `"${node.text}" bounds (x=${Math.round(nb.x)},y=${Math.round(nb.y)},` +
                        `w=${Math.round(nb.width)},h=${Math.round(nb.height)})`
                    ).toBe(false);
                }
            }
        });
    });

    describe('importMermaidDeploymentDiagram', () => {
        const baseDiagram: Diagram = {
            id: 'test-deploy',
            display: {width: 1000, height: 1000, scale: 1, offset: {x: 0, y: 0}},
            type: ElementType.FlowchartDiagram,
            selectedElements: [],
            notes: {}
        };

        it('falls back to FlowchartDiagram when no AWS services are recognized', () => {
            const content = `graph TD
    A[Start] --> B[Process]
    B --> C[End]`;
            const result = importMermaidDeploymentDiagram(baseDiagram, content);
            expect(result.type).toBe(ElementType.FlowchartDiagram);
        });

        it('produces DeploymentDiagram when AWS services are detected', () => {
            const content = `graph TD
    ELB[Load Balancer] --> Lambda[Lambda]
    Lambda --> SQS[SQS Queue]`;
            const result = importMermaidDeploymentDiagram(baseDiagram, content);
            expect(result.type).toBe(ElementType.DeploymentDiagram);
        });

        it('assigns icons to recognized nodes', () => {
            const content = `graph TD
    LB[ELB] --> Fn[Lambda]
    Fn --> Q[SQS]
    Fn --> DB[DynamoDB]`;
            const result = importMermaidDeploymentDiagram(baseDiagram, content) as any;
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            const icons = nodes.map(n => n.customShape?.pictureId).filter(Boolean);
            expect(icons).toContain(PredefinedSvg.ELB);
            expect(icons).toContain(PredefinedSvg.Lambda);
            expect(icons).toContain(PredefinedSvg.SQS);
            expect(icons).toContain(PredefinedSvg.DynamoDB);
        });

        it('uses parent subgraph context to assign icons to children', () => {
            const content = `graph TD
    subgraph SQSQueues["SQS Queues"]
        QV["virus.scan.queue"]
        QE["distribution.email.queue"]
    end`;
            const result = importMermaidDeploymentDiagram(baseDiagram, content) as any;
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            const queueNodes = nodes.filter(n => n.text?.includes('queue'));
            expect(queueNodes.length).toBeGreaterThanOrEqual(2);
            queueNodes.forEach(n => expect(n.customShape?.pictureId).toBe(PredefinedSvg.SQS));
        });

        it('inherits lambda icon to all children of Lambda layer', () => {
            const content = `graph TD
    subgraph LambdaLayer["Lambda Functions"]
        SL["Search Integration"]
        EL["Email Integration"]
        VL["Virus Scan"]
    end`;
            const result = importMermaidDeploymentDiagram(baseDiagram, content) as any;
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            nodes.forEach(n => expect(n.customShape?.pictureId).toBe(PredefinedSvg.Lambda));
        });

        it('detects icons in a nested AWS architecture', () => {
            const content = `graph TD
    subgraph AppLayer["Application Services"]
        Api["REST API"]
    end
    subgraph AWSLayer["AWS Services"]
        Events["Kinesis"]
        Files["S3"]
        subgraph Tables["DynamoDB Tables"]
            ScansTable["media-scan-results"]
        end
        subgraph Queues["SQS Queues"]
            QScan["media.scan.queue"]
        end
    end
    subgraph Functions["Lambda Functions"]
        ScanFn["Media Scanner"]
    end
    Api --> Events & Files
    Api --> QScan`;

            const result = importMermaidDeploymentDiagram(baseDiagram, content) as any;
            expect(result.type).toBe(ElementType.DeploymentDiagram);

            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            const byText = new Map(nodes.map(n => [n.text, n.customShape?.pictureId]));

            expect(byText.get('Kinesis')).toBe(PredefinedSvg.Kinesis);
            expect(byText.get('S3')).toBe(PredefinedSvg.S3);
            expect(byText.get('media-scan-results')).toBe(PredefinedSvg.DynamoDB);
            expect(byText.get('media.scan.queue')).toBe(PredefinedSvg.SQS);
            expect(byText.get('Media Scanner')).toBe(PredefinedSvg.Lambda);
        });

        it('stores icon assignments in mermaidHints for frontmatter round-trip', () => {
            const content = `graph TD
    LB["API Gateway / Load Balancer"] --> Lambda["Lambda Function"]
    Lambda --> Q["SQS Queue"]
    Lambda --> DB["DynamoDB Table"]
    Lambda --> Store["S3"]`;

            const result = importMermaidDeploymentDiagram(baseDiagram, content) as any;
            expect(result.mermaidHints?.nodes).toBeDefined();
            const hints = result.mermaidHints.nodes as Record<string, { icon: string }>;
            expect(hints['LB']).toEqual({ icon: 'apigateway' });
            expect(hints['Lambda']).toEqual({ icon: 'lambda' });
            expect(hints['Q']).toEqual({ icon: 'sqs' });
            expect(hints['DB']).toEqual({ icon: 'dynamodb' });
            expect(hints['Store']).toEqual({ icon: 's3' });
        });

        it('routes graph/flowchart declarations through deployment importer', () => {
            const content = `flowchart LR
    LB[ELB] --> App[App]
    App --> DB[DynamoDB]`;
            const result = importMermaidDiagram(baseDiagram, content);
            expect(result.type).toBe(ElementType.DeploymentDiagram);
        });

        it('detects extended AWS services (ECR, KMS, Secrets Manager, SNS, X-Ray, CloudWatch, EventBridge)', () => {
            const content = `graph TD
    Reg[ECR] --> Fn[Lambda]
    Fn --> Keys[KMS]
    Fn --> Secrets["Secrets Manager"]
    Fn --> Topic[SNS]
    Fn --> Tracing["X-Ray"]
    Fn --> Metrics[CloudWatch]
    Fn --> Bus[EventBridge]`;
            const result = importMermaidDeploymentDiagram(baseDiagram, content) as any;
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            const byText = new Map(nodes.map(n => [n.text, n.customShape?.pictureId]));
            expect(byText.get('ECR')).toBe(PredefinedSvg.ECR);
            expect(byText.get('KMS')).toBe(PredefinedSvg.KMS);
            expect(byText.get('Secrets Manager')).toBe(PredefinedSvg.SecretsManager);
            expect(byText.get('SNS')).toBe(PredefinedSvg.SNS);
            expect(byText.get('X-Ray')).toBe(PredefinedSvg.XRay);
            expect(byText.get('CloudWatch')).toBe(PredefinedSvg.CloudWatch);
            expect(byText.get('EventBridge')).toBe(PredefinedSvg.EventBridge);

            const hints = result.mermaidHints.nodes as Record<string, { icon: string }>;
            expect(hints['Reg']).toEqual({ icon: 'ecr' });
            expect(hints['Keys']).toEqual({ icon: 'kms' });
            expect(hints['Secrets']).toEqual({ icon: 'secretsmanager' });
            expect(hints['Topic']).toEqual({ icon: 'sns' });
            expect(hints['Tracing']).toEqual({ icon: 'xray' });
            expect(hints['Metrics']).toEqual({ icon: 'cloudwatch' });
            expect(hints['Bus']).toEqual({ icon: 'eventbridge' });
        });

        it('detects NAT Gateway, Internet Gateway and Parameter Store', () => {
            const content = `graph TD
    IGW["Internet Gateway"] --> NAT["NAT Gateway"]
    NAT --> App[App]
    App --> PS["Parameter Store"]`;
            const result = importMermaidDeploymentDiagram(baseDiagram, content) as any;
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            const byText = new Map(nodes.map(n => [n.text, n.customShape?.pictureId]));
            expect(byText.get('Internet Gateway')).toBe(PredefinedSvg.InternetGateway);
            expect(byText.get('NAT Gateway')).toBe(PredefinedSvg.NatGateway);
            expect(byText.get('Parameter Store')).toBe(PredefinedSvg.ParamStore);

            const hints = result.mermaidHints.nodes as Record<string, { icon: string }>;
            expect(hints['IGW']).toEqual({ icon: 'internetgateway' });
            expect(hints['NAT']).toEqual({ icon: 'natgateway' });
            expect(hints['PS']).toEqual({ icon: 'paramstore' });
        });

        it('detects broad set of popular AWS services and abbreviations', () => {
            const content = `graph TD
    A[EC2] --> B[RDS]
    B --> C[Aurora]
    D[IAM] --> A
    E[VPC] --> A
    F[EKS] --> G[EFS]
    A --> H[EBS]
    I[ElastiCache] --> A
    J[CloudFormation] --> A
    K[CloudTrail] --> A
    L["Step Functions"] --> M[Beanstalk]
    N[Batch] --> O[Backup]
    P["Transit Gateway"] --> Q["Direct Connect"]
    R[SES] --> S[MSK]
    T[Firehose] --> U[MQ]
    V[Glue] --> W[Athena]
    X[Redshift] --> Y[OpenSearch]
    Z[Bedrock] --> AA[SageMaker]`;
            const result = importMermaidDeploymentDiagram(baseDiagram, content) as any;
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            const byText = new Map(nodes.map(n => [n.text, n.customShape?.pictureId]));
            const expected: Array<[string, PredefinedSvg]> = [
                ['EC2', PredefinedSvg.EC2],
                ['RDS', PredefinedSvg.RDS],
                ['Aurora', PredefinedSvg.Aurora],
                ['IAM', PredefinedSvg.IAM],
                ['VPC', PredefinedSvg.VPC],
                ['EKS', PredefinedSvg.EKS],
                ['EFS', PredefinedSvg.EFS],
                ['EBS', PredefinedSvg.EBS],
                ['ElastiCache', PredefinedSvg.ElastiCache],
                ['CloudFormation', PredefinedSvg.CloudFormation],
                ['CloudTrail', PredefinedSvg.CloudTrail],
                ['Step Functions', PredefinedSvg.StepFunctions],
                ['Beanstalk', PredefinedSvg.Beanstalk],
                ['Batch', PredefinedSvg.Batch],
                ['Backup', PredefinedSvg.Backup],
                ['Transit Gateway', PredefinedSvg.TransitGateway],
                ['Direct Connect', PredefinedSvg.DirectConnect],
                ['SES', PredefinedSvg.SES],
                ['MSK', PredefinedSvg.MSK],
                ['Firehose', PredefinedSvg.Firehose],
                ['MQ', PredefinedSvg.MQ],
                ['Glue', PredefinedSvg.Glue],
                ['Athena', PredefinedSvg.Athena],
                ['Redshift', PredefinedSvg.Redshift],
                ['OpenSearch', PredefinedSvg.OpenSearch],
                ['Bedrock', PredefinedSvg.Bedrock],
                ['SageMaker', PredefinedSvg.SageMaker],
            ];
            for (const [label, expectedIcon] of expected) {
                expect(byText.get(label), `label "${label}"`).toBe(expectedIcon);
            }
        });
    });

    describe('importMermaidStateDiagram', () => {
        const baseDiagram: Diagram = {
            id: 'test-state',
            display: {width: 1000, height: 1000, scale: 1, offset: {x: 0, y: 0}},
            type: ElementType.FlowchartDiagram,
            selectedElements: [],
            notes: {}
        };

        it('detects state diagram types', () => {
            expect(detectMermaidDiagramType('stateDiagram-v2')?.kind).toBe('state');
            expect(detectMermaidDiagramType('stateDiagram')?.kind).toBe('state');
        });

        it('imports a simple state diagram via importMermaidDiagram', () => {
            const content = `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`;

            const result = importMermaidDiagram(baseDiagram, content) as StructureDiagramState & { elements: { [id: string]: any } };
            expect(result.type).toBe(ElementType.FlowchartDiagram);
            expect(result.notes).toEqual({});

            const nodeList = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode);
            const linkList = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink);

            expect(nodeList.length).toBeGreaterThanOrEqual(4);
            expect(linkList.length).toBe(6);

            const nodeTexts = nodeList.map((n: any) => n.text);
            expect(nodeTexts).toContain('Still');
            expect(nodeTexts).toContain('Moving');
            expect(nodeTexts).toContain('Crash');
        });

        it('imports transition labels', () => {
            const content = `stateDiagram-v2
    Idle --> Active : start
    Active --> Idle : stop`;

            const result = importMermaidStateDiagram(baseDiagram, content) as StructureDiagramState & { elements: { [id: string]: any } };
            const links = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink) as LinkState[];
            expect(links).toHaveLength(2);
            const texts = links.map(l => l.text).sort();
            expect(texts).toEqual(['start', 'stop']);
        });

        it('imports state labels from "state ... as ..." declarations', () => {
            const content = `stateDiagram-v2
    state "Not Shooting" as NS
    [*] --> NS`;

            const result = importMermaidStateDiagram(baseDiagram, content) as StructureDiagramState & { elements: { [id: string]: any } };
            const nodeTexts = Object.values(result.elements)
                .filter((e: any) => e.type === ElementType.ClassNode)
                .map((n: any) => n.text);
            expect(nodeTexts).toContain('Not Shooting');
        });

        it('imports choice states as decision nodes', () => {
            const content = `stateDiagram-v2
    state choice1 <<choice>>
    [*] --> choice1
    choice1 --> A : if true
    choice1 --> B : if false`;

            const result = importMermaidStateDiagram(baseDiagram, content) as StructureDiagramState & { elements: { [id: string]: any } };
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            const choiceNode = nodes.find(n => n.text === 'choice1');
            expect(choiceNode?.flowchartKind).toBe(FlowchartNodeKind.Decision);
        });

        it('imports composite states as clusters', () => {
            const content = `stateDiagram-v2
    [*] --> First
    state First {
        [*] --> second
        second --> [*]
    }
    First --> [*]`;

            const result = importMermaidStateDiagram(baseDiagram, content) as any;
            const clusterLabels = Object.values(result.elements as Record<string, any>)
                .filter(e => e.type === ElementType.Cluster)
                .map(e => e.text);
            expect(clusterLabels).toContain('First');
        });

        it('imports direction hint', () => {
            const content = `stateDiagram-v2
    direction LR
    A --> B`;

            const result = importMermaidStateDiagram(baseDiagram, content) as StructureDiagramState & { elements: { [id: string]: any } };
            const ports = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassPort) as PortState[];
            const alignments = ports.map(p => result.ports[p.id]?.alignment);
            expect(alignments).toContain(PortAlignment.Right);
            expect(alignments).toContain(PortAlignment.Left);
        });
    });

    describe('importMermaidMindMapDiagram', () => {
        const baseDiagram: Diagram = {
            id: 'test-mindmap',
            display: { width: 1000, height: 1000, scale: 1, offset: { x: 0, y: 0 } },
            type: ElementType.MindMapDiagram,
            selectedElements: [],
            notes: {},
        };

        it('imports a simple mind map', () => {
            const content = `mindmap
  root
    Branch A
      Leaf 1
      Leaf 2
    Branch B`;

            const result = importMermaidMindMapDiagram(baseDiagram, content) as StructureDiagramState & { elements: { [id: string]: any } };
            const nodeEls = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];

            expect(nodeEls).toHaveLength(5);
            expect(nodeEls.map(n => n.text).sort()).toEqual(['Branch A', 'Branch B', 'Leaf 1', 'Leaf 2', 'root']);
        });

        it('all nodes have MindMapTopic kind', () => {
            const content = `mindmap
  root
    Child`;

            const result = importMermaidMindMapDiagram(baseDiagram, content) as StructureDiagramState & { elements: { [id: string]: any } };
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            expect(nodes.every(n => n.flowchartKind === FlowchartNodeKind.MindMapTopic)).toBe(true);
        });

        it('creates links from parent to children', () => {
            const content = `mindmap
  root
    A
    B`;

            const result = importMermaidMindMapDiagram(baseDiagram, content) as StructureDiagramState & { elements: { [id: string]: any } };
            const links = Object.values(result.links);
            expect(links).toHaveLength(2);
        });

        it('uses bezier route style and no arrowheads', () => {
            const content = `mindmap
  root
    Child`;

            const result = importMermaidMindMapDiagram(baseDiagram, content) as StructureDiagramState & { elements: { [id: string]: any } };
            const link = Object.values(result.elements).find((e: any) => e.type === ElementType.ClassLink) as LinkState;
            expect(link.routeStyle).toBe(RouteStyle.Bezier);
            expect(link.tipStyle1).toBe('none');
            expect(link.tipStyle2).toBe('none');
        });

        it('strips shape markers from node text', () => {
            const content = `mindmap
  root((Central Topic))
    [Square]
    (Rounded)
    ((Circle))
    {{Hexagon}}`;

            const result = importMermaidMindMapDiagram(baseDiagram, content) as StructureDiagramState & { elements: { [id: string]: any } };
            const nodes = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            const texts = nodes.map(n => n.text).sort();
            expect(texts).toEqual(['Central Topic', 'Circle', 'Hexagon', 'Rounded', 'Square']);
        });

        it('detects mindmap via importMermaidDiagram', () => {
            const content = `mindmap
  root
    A`;

            const result = importMermaidDiagram(baseDiagram, content) as StructureDiagramState & { elements: { [id: string]: any } };
            const nodes = Object.values(result.elements ?? {}).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            expect(nodes.length).toBeGreaterThan(0);
        });

        it('has nativeImport true for mindmap', () => {
            const mindmapType = mermaidDiagramTypes.find(t => t.kind === 'mindmap');
            expect(mindmapType?.nativeImport).toBe(true);
        });

        it('places root between left and right subtrees', () => {
            const content = `mindmap
  root
    Right A
      Right A1
    Left B
      Left B1`;

            const result = importMermaidMindMapDiagram(baseDiagram, content) as StructureDiagramState & { elements: { [id: string]: any } };
            const nodeEls = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassNode) as NodeState[];
            const byText: { [text: string]: any } = {};
            for (const n of nodeEls) byText[n.text] = result.nodes[n.id].bounds;

            const rootCx = byText['root'].x + byText['root'].width / 2;
            const rightCx = byText['Right A'].x + byText['Right A'].width / 2;
            const leftCx = byText['Left B'].x + byText['Left B'].width / 2;

            expect(rightCx).toBeGreaterThan(rootCx);
            expect(leftCx).toBeLessThan(rootCx);
        });

        it('uses opposite port alignments for left vs right links', () => {
            const content = `mindmap
  root
    A
    B`;

            const result = importMermaidMindMapDiagram(baseDiagram, content) as StructureDiagramState & { elements: { [id: string]: any } };
            const linkEls = Object.values(result.elements).filter((e: any) => e.type === ElementType.ClassLink) as LinkState[];
            const portAlignments = linkEls.map(l => [
                result.ports[l.port1]?.alignment,
                result.ports[l.port2]?.alignment,
            ]);

            // One link should be Right→Left (right side), the other Left→Right (left side)
            expect(portAlignments).toContainEqual([PortAlignment.Right, PortAlignment.Left]);
            expect(portAlignments).toContainEqual([PortAlignment.Left, PortAlignment.Right]);
        });
    });
});
