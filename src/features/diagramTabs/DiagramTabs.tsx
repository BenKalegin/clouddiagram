import { LinkToNewDialog } from "../dialogs/LinkToNewDialog";
import { useAtomValue } from "jotai";
import {
    exportingAtom,
    importingAtom,
    linkingAtom, showContextAtom,
    diagramKindSelector
} from "../diagramEditor/diagramEditorModel";
import { activeDiagramIdAtom } from "./diagramTabsModel";
import { ExportDialog } from "../dialogs/ExportDialog";
import { ImportDialog } from "../dialogs/ImportDialog";
import { ContextPopup } from "../dialogs/ContextPopup";
import { DiagramContainer } from "./DiagramContainer";
import "./DiagramTabs.css";

export const DiagramTabs = () => {
    const activeDiagramId = useAtomValue(activeDiagramIdAtom);
    const linking = useAtomValue(linkingAtom);
    const exporting = useAtomValue(exportingAtom);
    const importing = useAtomValue(importingAtom);
    const showingContext = useAtomValue(showContextAtom);
    const diagramKind = useAtomValue(diagramKindSelector(activeDiagramId!));

    return (
        <div className="diagram-tabs-root">
            <DiagramContainer />
            {linking && linking.showLinkToNewDialog && <LinkToNewDialog/>}
            {exporting && <ExportDialog diagramKind={diagramKind} getStage={() => null}/>}
            {importing && <ImportDialog diagramKind={diagramKind} />}
            {showingContext && <ContextPopup {...showingContext} />}
        </div>
    );
};
