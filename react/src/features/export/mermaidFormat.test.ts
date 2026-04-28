import { vi } from "vitest";
vi.mock("konva", () => ({}));
vi.mock("react-konva", () => ({}));
vi.mock("react-konva-to-svg", () => ({
    exportStageSVG: vi.fn(),
}));

import {
    detectMermaidDiagramType,
    importMermaidDiagram,
    importMermaidFlowchartDiagram,
    importMermaidGanttDiagram,
    importMermaidStructureDiagram,
    importMermaidSequenceDiagram,
    mermaidDiagramTypes
} from './mermaidFormat';
import { Diagram } from '../../common/model';
import { StructureDiagramState } from '../structureDiagram/structureDiagramState';
import { SequenceDiagramState } from '../sequenceDiagram/sequenceDiagramModel';
import { NodeState, LinkState, ElementType } from '../../package/packageModel';
import { exportGanttDiagramAsMermaid } from './mermaid/mermaidGanttExporter';

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

            expect(mermaidDiagramTypes.find(type => type.kind === 'gantt')?.nativeImport).toBe(true);
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
});
