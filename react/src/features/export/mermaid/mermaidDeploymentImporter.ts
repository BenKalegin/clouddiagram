import {Diagram} from "../../../common/model";
import {ElementType, NodeState, PictureLayout} from "../../../package/packageModel";
import {computeDisplaySize, importMermaidStructureDiagram, StructureImportOut} from "./mermaidStructureImporter";
import {detectIcon, iconHints} from "../../graphics/iconHints";
import {PredefinedSvg} from "../../graphics/graphicsReader";
import {applyAutoLayout} from "../../layout/autoLayout";
import {ClusterPlacement} from "../../structureDiagram/structureDiagramState";

const ICON_SIZE = 100;
const LABEL_LINE_HEIGHT = 18;
const LABEL_PADDING = 10;
const CHARS_PER_LINE = Math.floor(ICON_SIZE / 8);

function iconNodeHeight(label: string): number {
    const lines = Math.max(1, Math.ceil(label.length / CHARS_PER_LINE));
    return ICON_SIZE + lines * LABEL_LINE_HEIGHT + LABEL_PADDING;
}

export function importMermaidDeploymentDiagram(baseDiagram: Diagram, content: string): Diagram {
    const out: StructureImportOut = {
        nodeMap: new Map(),
        subgraphLabels: new Map(),
        nodeParents: new Map(),
        layoutEdges: [],
        clusterDefs: {},
        clusterParents: {},
        layoutHints: {},
    };

    const result = importMermaidStructureDiagram(baseDiagram, content, {forceFlowchart: true, out}) as any;

    // Detect icons for subgraphs (parent context for children)
    const subgraphIcons = new Map<string, { icon: PredefinedSvg; inherit: boolean }>();
    for (const [sid, label] of out.subgraphLabels) {
        const icon = detectIcon(sid, label);
        if (icon !== undefined) {
            const hint = iconHints.find(h => h.icon === icon);
            subgraphIcons.set(sid, {icon, inherit: hint?.inheritChildren ?? false});
        }
    }

    let anyIcons = false;
    const mermaidHintNodes: { [mermaidId: string]: { icon: string } } = {};
    for (const [mermaidId, nodeId] of out.nodeMap) {
        const node = result.elements[nodeId] as NodeState | undefined;
        if (!node || node.type !== ElementType.ClassNode) continue;

        const parentSid = out.nodeParents.get(nodeId);
        const parentInfo = parentSid ? subgraphIcons.get(parentSid) : undefined;

        const icon = detectIcon(mermaidId, node.text ?? "", parentInfo?.icon, parentInfo?.inherit);
        if (icon === undefined) continue;

        node.customShape = {pictureId: icon, layout: PictureLayout.FullIconTextBelow};
        node.flowchartKind = undefined;
        mermaidHintNodes[mermaidId] = {icon: (PredefinedSvg[icon] as string).toLowerCase()};

        const placement = result.nodes[nodeId];
        if (placement?.bounds) {
            placement.bounds.width = ICON_SIZE;
            placement.bounds.height = iconNodeHeight(node.text ?? mermaidId);
        }
        anyIcons = true;
    }

    if (!anyIcons) return result;

    const clusterBoundsById = applyAutoLayout(
        result.nodes,
        out.layoutEdges,
        {...out.layoutHints, nodeSep: 30},
        out.clusterDefs,
        Object.fromEntries(out.nodeParents),
        out.clusterParents
    );

    const clusters: { [id: string]: ClusterPlacement } = {};
    for (const [clusterId, bounds] of Object.entries(clusterBoundsById)) {
        clusters[clusterId] = {bounds, label: out.subgraphLabels.get(clusterId) ?? clusterId};
    }

    const {width, height} = computeDisplaySize(result.nodes);

    return {
        ...result,
        type: ElementType.DeploymentDiagram,
        mermaidHints: {nodes: mermaidHintNodes},
        clusters: Object.keys(clusters).length > 0 ? clusters : undefined,
        display: {...result.display, width, height}
    };
}
