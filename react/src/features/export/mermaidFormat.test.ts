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
    importMermaidPieChartDiagram,
    importMermaidStructureDiagram,
    importMermaidSequenceDiagram,
    mermaidDiagramTypes
} from './mermaidFormat';
import { Diagram } from '../../common/model';
import { StructureDiagramState } from '../structureDiagram/structureDiagramState';
import { SequenceDiagramState } from '../sequenceDiagram/sequenceDiagramModel';
import { NodeState, LinkState, ElementType } from '../../package/packageModel';
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
            expect(mermaidDiagramTypes.find(type => type.kind === 'state')?.nativeImport).toBe(false);
        });

        it('imports unsupported Mermaid diagram types as preserved source notes', () => {
            const baseDiagram: Diagram = {
                id: 'test-mermaid-fallback',
                display: { width: 1000, height: 1000, scale: 1, offset: { x: 20, y: 30 } },
                type: ElementType.FlowchartDiagram,
                selectedElements: [{ id: 'old-element', type: ElementType.ClassNode }],
                notes: {}
            };

            const content = `stateDiagram-v2
    [*] --> Open
    Open --> Closed`;

            const result = importMermaidDiagram(baseDiagram, content);
            const notes = Object.values(result.notes);

            expect(notes).toHaveLength(1);
            expect(notes[0].text).toContain('State Diagram Mermaid source');
            expect(notes[0].text).toContain(content);
            expect(result.selectedElements).toHaveLength(0);
            expect((result as any).nodes).toEqual({});
            expect((result as any).ports).toEqual({});
            expect((result as any).links).toEqual({});
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
    // Reduced but structurally faithful reproduction of the bug-report diagram:
    // flat subgraphs (Clients, CoreSvcs, LambdaLayer) plus two-level nesting
    // (DDBTables and SQSQueues inside AWSServices).  graph TD means top-to-bottom.
    const mermaidContent = String.raw`graph TD
    subgraph Clients["Client Applications"]
        UI["Web UI / Mobile"]
        AddIns["Outlook & Word Add-ins"]
        Ext["External Systems"]
    end

    LB["API Gateway / Load Balancer"]

    subgraph CoreSvcs["Core Services"]
        GP["GridPackage\n(Core API)"]
        RS["ResourceServer\n(Distribution Module)"]
        SW["StaticWeb\n(UI Assets)"]
    end

    subgraph AWSServices["AWS Services Layer"]
        Kinesis["Kinesis\n(MES stream)"]
        S3["S3"]
        subgraph DDBTables["DynamoDB Tables"]
            DDBVS["idm-virus-scanning-table\n(virus scan jobs)"]
            DDBFifo["idm-fifo-job\n(print FIFO ordering)"]
        end
        subgraph SQSQueues["SQS Queues"]
            QV["virus.scan.queue\nStandard"]
            QE["distribution.email.queue\nStandard"]
            QT["daf.rs.textExtraction.queue\nStandard"]
            QC["daf.rs.conversions.queue\nStandard"]
            QA["daf.rs.auditCollection.queue\nStandard"]
        end
    end

    subgraph LambdaLayer["Lambda Functions"]
        SL["Search Integration"]
        EL["Email Integration"]
        VL["Virus Scan"]
        TL["Text Extraction"]
        FL["File Conversion"]
    end

    DB[("Database\n(PostgreSQL / MSSQL)")]

    Clients --> LB
    LB --> GP & RS & SW
    GP --> Kinesis & S3
    GP --> DDBVS & DDBFifo
    GP --> QV & QE & QT & QC & QA
    RS --> QC & QE
    RS --> DDBFifo
    S3 --> QV
    QV --> VL
    QE --> EL
    QT --> TL
    QC --> FL
    QA --> AL
    Kinesis --> SL
    SL & EL --> DB
    GP --> DB`;

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
        // 3 Clients + 1 LB + 3 CoreSvcs + 2 AWS-direct + 2 DDB + 5 SQS + 5 Lambda + 1 DB = 22
        // (AL is referenced in edge but never declared as a node in this reduced diagram — 21)
        expect(nodes.length).toBeGreaterThanOrEqual(21);
        const labels = nodes.map(n => n.text.split('\n')[0]);
        expect(labels).toContain('Web UI / Mobile');
        expect(labels).toContain('API Gateway / Load Balancer');
        expect(labels).toContain('GridPackage');
        expect(labels).toContain('S3');
        expect(labels).toContain('idm-virus-scanning-table');
        expect(labels).toContain('virus.scan.queue');
        expect(labels).toContain('Search Integration');
    });

    it('creates cluster objects for all 6 subgraphs with correct labels', () => {
        expect(result.clusters).toBeDefined();
        const clusters = result.clusters!;
        expect(Object.keys(clusters)).toHaveLength(6);
        expect(clusters['Clients']?.label).toBe('Client Applications');
        expect(clusters['CoreSvcs']?.label).toBe('Core Services');
        expect(clusters['AWSServices']?.label).toBe('AWS Services Layer');
        expect(clusters['LambdaLayer']?.label).toBe('Lambda Functions');
        expect(clusters['DDBTables']?.label).toBe('DynamoDB Tables');
        expect(clusters['SQSQueues']?.label).toBe('SQS Queues');
    });

    it('Clients cluster bounds contain all three client nodes', () => {
        const cb = result.clusters!['Clients'].bounds;
        expect(isContainedIn(getNodeBounds('Web UI / Mobile'), cb)).toBe(true);
        expect(isContainedIn(getNodeBounds('Outlook & Word Add-ins'), cb)).toBe(true);
        expect(isContainedIn(getNodeBounds('External Systems'), cb)).toBe(true);
    });

    it('CoreSvcs cluster bounds contain GP, RS, and SW nodes', () => {
        const cb = result.clusters!['CoreSvcs'].bounds;
        expect(isContainedIn(getNodeBounds('GridPackage'), cb)).toBe(true);
        expect(isContainedIn(getNodeBounds('ResourceServer'), cb)).toBe(true);
        expect(isContainedIn(getNodeBounds('StaticWeb'), cb)).toBe(true);
    });

    it('AWSServices cluster bounds contain Kinesis and S3 nodes', () => {
        const cb = result.clusters!['AWSServices'].bounds;
        expect(isContainedIn(getNodeBounds('Kinesis'), cb)).toBe(true);
        expect(isContainedIn(getNodeBounds('S3'), cb)).toBe(true);
    });

    it('DDBTables cluster is nested inside AWSServices cluster bounds', () => {
        const aws = result.clusters!['AWSServices'].bounds;
        const ddb = result.clusters!['DDBTables'].bounds;
        expect(isContainedIn(ddb, aws)).toBe(true);
    });

    it('SQSQueues cluster is nested inside AWSServices cluster bounds', () => {
        const aws = result.clusters!['AWSServices'].bounds;
        const sqs = result.clusters!['SQSQueues'].bounds;
        expect(isContainedIn(sqs, aws)).toBe(true);
    });

    it('DDBTables cluster bounds contain DDBVS and DDBFifo nodes', () => {
        const cb = result.clusters!['DDBTables'].bounds;
        expect(isContainedIn(getNodeBounds('idm-virus-scanning-table'), cb)).toBe(true);
        expect(isContainedIn(getNodeBounds('idm-fifo-job'), cb)).toBe(true);
    });

    it('SQSQueues cluster bounds contain all five queue nodes', () => {
        const cb = result.clusters!['SQSQueues'].bounds;
        for (const prefix of [
            'virus.scan.queue',
            'distribution.email.queue',
            'daf.rs.textExtraction.queue',
            'daf.rs.conversions.queue',
            'daf.rs.auditCollection.queue'
        ]) {
            expect(isContainedIn(getNodeBounds(prefix), cb), `${prefix} should be within SQSQueues`).toBe(true);
        }
    });

    it('LambdaLayer cluster bounds contain all five lambda nodes', () => {
        const cb = result.clusters!['LambdaLayer'].bounds;
        for (const label of ['Search Integration', 'Email Integration', 'Virus Scan', 'Text Extraction', 'File Conversion']) {
            expect(isContainedIn(getNodeBounds(label), cb), `${label} should be within LambdaLayer`).toBe(true);
        }
    });

    it('layout flows top-to-bottom: Clients above CoreSvcs, CoreSvcs above AWSServices, AWSServices above LambdaLayer', () => {
        const c = result.clusters!;
        const clientsBottom = c['Clients'].bounds.y + c['Clients'].bounds.height;
        const coreTop = c['CoreSvcs'].bounds.y;
        const coreBottom = c['CoreSvcs'].bounds.y + c['CoreSvcs'].bounds.height;
        const awsTop = c['AWSServices'].bounds.y;
        const awsBottom = c['AWSServices'].bounds.y + c['AWSServices'].bounds.height;
        const lambdaTop = c['LambdaLayer'].bounds.y;

        expect(clientsBottom).toBeLessThan(coreTop + 50);
        expect(coreBottom).toBeLessThan(awsTop + 50);
        expect(awsBottom).toBeLessThan(lambdaTop + 50);
    });

    it('LB node sits vertically between Clients and CoreSvcs clusters', () => {
        const lbBounds = getNodeBounds('API Gateway / Load Balancer');
        const clientsBottom = result.clusters!['Clients'].bounds.y + result.clusters!['Clients'].bounds.height;
        const coreTop = result.clusters!['CoreSvcs'].bounds.y;

        expect(lbBounds.y + lbBounds.height).toBeGreaterThan(clientsBottom - 50);
        expect(lbBounds.y).toBeLessThan(coreTop + 50);
    });
});
