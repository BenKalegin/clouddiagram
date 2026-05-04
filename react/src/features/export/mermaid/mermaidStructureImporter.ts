import {Diagram} from "../../../common/model";
import {
    CornerStyle,
    ElementType,
    FlowchartNodeKind,
    LinkState,
    NodeState,
    PortState,
    RouteStyle,
    TipStyle
} from "../../../package/packageModel";
import {defaultColorSchema} from "../../../common/colors/colorSchemas";
import {StructureDiagramState} from "../../structureDiagram/structureDiagramState";
import {createMermaidIdGenerator, mermaidSourceLines, parseMermaidLayoutHints} from "./mermaidImportUtils";
import {createClassMember, minimumClassNodeHeight, normalizeClassAnnotation} from "../../classDiagram/classDiagramUtils";
import {applyAutoLayout, LayoutLink} from "../../layout/autoLayout";

interface ImportStructureOptions {
    forceFlowchart?: boolean;
}

function toFlowchartKind(shape: "process" | "decision" | "terminator" | "input-output" | undefined): FlowchartNodeKind | undefined {
    switch (shape) {
        case "decision":
            return FlowchartNodeKind.Decision;
        case "terminator":
            return FlowchartNodeKind.Terminator;
        case "input-output":
            return FlowchartNodeKind.InputOutput;
        case "process":
            return FlowchartNodeKind.Process;
        default:
            return undefined;
    }
}

/**
 * Import a Mermaid class/flowchart diagram into CloudDiagram structure format
 */
export function importMermaidFlowchartDiagram(baseDiagram: Diagram, content: string): Diagram {
    return importMermaidStructureDiagram(baseDiagram, content, { forceFlowchart: true });
}

export function importMermaidStructureDiagram(baseDiagram: Diagram, content: string, options?: ImportStructureOptions): Diagram {
    const generateId = createMermaidIdGenerator();
    const lines = mermaidSourceLines(content);

    const headerLine = lines.find(l =>
        l.toLowerCase().startsWith('classdiagram') ||
        l.toLowerCase().startsWith('c4context') ||
        l.toLowerCase().startsWith('c4container') ||
        l.toLowerCase().startsWith('c4component') ||
        l.toLowerCase().startsWith('c4dynamic') ||
        l.toLowerCase().startsWith('c4deployment') ||
        l.toLowerCase().startsWith('flowchart') ||
        l.toLowerCase().startsWith('graph')
    );

    if (!headerLine && !options?.forceFlowchart) {
        throw new Error('Not a valid Mermaid class diagram or flowchart');
    }

    const lowerHeaderLine = (headerLine ?? "flowchart").toLowerCase();
    const flowchartMode =
        options?.forceFlowchart === true ||
        baseDiagram.type === ElementType.FlowchartDiagram ||
        lowerHeaderLine.startsWith("flowchart") ||
        lowerHeaderLine.startsWith("graph");

    const elements: { [id: string]: any } = {};
    const nodes: { [id: string]: any } = {};
    const ports: { [id: string]: any } = {};
    const links: { [id: string]: any } = {};
    const layoutEdges: LayoutLink[] = [];
    const nodeMap: { [name: string]: string } = {};
    const subgraphMembers: { [name: string]: string[] } = {};
    const subgraphStack: string[] = [];
    let nodeIndex = 0;
    let currentClassBlock: string | undefined;

    function trackSubgraphMembership(name: string): void {
        for (const sid of subgraphStack) {
            const members = subgraphMembers[sid] ?? (subgraphMembers[sid] = []);
            if (!members.includes(name)) members.push(name);
        }
    }

    function expandSubgraphRef(name: string): string[] {
        return subgraphMembers[name]?.length ? [...subgraphMembers[name]] : [name];
    }

    function normalizeLabel(label: string | undefined): string | undefined {
        return label?.replace(/\\n/g, "\n");
    }

    function stripLabelQuotes(label: string | undefined): string | undefined {
        if (label === undefined) return undefined;
        const trimmed = label.trim();
        if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return trimmed.slice(1, -1);
        }
        return trimmed;
    }

    function splitChainSide(side: string): string[] {
        return side
            .split(/\s*&\s*/)
            .map(part => part.trim())
            .filter(part => /^[\w-]+$/.test(part));
    }

    function getOrCreateNode(
        name: string,
        label?: string,
        flowchartKind?: FlowchartNodeKind
    ): string {
        const normalizedName = name.trim();
        if (nodeMap[normalizedName]) {
            const nodeId = nodeMap[normalizedName];
            if (label) {
                (elements[nodeId] as NodeState).text = label.trim();
            }
            if (flowchartKind && flowchartMode) {
                (elements[nodeId] as NodeState).flowchartKind = flowchartKind;
            }
            return nodeId;
        }

        const nodeId = generateId();
        const nodeWidth = 140;
        const nodeHeight = 60;
        const nodesPerRow = 5;
        const spacingX = 60;
        const spacingY = 80;
        const row = Math.floor(nodeIndex / nodesPerRow);
        const col = nodeIndex % nodesPerRow;

        elements[nodeId] = {
            id: nodeId,
            type: ElementType.ClassNode,
            text: (label || normalizedName).trim(),
            ports: [],
            colorSchema: defaultColorSchema,
            flowchartKind: flowchartMode ? (flowchartKind ?? FlowchartNodeKind.Process) : undefined
        } as NodeState;

        nodes[nodeId] = {
            bounds: {
                x: 100 + col * (nodeWidth + spacingX),
                y: 100 + row * (nodeHeight + spacingY),
                width: nodeWidth,
                height: nodeHeight
            }
        };

        nodeMap[normalizedName] = nodeId;
        nodeIndex++;
        return nodeId;
    }

    function addClassMember(className: string, memberText: string): void {
        const normalizedMember = memberText.trim();
        if (!normalizedMember) return;

        const annotationMatch = normalizedMember.match(/^<<(.+)>>$/);
        if (annotationMatch) {
            setClassAnnotation(className, annotationMatch[1]);
            return;
        }

        const member = createClassMember(normalizedMember);
        if (!member) return;

        const nodeId = getOrCreateNode(className);
        const node = elements[nodeId] as NodeState;
        node.classMembers = [...(node.classMembers ?? []), member];
        nodes[nodeId].bounds.height = Math.max(nodes[nodeId].bounds.height, minimumClassNodeHeight(node));
    }

    function setClassAnnotation(className: string, annotation: string): void {
        const nodeId = getOrCreateNode(className);
        const node = elements[nodeId] as NodeState;
        node.classAnnotation = normalizeClassAnnotation(annotation);
        nodes[nodeId].bounds.height = Math.max(nodes[nodeId].bounds.height, minimumClassNodeHeight(node));
    }

    function createPort(nodeId: string, alignment: number): string {
        const portId = generateId();
        elements[portId] = {
            id: portId,
            type: ElementType.ClassPort,
            nodeId,
            links: [],
            depthRatio: 50,
            latitude: 10,
            longitude: 10
        } as PortState;

        const node = elements[nodeId] as NodeState;
        node.ports.push(portId);

        ports[portId] = {
            alignment,
            edgePosRatio: 50
        };
        return portId;
    }

    function createLink(sourceNodeId: string, targetNodeId: string, arrowType?: string, edgeLabel?: string): void {
        let fromId = sourceNodeId;
        let toId = targetNodeId;
        const normalizedArrow = arrowType ?? "-->";

        if (flowchartMode && normalizedArrow.includes("<") && !normalizedArrow.includes(">")) {
            fromId = targetNodeId;
            toId = sourceNodeId;
        }

        const linkId = generateId();
        const sourcePortId = createPort(fromId, 1);
        const targetPortId = createPort(toId, 0);

        let tipStyle2 = TipStyle.Arrow;
        if (!flowchartMode) {
            if (normalizedArrow === '<|--') tipStyle2 = TipStyle.Triangle;
            if (normalizedArrow === '--*') tipStyle2 = TipStyle.Diamond;
            if (normalizedArrow === '--o') tipStyle2 = TipStyle.Circle;
        }

        elements[linkId] = {
            id: linkId,
            type: ElementType.ClassLink,
            port1: sourcePortId,
            port2: targetPortId,
            tipStyle1: TipStyle.None,
            tipStyle2,
            routeStyle: flowchartMode ? RouteStyle.OrthogonalSquare : RouteStyle.Direct,
            cornerStyle: CornerStyle.Straight,
            colorSchema: defaultColorSchema,
            text: edgeLabel?.trim() || undefined
        } as LinkState;

        (elements[sourcePortId] as PortState).links.push(linkId);
        (elements[targetPortId] as PortState).links.push(linkId);

        links[linkId] = {};
        layoutEdges.push({ source: fromId, target: toId });
    }

    function tryEdgeChain(line: string): boolean {
        const arrowMatch = line.match(/\s+(<\|--|<-->|<--|-->|---|-\.-|==>|--\.\.|--o|--\*|<->|--)\s+(?:\|([^|]+)\|\s+)?/);
        if (!arrowMatch || arrowMatch.index === undefined) return false;
        const arrow = arrowMatch[1];
        const edgeLabel = arrowMatch[2];
        const lhs = line.slice(0, arrowMatch.index);
        const rhs = line.slice(arrowMatch.index + arrowMatch[0].length);
        const fromNames = splitChainSide(lhs);
        const toNames = splitChainSide(rhs);
        if (fromNames.length === 0 || toNames.length === 0) return false;

        for (const fromName of fromNames) {
            for (const toName of toNames) {
                for (const fid of expandSubgraphRef(fromName)) {
                    for (const tid of expandSubgraphRef(toName)) {
                        createLink(getOrCreateNode(fid), getOrCreateNode(tid), arrow, edgeLabel);
                    }
                }
            }
        }
        return true;
    }

    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.startsWith('classdiagram') ||
            lowerLine.startsWith('c4context') ||
            lowerLine.startsWith('c4container') ||
            lowerLine.startsWith('c4component') ||
            lowerLine.startsWith('c4dynamic') ||
            lowerLine.startsWith('c4deployment') ||
            lowerLine.startsWith('flowchart') ||
            lowerLine.startsWith('graph')) continue;

        const subgraphMatch = line.match(/^subgraph\s+([\w-]+)(?:\s*\[\s*["`]?(.+?)["`]?\s*\])?\s*$/);
        if (subgraphMatch) {
            const [, sid] = subgraphMatch;
            subgraphStack.push(sid);
            if (!subgraphMembers[sid]) subgraphMembers[sid] = [];
            continue;
        }
        if (lowerLine === "end") {
            subgraphStack.pop();
            continue;
        }

        if (flowchartMode && line.includes("&") && tryEdgeChain(line)) {
            continue;
        }

        if (currentClassBlock) {
            if (/^}\s*;?$/.test(line)) {
                currentClassBlock = undefined;
            } else {
                addClassMember(currentClassBlock, line);
            }
            continue;
        }

        const inlineClassBlockMatch = line.match(/^class\s+([\w-]+)(?:~[^~]+~)?\s*\{\s*(.+?)\s*}\s*;?$/);
        if (inlineClassBlockMatch) {
            const [, className, members] = inlineClassBlockMatch;
            getOrCreateNode(className);
            members
                .split(/;|,/)
                .map(member => member.trim())
                .filter(Boolean)
                .forEach(member => addClassMember(className, member));
            continue;
        }

        const classBlockMatch = line.match(/^class\s+([\w-]+)(?:~[^~]+~)?(?:\s*<<(.+)>>)?\s*\{\s*$/);
        if (classBlockMatch) {
            const [, className, annotation] = classBlockMatch;
            getOrCreateNode(className);
            if (annotation) {
                setClassAnnotation(className, annotation);
            }
            currentClassBlock = className;
            continue;
        }

        const classMemberMatch = line.match(/^([\w-]+)\s*:\s*(.+)$/);
        if (!flowchartMode && classMemberMatch) {
            const [, className, memberText] = classMemberMatch;
            addClassMember(className, memberText);
            continue;
        }

        const classAnnotationMatch = line.match(/^<<(.+)>>\s+([\w-]+)$/);
        if (!flowchartMode && classAnnotationMatch) {
            const [, annotation, className] = classAnnotationMatch;
            setClassAnnotation(className, annotation);
            continue;
        }

        const c4NodeMatch = line.match(/^(Person|System|Container|Component)\s*\(\s*([\w-]+)\s*,\s*"?([^",)]+)"?(?:\s*,.*)?\)\s*$/i);
        if (c4NodeMatch) {
            const [, c4Type, id, label] = c4NodeMatch;
            const kindByType: Record<string, FlowchartNodeKind> = {
                person: FlowchartNodeKind.C4Person,
                system: FlowchartNodeKind.C4System,
                container: FlowchartNodeKind.C4Container,
                component: FlowchartNodeKind.C4Component
            };
            getOrCreateNode(id, label, kindByType[c4Type.toLowerCase()]);
            continue;
        }

        const c4RelMatch = line.match(/^Rel(?:_[UDLR])?\s*\(\s*([\w-]+)\s*,\s*([\w-]+)\s*,\s*"?([^",)]+)"?(?:\s*,.*)?\)\s*$/i);
        if (c4RelMatch) {
            const [, from, to, relLabel] = c4RelMatch;
            const fromNodeId = getOrCreateNode(from);
            const toNodeId = getOrCreateNode(to);
            createLink(fromNodeId, toNodeId, "-->", relLabel);
            continue;
        }

        const nodeMatch = line.match(/^([\w-]+)\s*(?:\[\/([^\]]+)\/\]|\[\(("[^"]+"|.+?)\)\]|\[([^\]]+)\]|\(\[([^\]]+)\]\)|\(\(([^)]+)\)\)|\(([^)]+)\)|\{([^}]+)\})$/);
        if (nodeMatch) {
            const [, id, ioLabel, cylinderLabel, squareLabel, stadiumLabel, circleLabel, roundLabel, decisionLabel] = nodeMatch;
            const rawLabel = ioLabel || cylinderLabel || squareLabel || stadiumLabel || circleLabel || roundLabel || decisionLabel;
            const label = normalizeLabel(stripLabelQuotes(rawLabel));
            const shape = decisionLabel ? "decision"
                : ioLabel ? "input-output"
                    : (stadiumLabel || circleLabel || roundLabel || cylinderLabel) ? "terminator"
                        : "process";
            getOrCreateNode(id, label, toFlowchartKind(shape));
            trackSubgraphMembership(id);
            continue;
        }

        const flowMatch = line.match(/^([\w-]+)\s*(?:\[\/([^\]]+)\/\]|\[\(("[^"]+"|.+?)\)\]|\[([^\]]+)\]|\(\[([^\]]+)\]\)|\(\(([^)]+)\)\)|\(([^)]+)\)|\{([^}]+)\})?\s*(<\|--|<-->|<--|-->|---|-\.-|==>|--|--\.\.|--o|--\*|<->)\s*(?:\|([^|]+)\|\s*)?([\w-]+)\s*(?:\[\/([^\]]+)\/\]|\[\(("[^"]+"|.+?)\)\]|\[([^\]]+)\]|\(\[([^\]]+)\]\)|\(\(([^)]+)\)\)|\(([^)]+)\)|\{([^}]+)\})?(?:\s*\|([^|]+)\|)?$/);
        if (flowMatch) {
            const [, from, fio, fcyl, fsquare, fstadium, fcircle, fround, fdecision, arrow, edgeLabelBefore, to, tio, tcyl, tsquare, tstadium, tcircle, tround, tdecision, edgeLabelAfter] = flowMatch;
            const edgeLabel = normalizeLabel(edgeLabelBefore || edgeLabelAfter);
            const fromLabel = normalizeLabel(stripLabelQuotes(fio || fcyl || fsquare || fstadium || fcircle || fround || fdecision));
            const toLabel = normalizeLabel(stripLabelQuotes(tio || tcyl || tsquare || tstadium || tcircle || tround || tdecision));
            const fromHasShape = !!(fio || fcyl || fsquare || fstadium || fcircle || fround || fdecision);
            const toHasShape = !!(tio || tcyl || tsquare || tstadium || tcircle || tround || tdecision);
            const fromShape = fromHasShape
                ? (fdecision ? "decision"
                    : fio ? "input-output"
                        : (fstadium || fcircle || fround || fcyl) ? "terminator"
                            : "process")
                : undefined;
            const toShape = toHasShape
                ? (tdecision ? "decision"
                    : tio ? "input-output"
                        : (tstadium || tcircle || tround || tcyl) ? "terminator"
                            : "process")
                : undefined;
            const fromIds = fromHasShape ? [from] : expandSubgraphRef(from);
            const toIds = toHasShape ? [to] : expandSubgraphRef(to);
            for (const fname of fromIds) {
                for (const tname of toIds) {
                    const fLabel = fname === from ? fromLabel : undefined;
                    const tLabel = tname === to ? toLabel : undefined;
                    const fromNodeId = getOrCreateNode(fname, fLabel, toFlowchartKind(fromShape));
                    const toNodeId = getOrCreateNode(tname, tLabel, toFlowchartKind(toShape));
                    createLink(fromNodeId, toNodeId, arrow, edgeLabel);
                }
            }
            continue;
        }

        const classRelMatch = line.match(/^([\w-]+)\s*(<\|--|--|\.\.>|-->|--\*|--o|<--|<->)\s*([\w-]+)(?:\s*:\s*(.*))?$/);
        if (classRelMatch) {
            const [, from, arrow, to, relLabel] = classRelMatch;
            const fromNodeId = getOrCreateNode(from);
            const toNodeId = getOrCreateNode(to);
            createLink(fromNodeId, toNodeId, arrow, relLabel);
            continue;
        }

        const classMatch = line.match(/^class\s+([\w-]+)(?:\s*\[\s*["`]?(.+?)["`]?\s*\])?(?:\s*<<(.+)>>)?/);
        if (classMatch) {
            const [, className, label, annotation] = classMatch;
            getOrCreateNode(className, label);
            if (annotation) {
                setClassAnnotation(className, annotation);
            }
            continue;
        }
    }

    applyAutoLayout(nodes, layoutEdges, parseMermaidLayoutHints(content));

    const { width: displayWidth, height: displayHeight } = computeDisplaySize(nodes);

    const result: any = {
        ...baseDiagram,
        elements,
        nodes,
        ports,
        links,
        notes: {},
        selectedElements: [],
        display: {
            ...baseDiagram.display,
            width: displayWidth,
            height: displayHeight,
            offset: { x: 0, y: 0 }
        }
    };

    return result as StructureDiagramState;
}

const DISPLAY_PADDING = 80;
const DISPLAY_MIN_WIDTH = 800;
const DISPLAY_MIN_HEIGHT = 600;

function computeDisplaySize(nodes: { [id: string]: any }): { width: number; height: number } {
    let maxRight = DISPLAY_MIN_WIDTH;
    let maxBottom = DISPLAY_MIN_HEIGHT;
    for (const node of Object.values(nodes)) {
        const bounds = node?.bounds;
        if (!bounds) continue;
        maxRight = Math.max(maxRight, bounds.x + bounds.width);
        maxBottom = Math.max(maxBottom, bounds.y + bounds.height);
    }
    return {
        width: maxRight + DISPLAY_PADDING,
        height: maxBottom + DISPLAY_PADDING
    };
}
