import {atom} from "jotai";
import {Diagram} from "../common/model";
import {ColorSchema, DiagramElement} from "../package/packageModel";
import {defaultColorSchema} from "../common/colors/colorSchemas";
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
import type {Get, Set, JotaiStore} from "../common/state/jotaiShim";

/**
 * Monotonically incremented whenever any state change should fire `onChange`
 * notifications to embedders (e.g., axonize). Replaces Recoil's
 * `useRecoilTransactionObserver_UNSTABLE` semantics.
 */
export const documentVersionAtom = atom<number>(0);

export function bumpDocumentVersion(set: Set): void {
    set(documentVersionAtom, (v) => v + 1);
}

function applyColorSchemaOverride(element: DiagramElement, override: ColorSchema): DiagramElement {
    const el = element as DiagramElement & { colorSchema?: ColorSchema };
    if (
        el.colorSchema &&
        el.colorSchema.fillColor === defaultColorSchema.fillColor &&
        el.colorSchema.strokeColor === defaultColorSchema.strokeColor
    ) {
        return {...el, colorSchema: {...override, rawColors: true}} as DiagramElement;
    }
    return element;
}

export function hydrateCloudDiagramDocument(
    document: CloudDiagramDocument,
    set: Set,
    overrideDefaultColorSchema?: ColorSchema
): void {
    const elementIds = Object.keys(document.elements);

    set(activeDiagramIdAtom, document.diagram.id);
    set(openDiagramIdsAtom, [document.diagram.id]);
    set(elementsAtom(document.diagram.id), document.diagram);
    set(elementIdsAtom, elementIds);

    elementIds.forEach(id => {
        const element = overrideDefaultColorSchema
            ? applyColorSchemaOverride(document.elements[id], overrideDefaultColorSchema)
            : document.elements[id];
        set(elementsAtom(id), element);
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

export function getCloudDiagramDocumentFromStore(store: JotaiStore): CloudDiagramDocument | undefined {
    return getCloudDiagramDocument((atom) => store.get(atom));
}

/**
 * Subscribes to the atoms whose changes should trigger embedder onChange
 * notifications. Returns an unsubscribe.
 */
export function subscribeToDocumentChanges(
    store: JotaiStore,
    listener: () => void
): () => void {
    const unsubs: Array<() => void> = [];

    const watch = (a: Parameters<JotaiStore["sub"]>[0]) => {
        unsubs.push(store.sub(a, listener));
    };

    watch(activeDiagramIdAtom);
    watch(openDiagramIdsAtom);
    watch(elementIdsAtom);

    // For elementsAtom (atomFamily), subscribe per current id.
    // New ids appearing later are picked up via the elementIdsAtom subscription
    // by re-subscribing in the listener wrapper below.
    const elementUnsubs = new Map<string, () => void>();

    const refreshElementSubs = () => {
        const ids = new Set(store.get(elementIdsAtom));
        // Remove subs for ids no longer present
        for (const [id, off] of elementUnsubs) {
            if (!ids.has(id)) {
                off();
                elementUnsubs.delete(id);
            }
        }
        // Add subs for new ids
        for (const id of ids) {
            if (!elementUnsubs.has(id)) {
                elementUnsubs.set(id, store.sub(elementsAtom(id), listener));
            }
        }
    };

    refreshElementSubs();
    unsubs.push(store.sub(elementIdsAtom, refreshElementSubs));

    return () => {
        for (const off of elementUnsubs.values()) off();
        elementUnsubs.clear();
        for (const off of unsubs) off();
    };
}
