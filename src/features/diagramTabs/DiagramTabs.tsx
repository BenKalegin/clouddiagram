import React from "react";
import { Stack, Tabs } from "@mui/material";
import { LinkToNewDialog } from "../dialogs/LinkToNewDialog";
import {useAtom, useAtomValue} from "jotai";
import {
    exportingAtom,
    importingAtom,
    linkingAtom, showContextAtom,
    diagramKindSelector
} from "../diagramEditor/diagramEditorModel";
import { activeDiagramIdAtom, openDiagramIdsAtom } from "./diagramTabsModel";
import { PlainTab, TabHeight } from "./DiagramTab";
import { ExportDialog } from "../dialogs/ExportDialog";
import { ImportDialog } from "../dialogs/ImportDialog";
import { ContextPopup } from "../dialogs/ContextPopup";
import { AddNewTabButton } from "./AddNewTabButton";
import { DiagramContainer } from "./DiagramContainer";

export const DiagramTabs = () => {
    const [activeDiagramId, setActiveDiagramId] = useAtom(activeDiagramIdAtom);
    const openDiagramIds = useAtomValue(openDiagramIdsAtom);
    const linking = useAtomValue(linkingAtom)
    const exporting = useAtomValue(exportingAtom)
    const importing = useAtomValue(importingAtom)
    const showingContext = useAtomValue(showContextAtom)
    const diagramKind = useAtomValue(diagramKindSelector(activeDiagramId!))

    const handleTabChange = (_unused: React.SyntheticEvent, newValue: number) => {
        setActiveDiagramId(openDiagramIds[newValue]);
    }

    return (
        <Stack direction="column" spacing="2" sx={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
            <Stack direction="row" spacing="2" alignItems="center">
                <Tabs
                    sx={{height: TabHeight, minHeight: TabHeight}}
                    value={openDiagramIds.indexOf(activeDiagramId!) !== -1 ? openDiagramIds.indexOf(activeDiagramId!) : 0}
                    onChange={handleTabChange}
                    aria-label="Open diagrams"
                >
                    {openDiagramIds.map((diagramId, index) =>
                        <PlainTab key={index} diagram_id={diagramId} />
                    )}
                </Tabs>
                <AddNewTabButton/>
            </Stack>
            <DiagramContainer />
            {linking && linking.showLinkToNewDialog && <LinkToNewDialog/>}
            {exporting &&  <ExportDialog diagramKind={diagramKind} getStage={() => null}/>}
            {importing &&  <ImportDialog diagramKind={diagramKind} />}
            {showingContext && <ContextPopup  {...showingContext} />}
        </Stack>
    )
}

