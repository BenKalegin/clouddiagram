import { useRecoilCallback } from 'recoil';
import { elementsAtom, elementIdsAtom } from '../../features/diagramEditor/diagramEditorModel';
import { activeDiagramIdAtom, openDiagramIdsAtom } from '../../features/diagramTabs/diagramTabsModel';

/**
 * Recovery service for recovering diagrams from persisted state
 */
export class RecoveryService {
    /**
     * Hook to recover diagrams from persisted state
     * @returns A function that recovers diagrams from persisted state
     */
    static useRecoverDiagrams = () => {
        return useRecoilCallback(({ snapshot, set }) => async () => {
            try {
                // Check if we have a persisted state
                const elementIds = await snapshot.getPromise(elementIdsAtom);
                const activeDiagramId = await snapshot.getPromise(activeDiagramIdAtom);
                const openDiagramIds = await snapshot.getPromise(openDiagramIdsAtom);

                // If we have a persisted state, load all elements
                if (elementIds.length > 0) {

                    // Load all elements
                    for (const id of elementIds) {
                        const element = await snapshot.getPromise(elementsAtom(id));
                        if (element && element.id !== '') {
                            set(elementsAtom(id), element);
                        }
                    }

                    // Ensure the active diagram is in open diagrams
                    if (activeDiagramId && !openDiagramIds.includes(activeDiagramId)) {
                        set(openDiagramIdsAtom, [...openDiagramIds, activeDiagramId]);
                    }

                    return true;
                }

                return false;
            } catch (error) {
                console.error('Error recovering diagrams:', error);
                return false;
            }
        });
    };
}
