import {Id} from "../../package/packageModel";
import {DiagramId} from "../diagramEditor/diagramEditorModel";
import {demoActiveDiagramId, demoOpenDiagramIds} from "../demo/demoConstants";
import {persistentAtom} from "../../common/state/persistentAtoms";

/**
 * Atom representing the currently active diagram ID
 */
export const activeDiagramIdAtom = persistentAtom<Id>("activeDiagramId", demoActiveDiagramId);

/**
 * Atom representing the list of open diagram IDs
 */
export const openDiagramIdsAtom = persistentAtom<DiagramId[]>("openDiagramIds", demoOpenDiagramIds);
