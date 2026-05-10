import { Tabs, TabList } from "@benkalegin/ui26";
import { LinkToNewDialog } from "../dialogs/LinkToNewDialog";
import { useAtom, useAtomValue } from "jotai";
import {
    exportingAtom,
    importingAtom,
    linkingAtom, showContextAtom,
    diagramKindSelector
} from "../diagramEditor/diagramEditorModel";
import { activeDiagramIdAtom, openDiagramIdsAtom } from "./diagramTabsModel";
import { PlainTab } from "./DiagramTab";
import { ExportDialog } from "../dialogs/ExportDialog";
import { ImportDialog } from "../dialogs/ImportDialog";
import { ContextPopup } from "../dialogs/ContextPopup";
import { AddNewTabButton } from "./AddNewTabButton";
import { DiagramContainer } from "./DiagramContainer";
import "./DiagramTabs.css";

export const DiagramTabs = () => {
    const [activeDiagramId, setActiveDiagramId] = useAtom(activeDiagramIdAtom);
    const openDiagramIds = useAtomValue(openDiagramIdsAtom);
    const linking = useAtomValue(linkingAtom);
    const exporting = useAtomValue(exportingAtom);
    const importing = useAtomValue(importingAtom);
    const showingContext = useAtomValue(showContextAtom);
    const diagramKind = useAtomValue(diagramKindSelector(activeDiagramId!));

    return (
        <div className="diagram-tabs-root">
            <div className="diagram-tabs-row">
                <Tabs value={activeDiagramId ?? ""} onValueChange={setActiveDiagramId}>
                    <TabList ariaLabel="Open diagrams" className="diagram-tabs-list">
                        {openDiagramIds.map((diagramId) => (
                            <PlainTab key={diagramId} diagram_id={diagramId} />
                        ))}
                    </TabList>
                </Tabs>
                <AddNewTabButton/>
            </div>
            <DiagramContainer />
            {linking && linking.showLinkToNewDialog && <LinkToNewDialog/>}
            {exporting && <ExportDialog diagramKind={diagramKind} getStage={() => null}/>}
            {importing && <ImportDialog diagramKind={diagramKind} />}
            {showingContext && <ContextPopup {...showingContext} />}
        </div>
    );
};
