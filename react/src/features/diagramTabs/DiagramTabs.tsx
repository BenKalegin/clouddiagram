import React, { useRef } from "react";
import { Stack, Tabs, Box, IconButton, Menu } from "@mui/material";
import { LinkToNewDialog } from "../dialogs/LinkToNewDialog";
import { useRecoilState, useRecoilValue } from "recoil";
import { ElementType } from "../../package/packageModel";
import {
    diagramKindSelector,
    exportingAtom,
    importingAtom,
    linkingAtom, showContextAtom
} from "../diagramEditor/diagramEditorModel";
import { activeDiagramIdAtom, openDiagramIdsAtom } from "./diagramTabsModel";
import { addDiagramTabAction, useDispatch } from "../diagramEditor/diagramEditorSlice";
import Konva from "konva";
import AddIcon from '@mui/icons-material/Add';
import MenuItem from '@mui/material/MenuItem';
import { PlainTab, TabHeight } from "./DiagramTab";
import { ExportDialog } from "../dialogs/ExportDialog";
import { ImportDialog } from "../dialogs/ImportDialog";
import { ContextPopup } from "../dialogs/ContextPopup";
import { useZoom } from "./ZoomControls";
import { usePanZoomHandlers } from "./PanZoomHandler";
import { useKeyboardShortcuts } from "./KeyboardShortcutsHandler";
import { DiagramStage } from "./DiagramStage";
import { ZoomControls } from "./ZoomControls";


function AddNewTabButton() {
    const dispatch = useDispatch()
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (diagramKind: ElementType) => {
        setAnchorEl(null);
        dispatch(addDiagramTabAction({diagramKind}));
    };

    return (
        <div style={{lineHeight: "3em"}}>
            <IconButton
                data-testid="add-diagram-button"
                onClick={handleClick}
                size="small"
            >
                <AddIcon fontSize="inherit" />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                <MenuItem data-testid="add-class-diagram" onClick={() => handleClose(ElementType.ClassDiagram)}>Class Diagram</MenuItem>
                <MenuItem data-testid="add-deployment-diagram" onClick={() => handleClose(ElementType.DeploymentDiagram)}>Deployment Diagram</MenuItem>
                <MenuItem data-testid="add-sequence-diagram" onClick={() => handleClose(ElementType.SequenceDiagram)}>Sequence Diagram</MenuItem>
            </Menu>
        </div>
    );
}

export const DiagramTabs = () => {
    const [activeDiagramId, setActiveDiagramId] = useRecoilState(activeDiagramIdAtom);
    const openDiagramIds = useRecoilValue(openDiagramIdsAtom);
    const linking = useRecoilValue(linkingAtom)
    const exporting = useRecoilValue(exportingAtom)
    const importing = useRecoilValue(importingAtom)
    const showingContext = useRecoilValue(showContextAtom)
    const diagramKind = useRecoilValue(diagramKindSelector(activeDiagramId!))

    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage>(null);

    const WIDTH = 3000;
    const HEIGHT = 3000;
    const PADDING = 500;

    // Use the extracted hooks
    const {
        scale,
        position,
        setScale,
        setPosition,
        handleZoomIn,
        handleZoomOut,
        handleZoomToFit,
        handleSliderChange
    } = useZoom(stageRef, scrollContainerRef, WIDTH, HEIGHT);

    usePanZoomHandlers({
        stageRef,
        containerRef,
        scrollContainerRef,
        scale,
        setScale,
        position,
        setPosition,
        padding: PADDING
    });

    useKeyboardShortcuts({ activeDiagramId });

    const handleTabChange = (_unused: React.SyntheticEvent, newValue: number) => {
        setActiveDiagramId(openDiagramIds[newValue]);
    }

    return (
        <Stack direction="column" spacing="2" sx={{ flex: 1 }}>
            <Stack direction="row" spacing="2" alignItems="center">
                <Tabs
                    sx={{height: TabHeight, minHeight: TabHeight}}
                    value={openDiagramIds.indexOf(activeDiagramId!)}
                    onChange={handleTabChange}
                    aria-label="Open diagrams"
                >
                    {openDiagramIds.map((diagramId, index) =>
                        <PlainTab key={index} diagram_id={diagramId} />
                    )}
                </Tabs>
                <AddNewTabButton/>
            </Stack>
            {/*We will use small canvas with the size of the screen*/}
            {/*We will create container with required size (3000x3000), so native scrollbars will be visible*/}
            {/*When user is trying to scroll, we will apply css transform for the stage container so it will be still in the center of user's screen*/}
            {/*We will move all nodes so it looks like you scroll (by changing stage position)*/}
            <Box
                ref={scrollContainerRef}
                sx={{
                    width: 'calc(100vw - 240px)',
                    height: 'calc(100vh - 170px)',
                    overflow: 'auto',
                    margin: '0px',
                    border: '0px solid grey',
                }}
            >
                <DiagramStage
                    activeDiagramId={activeDiagramId!}
                    stageRef={stageRef}
                    scrollContainerRef={scrollContainerRef}
                    containerRef={containerRef}
                    scale={scale}
                    position={position}
                    width={WIDTH}
                    height={HEIGHT}
                    padding={PADDING}
                />
            </Box>

            {/* Zoom controls */}
            <ZoomControls
                scale={scale}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomToFit={handleZoomToFit}
                onSliderChange={handleSliderChange}
            />

            {linking && linking.showLinkToNewDialog && <LinkToNewDialog/>}
            {exporting &&  <ExportDialog diagramKind={diagramKind} getStage={() => stageRef.current}/>}
            {importing &&  <ImportDialog diagramKind={diagramKind} />}
            {showingContext && <ContextPopup  {...showingContext} />}
        </Stack>
    )
}
