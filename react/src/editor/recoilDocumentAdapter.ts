import type {Snapshot} from "recoil";
import {RecoilState, RecoilValue} from "recoil";
import {Diagram} from "../common/model";
import {DiagramElement} from "../package/packageModel";
import {
    elementIdsAtom,
    elementsAtom,
    exportingAtom,
    importingAtom,
    linkingAtom,
    showContextAtom
} from "../features/diagramEditor/diagramEditorModel";
import {activeDiagramIdAtom, openDiagramIdsAtom} from "../features/diagramTabs/diagramTabsModel";
import {historyAtom} from "../features/diagramEditor/historyModel";
import {
    CloudDiagramDocument,
    createCloudDiagramDocument
} from "../features/export/CloudDiagramFormat";

type Get = <T>(recoilValue: RecoilValue<T>) => T;
type Set = <T>(recoilState: RecoilState<T>, value: T | ((current: T) => T)) => void;

export function hydrateCloudDiagramDocument(document: CloudDiagramDocument, set: Set): void {
    const elementIds = Object.keys(document.elements);

    set(activeDiagramIdAtom, document.diagram.id);
    set(openDiagramIdsAtom, [document.diagram.id]);
    set(elementsAtom(document.diagram.id), document.diagram);
    set(elementIdsAtom, elementIds);

    elementIds.forEach(id => {
        set(elementsAtom(id), document.elements[id]);
    });

    set(linkingAtom, undefined);
    set(exportingAtom, undefined);
    set(importingAtom, undefined);
    set(showContextAtom, undefined);
    set(historyAtom, {
        past: [],
        future: [],
        maxHistoryLength: 50
    });
}

export function getCloudDiagramDocument(get: Get): CloudDiagramDocument | undefined {
    const activeDiagramId = get(activeDiagramIdAtom);
    if (!activeDiagramId) {
        return undefined;
    }

    const diagram = get(elementsAtom(activeDiagramId)) as Diagram;
    if (!diagram || diagram.id === "") {
        return undefined;
    }

    return createCloudDiagramDocument(diagram, id => get(elementsAtom(id)) as DiagramElement);
}

export function getCloudDiagramDocumentFromSnapshot(snapshot: Snapshot): CloudDiagramDocument | undefined {
    return getCloudDiagramDocument(atom => {
        const loadable = snapshot.getLoadable(atom);
        if (loadable.state !== "hasValue") {
            throw new Error("Cannot read CloudDiagram document from an unresolved Recoil snapshot");
        }
        return loadable.contents;
    });
}
