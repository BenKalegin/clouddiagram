import { useRecoilCallback } from 'recoil';
import { elementsAtom, elementIdsAtom } from '../diagramEditor/diagramEditorModel';
import { activeDiagramIdAtom, openDiagramIdsAtom } from '../diagramTabs/diagramTabsModel';

export const useRecoverDiagrams = () => {
    return useRecoilCallback(({ snapshot, set }) => async () => {
        try {
            // Check if we have persisted state
            const elementIds = await snapshot.getPromise(elementIdsAtom);
            const activeDiagramId = await snapshot.getPromise(activeDiagramIdAtom);
            const openDiagramIds = await snapshot.getPromise(openDiagramIdsAtom);

            // If we have persisted state, load all elements
            if (elementIds.length > 0) {
                console.log('Recovering diagrams from persisted state...');

                // Load all elements
                for (const id of elementIds) {
                    const element = await snapshot.getPromise(elementsAtom(id));
                    if (element && element.id !== '') {
                        set(elementsAtom(id), element);
                    }
                }

                // Ensure active diagram is in open diagrams
                if (activeDiagramId && !openDiagramIds.includes(activeDiagramId)) {
                    set(openDiagramIdsAtom, [...openDiagramIds, activeDiagramId]);
                }

                console.log('Diagrams recovered successfully');
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error recovering diagrams:', error);
            return false;
        }
    });
};
