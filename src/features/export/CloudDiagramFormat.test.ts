import {
    CLOUD_DIAGRAM_SCHEMA_VERSION,
    CloudDiagramDocument,
    createCloudDiagramDocument,
    importCloudDiagram
} from "./CloudDiagramFormat";
import {Diagram} from "../../common/model";
import {
    defaultCornerStyle,
    defaultRouteStyle,
    ElementType,
    LinkState,
    NodeState,
    PortAlignment,
    PortState,
    TipStyle
} from "../../package/packageModel";
import {StructureDiagramState} from "../structureDiagram/structureDiagramState";
import {defaultColorSchema} from "../../common/colors/colorSchemas";

const baseDiagram: Diagram = {
    id: "active-diagram",
    type: ElementType.ClassDiagram,
    selectedElements: [],
    notes: {},
    display: {
        width: 1000,
        height: 1000,
        scale: 1,
        offset: {x: 0, y: 0}
    }
};

const node: NodeState = {
    id: "node-1",
    type: ElementType.ClassNode,
    text: "Node",
    ports: ["port-1"],
    colorSchema: defaultColorSchema
};

const port: PortState = {
    id: "port-1",
    type: ElementType.ClassPort,
    nodeId: node.id,
    links: ["link-1"],
    depthRatio: 50,
    latitude: 8,
    longitude: 8
};

const link: LinkState = {
    id: "link-1",
    type: ElementType.ClassLink,
    port1: port.id,
    port2: port.id,
    tipStyle1: TipStyle.None,
    tipStyle2: TipStyle.Arrow,
    routeStyle: defaultRouteStyle,
    cornerStyle: defaultCornerStyle,
    colorSchema: defaultColorSchema
};

const structureDiagram: StructureDiagramState = {
    ...baseDiagram,
    selectedElements: [{id: node.id, type: node.type}],
    nodes: {
        [node.id]: {
            bounds: {x: 10, y: 20, width: 100, height: 80}
        }
    },
    ports: {
        [port.id]: {
            alignment: PortAlignment.Right,
            edgePosRatio: 50
        }
    },
    links: {
        [link.id]: {}
    }
};

const elements = {
    [node.id]: node,
    [port.id]: port,
    [link.id]: link
};

describe("CloudDiagramFormat", () => {
    it("creates a versioned document with all referenced structure elements", () => {
        const document = createCloudDiagramDocument(
            structureDiagram,
            id => elements[id]
        );

        expect(document.schemaVersion).toBe(CLOUD_DIAGRAM_SCHEMA_VERSION);
        expect(document.diagram.id).toBe(structureDiagram.id);
        expect(document.diagram.selectedElements).toEqual([]);
        expect(document.elements).toEqual(elements);
    });

    it("fails fast when a referenced element cannot be resolved", () => {
        expect(() => createCloudDiagramDocument(structureDiagram))
            .toThrow("missing element 'node-1'");
    });

    it("imports a document into the active diagram id and returns detached elements", () => {
        const document: CloudDiagramDocument = {
            schemaVersion: CLOUD_DIAGRAM_SCHEMA_VERSION,
            diagram: {
                ...structureDiagram,
                id: "exported-diagram"
            },
            elements
        };

        const result = importCloudDiagram(baseDiagram, JSON.stringify(document));

        expect(result.diagram.id).toBe(baseDiagram.id);
        expect(result.diagram.selectedElements).toEqual([]);
        expect(result.elements).toEqual(elements);
    });

    it("imports legacy root-diagram JSON", () => {
        const result = importCloudDiagram(baseDiagram, JSON.stringify(structureDiagram));

        expect(result.diagram.id).toBe(baseDiagram.id);
        expect(result.elements).toEqual({});
    });
});
