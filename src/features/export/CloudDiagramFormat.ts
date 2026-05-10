import {Diagram} from "../../common/model";
import {DiagramElement, Id} from "../../package/packageModel";
import type Konva from "konva";

type Stage = Konva.Stage;

export const CLOUD_DIAGRAM_SCHEMA_VERSION = 1;

export interface CloudDiagramDocument {
    schemaVersion: typeof CLOUD_DIAGRAM_SCHEMA_VERSION;
    diagram: Diagram;
    elements: Record<Id, DiagramElement>;
}

export interface CloudDiagramImportResult {
    diagram: Diagram;
    elements: Record<Id, DiagramElement>;
}

export type ElementResolver = (id: Id) => DiagramElement | undefined;

export function exportAsCloudDiagram(
    baseDiagram: Diagram,
    _stage?: Stage | null,
    resolveElement?: ElementResolver
): string {
    return JSON.stringify(createCloudDiagramDocument(baseDiagram, resolveElement), null, 2);
}

export function createCloudDiagramDocument(
    baseDiagram: Diagram,
    resolveElement?: ElementResolver
): CloudDiagramDocument {
    const diagram = stripEmbeddedElements({
        ...baseDiagram,
        selectedElements: []
    });

    return {
        schemaVersion: CLOUD_DIAGRAM_SCHEMA_VERSION,
        diagram,
        elements: collectReferencedElements(diagram, baseDiagram, resolveElement)
    };
}

export function importCloudDiagram(baseDiagram: Diagram, content: string): CloudDiagramImportResult {
    const parsed = JSON.parse(content);
    const document = toCloudDiagramDocument(parsed);

    return {
        diagram: {
            ...document.diagram,
            id: baseDiagram.id,
            selectedElements: []
        },
        elements: document.elements
    };
}

function toCloudDiagramDocument(parsed: unknown): CloudDiagramDocument {
    if (isCloudDiagramDocument(parsed)) {
        return {
            schemaVersion: CLOUD_DIAGRAM_SCHEMA_VERSION,
            diagram: stripEmbeddedElements(parsed.diagram),
            elements: parsed.elements ?? {}
        };
    }

    const legacyDiagram = parsed as Diagram & { elements?: Record<Id, DiagramElement> };
    return {
        schemaVersion: CLOUD_DIAGRAM_SCHEMA_VERSION,
        diagram: stripEmbeddedElements(legacyDiagram),
        elements: legacyDiagram.elements ?? {}
    };
}

function isCloudDiagramDocument(value: unknown): value is CloudDiagramDocument {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<CloudDiagramDocument>;
    return candidate.schemaVersion === CLOUD_DIAGRAM_SCHEMA_VERSION
        && !!candidate.diagram
        && typeof candidate.diagram === "object";
}

function collectReferencedElements(
    diagram: Diagram,
    sourceDiagram: Diagram,
    resolveElement?: ElementResolver
): Record<Id, DiagramElement> {
    const embeddedElements = (sourceDiagram as Diagram & { elements?: Record<Id, DiagramElement> }).elements ?? {};
    const elements: Record<Id, DiagramElement> = {};

    for (const id of getReferencedElementIds(diagram)) {
        const element = embeddedElements[id] ?? resolveElement?.(id);
        if (!element) {
            throw new Error(`Cannot export CloudDiagram: missing element '${id}'`);
        }
        elements[id] = element;
    }

    return elements;
}

function getReferencedElementIds(diagram: Diagram): Id[] {
    const collections = ["nodes", "ports", "links"] as const;
    const ids = new Set<Id>();
    const indexedDiagram = diagram as Diagram & Record<string, Record<Id, unknown> | undefined>;

    for (const collection of collections) {
        for (const id of Object.keys(indexedDiagram[collection] ?? {})) {
            ids.add(id);
        }
    }

    return Array.from(ids);
}

function stripEmbeddedElements<T extends Diagram>(diagram: T & { elements?: Record<Id, DiagramElement> }): T {
    const {elements: _unused, ...diagramWithoutElements} = diagram;
    return diagramWithoutElements as T;
}
