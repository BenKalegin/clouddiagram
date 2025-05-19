import React from "react";
import { Stack, Tabs } from "@mui/material";
import { LinkToNewDialog } from "../dialogs/LinkToNewDialog";
import {useRecoilState, useRecoilValue} from "recoil";
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
    const [activeDiagramId, setActiveDiagramId] = useRecoilState(activeDiagramIdAtom);
    const openDiagramIds = useRecoilValue(openDiagramIdsAtom);
    const linking = useRecoilValue(linkingAtom)
    const exporting = useRecoilValue(exportingAtom)
    const importing = useRecoilValue(importingAtom)
    const showingContext = useRecoilValue(showContextAtom)
    const diagramKind = useRecoilValue(diagramKindSelector(activeDiagramId!))

    const handleTabChange = (_unused: React.SyntheticEvent, newValue: number) => {
        setActiveDiagramId(openDiagramIds[newValue]);
    }

    return (
        <Stack direction="column" spacing="2" sx={{ flex: 1 }}>
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

