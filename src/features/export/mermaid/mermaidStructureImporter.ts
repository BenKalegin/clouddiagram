import {Diagram} from "../../../common/model";
import {
    ColorSchema,
    CornerStyle,
    ElementType,
    FlowchartNodeKind,
    LinkState,
    NodeState,
    PortAlignment,
    PortState,
    RouteStyle,
    TipStyle
} from "../../../package/packageModel";
import {defaultColorSchema} from "../../../common/colors/colorSchemas";
import {StructureDiagramState} from "../../structureDiagram/structureDiagramState";
import {createMermaidIdGenerator, mermaidSourceLines, parseMermaidLayoutHints} from "./mermaidImportUtils";
import {createClassMember, minimumClassNodeHeight, normalizeClassAnnotation} from "../../classDiagram/classDiagramUtils";
import {applyAutoLayout, ClusterDef, computeDisplaySize, LayoutHints, LayoutLink, OrderHint} from "@benkalegin/doodles-api";

export {computeDisplaySize};

export interface StructureImportOut {
    nodeMap: Map<string, string>;        // mermaid id → internal nodeId
    subgraphLabels: Map<string, string>; // subgraph mermaid id → display label
    nodeParents: Map<string, string>;    // internal nodeId → direct parent subgraph mermaid id
    layoutEdges: LayoutLink[];
    clusterDefs: { [key: string]: ClusterDef };
    clusterParents: { [key: string]: string };
    layoutHints: LayoutHints;
}

interface ImportStructureOptions {
    forceFlowchart?: boolean;
    out?: StructureImportOut;
}

type StyleProps = Partial<Pick<ColorSchema, "fillColor" | "strokeColor" | "textColor">>;

function parseMermaidStyleProps(propsStr: string): StyleProps {
    const result: StyleProps = {};
    for (const part of propsStr.split(/[,;]/)) {
        const sep = part.indexOf(":");
        if (sep < 0) continue;
        const key = part.slice(0, sep).trim().toLowerCase();
        const val = part.slice(sep + 1).trim();
        if (!val) continue;
        if (key === "fill") result.fillColor = val;
        else if (key === "stroke") result.strokeColor = val;
        else if (key === "color") result.textColor = val;
    }
    return result;
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
export function importMermaidFlowchartDiagram(baseDiagram: Diagram, content: string): Promise<Diagram> {
    return importMermaidStructureDiagram(baseDiagram, content, { forceFlowchart: true });
}

function linkPortAlignments(direction: string | undefined, flowchartMode: boolean): [PortAlignment, PortAlignment] {
    switch (direction) {
        case "LR": return [PortAlignment.Right, PortAlignment.Left];
        case "RL": return [PortAlignment.Left, PortAlignment.Right];
        case "BT": return [PortAlignment.Top, PortAlignment.Bottom];
        default:   return [PortAlignment.Bottom, PortAlignment.Top];
    }
}

export async function importMermaidStructureDiagram(baseDiagram: Diagram, content: string, options?: ImportStructureOptions): Promise<Diagram> {
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

    const layoutHints = parseMermaidLayoutHints(content);
    const [srcPortAlignment, tgtPortAlignment] = linkPortAlignments(layoutHints.direction, flowchartMode);

    const elements: { [id: string]: any } = {};
    const nodes: { [id: string]: any } = {};
    const ports: { [id: string]: any } = {};
    const links: { [id: string]: any } = {};
    const layoutEdges: LayoutLink[] = [];
    const nodeMap: { [name: string]: string } = {};
    const subgraphMembers: { [name: string]: string[] } = {};
    const subgraphLabels: { [sid: string]: string } = {};
    const nodeParents: { [nodeId: string]: string } = {};
    const clusterParents: { [clusterId: string]: string } = {};
    const subgraphStack: string[] = [];
    const classDefs: { [name: string]: StyleProps } = {};
    const classAssignments: { [mermaidId: string]: string[] } = {};
    const inlineStyles: { [mermaidId: string]: StyleProps } = {};
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
        return label
            ?.replace(/\\n/g, "\n")
            .replace(/<br\s*\/?>/gi, "\n");
    }

    function stripLabelQuotes(label: string | undefined): string | undefined {
        if (label === undefined) return undefined;
        const trimmed = label.trim();
        if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return trimmed.slice(1, -1);
        }
        return trimmed;
    }

    function hasChainedEdge(line: string): boolean {
        // True if the line has `&` (parallel sources/targets) or 2+ arrows
        // (chained like `A --> B --> C`). Either case needs the multi-segment
        // parser; single-arrow `A --> B[...]` stays on the flowMatch path
        // which understands inline shapes.
        if (line.includes("&")) return true;
        const arrowCount = (line.match(/\s+(?:<\|--|<-->|<--|-->|---|-\.-|==>|--\.\.|--o|--\*|<->|--)\s+/g) ?? []).length;
        return arrowCount >= 2;
    }

    function splitChainSide(side: string): string[] {
        return side
            .split(/\s*&\s*/)
            .map(part => part.trim())
            .filter(part => /^[\w-]+$/.test(part));
    }

    function estimateNodeDimensions(label: string): { width: number; height: number } {
        const defaultWidth = 150;
        const maxWidth = 260;
        const charPx = 8;       // avg px/char at fontSize 14 for mixed prose
        const padding = 24;     // horizontal padding inside box
        const lines = label.split("\n");
        // Size to longest line (so prose stays on one row when it can fit), and
        // separately size to longest non-breakable token (so dotted ids/URLs aren't clipped).
        const longestLine = lines.reduce((m, l) => l.length > m ? l.length : m, 0);
        const longestToken = label.split(/[\s\n]+/).reduce((m, t) => t.length > m ? t.length : m, 0);
        const lineWidth = longestLine * charPx + padding;
        const tokenWidth = longestToken * (charPx + 1) + padding;
        const width = Math.min(maxWidth, Math.max(defaultWidth, lineWidth, tokenWidth));
        const charsPerLine = Math.max(1, Math.floor((width - padding) / charPx));
        let totalLines = 0;
        for (const segment of lines) {
            totalLines += segment.length === 0 ? 1 : Math.ceil(segment.length / charsPerLine);
        }
        return { width, height: Math.max(60, totalLines * 18 + 16) };
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
                const trimmed = label.trim();
                const node = elements[nodeId] as NodeState;
                node.text = trimmed;
                const { width, height } = estimateNodeDimensions(trimmed);
                nodes[nodeId].bounds.width = Math.max(nodes[nodeId].bounds.width, width);
                nodes[nodeId].bounds.height = Math.max(nodes[nodeId].bounds.height, height);
            }
            if (flowchartKind && flowchartMode) {
                (elements[nodeId] as NodeState).flowchartKind = flowchartKind;
            }
            // Assign parent if currently unparented and inside a subgraph
            if (subgraphStack.length > 0 && !nodeParents[nodeId]) {
                nodeParents[nodeId] = subgraphStack[subgraphStack.length - 1];
            }
            return nodeId;
        }

        const nodeId = generateId();
        const effectiveLabel = (label || normalizedName).trim();
        const { width: nodeWidth, height: nodeHeight } = estimateNodeDimensions(effectiveLabel);
        const nodesPerRow = 5;
        const spacingX = 60;
        const spacingY = 80;
        const row = Math.floor(nodeIndex / nodesPerRow);
        const col = nodeIndex % nodesPerRow;

        elements[nodeId] = {
            id: nodeId,
            type: ElementType.ClassNode,
            text: effectiveLabel,
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

        if (subgraphStack.length > 0) {
            nodeParents[nodeId] = subgraphStack[subgraphStack.length - 1];
        }

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
        const sourcePortId = createPort(fromId, srcPortAlignment);
        const targetPortId = createPort(toId, tgtPortAlignment);

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
            routeStyle: flowchartMode ? RouteStyle.OrthogonalSquare : RouteStyle.OrthogonalRounded,
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
        // Match every arrow (with optional |label|) so a single line like
        // `A --> B --> C --> D` or `A & B --> C --> D & E` yields edges
        // between each consecutive pair of segments.
        const arrowRe = /\s+(<\|--|<-->|<--|-->|---|-\.-|==>|--\.\.|--o|--\*|<->|--)\s+(?:\|([^|]+)\|\s+)?/g;
        const arrows = [...line.matchAll(arrowRe)];
        if (arrows.length === 0) return false;

        const segments: string[][] = [];
        let cursor = 0;
        for (const m of arrows) {
            segments.push(splitChainSide(line.slice(cursor, m.index)));
            cursor = m.index! + m[0].length;
        }
        segments.push(splitChainSide(line.slice(cursor)));
        if (segments.some(s => s.length === 0)) return false;

        for (let i = 0; i < arrows.length; i++) {
            const arrow = arrows[i][1];
            const edgeLabel = normalizeLabel(stripLabelQuotes(arrows[i][2]));
            for (const fromName of segments[i]) {
                for (const toName of segments[i + 1]) {
                    for (const fid of expandSubgraphRef(fromName)) {
                        for (const tid of expandSubgraphRef(toName)) {
                            createLink(getOrCreateNode(fid), getOrCreateNode(tid), arrow, edgeLabel);
                        }
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
            const [, sid, label] = subgraphMatch;
            if (subgraphStack.length > 0) {
                clusterParents[sid] = subgraphStack[subgraphStack.length - 1];
            }
            subgraphStack.push(sid);
            if (!subgraphMembers[sid]) subgraphMembers[sid] = [];
            subgraphLabels[sid] = label?.trim() ?? sid;
            continue;
        }
        if (lowerLine === "end") {
            subgraphStack.pop();
            continue;
        }

        const styleMatch = line.match(/^style\s+([\w-]+)\s+(.+?)\s*;?\s*$/);
        if (styleMatch) {
            const [, id, propsStr] = styleMatch;
            inlineStyles[id] = { ...inlineStyles[id], ...parseMermaidStyleProps(propsStr) };
            continue;
        }

        const classDefMatch = line.match(/^classDef\s+([\w-]+)\s+(.+?)\s*;?\s*$/);
        if (classDefMatch) {
            const [, name, propsStr] = classDefMatch;
            classDefs[name] = { ...classDefs[name], ...parseMermaidStyleProps(propsStr) };
            continue;
        }

        const classAssignMatch = flowchartMode
            ? line.match(/^class\s+([\w-]+(?:\s*,\s*[\w-]+)*)\s+([\w-]+)\s*;?\s*$/)
            : null;
        if (classAssignMatch) {
            const [, idsStr, className] = classAssignMatch;
            for (const id of idsStr.split(/\s*,\s*/)) {
                (classAssignments[id] ??= []).push(className);
            }
            continue;
        }

        if (flowchartMode && hasChainedEdge(line) && tryEdgeChain(line)) {
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
            const edgeLabel = normalizeLabel(stripLabelQuotes(edgeLabelBefore || edgeLabelAfter));
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

    const clusterDefs: { [sid: string]: ClusterDef } = {};
    for (const [sid, label] of Object.entries(subgraphLabels)) {
        clusterDefs[sid] = { label };
    }

    // For flowcharts, normalize node widths within each compound to the
    // widest member. Filigree's Brandes-Köpf placer pins same-column nodes
    // by their left edge; varying widths leave centers misaligned, which
    // our orthogonal edge router exposes as a horizontal jog mid-edge.
    // Uniform widths within a compound make centers line up.
    if (flowchartMode) {
        const ROOT_GROUP = "__root__";
        const widthByGroup = new Map<string, number>();
        for (const [nodeId, n] of Object.entries(nodes)) {
            const group = nodeParents[nodeId] ?? ROOT_GROUP;
            const cur = widthByGroup.get(group) ?? 0;
            if (n.bounds.width > cur) widthByGroup.set(group, n.bounds.width);
        }
        for (const [nodeId, n] of Object.entries(nodes)) {
            const group = nodeParents[nodeId] ?? ROOT_GROUP;
            const max = widthByGroup.get(group);
            if (max && n.bounds.width < max) n.bounds.width = max;
        }
    }

    // Preserve Mermaid declaration order across sibling targets: for every
    // source node, chain consecutive outgoing targets with OrderBefore hints.
    // Filigree honors these in its layered algorithm when the pair lands on
    // the same layer.
    const targetsBySource = new Map<string, string[]>();
    for (const edge of layoutEdges) {
        const list = targetsBySource.get(edge.source);
        if (list) list.push(edge.target);
        else targetsBySource.set(edge.source, [edge.target]);
    }
    const orderHints: OrderHint[] = [];
    for (const targets of targetsBySource.values()) {
        for (let i = 1; i < targets.length; i++) {
            orderHints.push({before: targets[i - 1], after: targets[i]});
        }
    }

    const clusterBoundsById = await applyAutoLayout(nodes, layoutEdges, layoutHints, clusterDefs, nodeParents, clusterParents, orderHints);

    const clusterMembers: { [clusterId: string]: string[] } = {};
    for (const [nodeId, clusterId] of Object.entries(nodeParents)) {
        (clusterMembers[clusterId] ??= []).push(nodeId);
    }
    for (const [childClusterId, parentClusterId] of Object.entries(clusterParents)) {
        (clusterMembers[parentClusterId] ??= []).push(childClusterId);
    }

    for (const [clusterId, bounds] of Object.entries(clusterBoundsById)) {
        nodes[clusterId] = { bounds };
        elements[clusterId] = {
            id: clusterId,
            type: ElementType.Cluster,
            text: subgraphLabels[clusterId] ?? clusterId,
            ports: [],
            colorSchema: defaultColorSchema,
            memberNodeIds: clusterMembers[clusterId] ?? []
        } as NodeState;
    }

    function applyStyleToTarget(mermaidId: string, props: StyleProps): void {
        const target = elements[nodeMap[mermaidId] ?? mermaidId] as NodeState | undefined;
        if (!target) return;
        const base = target.colorSchema ?? defaultColorSchema;
        target.colorSchema = {
            strokeColor: props.strokeColor ?? props.fillColor ?? base.strokeColor,
            fillColor: props.fillColor ?? base.fillColor,
            textColor: props.textColor ?? base.textColor,
            rawColors: true
        };
    }

    for (const [mermaidId, classNames] of Object.entries(classAssignments)) {
        for (const className of classNames) {
            const props = classDefs[className];
            if (props) applyStyleToTarget(mermaidId, props);
        }
    }
    for (const [mermaidId, props] of Object.entries(inlineStyles)) {
        applyStyleToTarget(mermaidId, props);
    }

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

    if (options?.out) {
        const o = options.out;
        for (const [k, v] of Object.entries(nodeMap)) o.nodeMap.set(k, v);
        for (const [k, v] of Object.entries(subgraphLabels)) o.subgraphLabels.set(k, v);
        for (const [nodeId, parentSid] of Object.entries(nodeParents)) o.nodeParents.set(nodeId, parentSid);
        o.layoutEdges = [...layoutEdges];
        Object.assign(o.clusterDefs, clusterDefs);
        Object.assign(o.clusterParents, clusterParents);
        o.layoutHints = {...layoutHints};
    }

    return result as StructureDiagramState;
}

