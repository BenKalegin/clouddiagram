import {atom} from "recoil";
import {Id} from "../../package/packageModel";
import {DiagramId} from "../diagramEditor/diagramEditorModel";
import {demoActiveDiagramId, demoOpenDiagramIds} from "../demo/demoConstants";

/**
 * Atom representing the currently active diagram ID
 */
export const activeDiagramIdAtom = atom<Id>({
    key: 'activeDiagramId',
    default: demoActiveDiagramId
});

/**
 * Atom representing the list of open diagram IDs
 */
export const openDiagramIdsAtom = atom<DiagramId[]>({
    key: 'openDiagrams',
    default: demoOpenDiagramIds
});
