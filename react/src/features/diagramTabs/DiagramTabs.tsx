import React, {useRef, useState, useEffect} from "react";
import {ClassDiagramEditor} from "../classDiagram/ClassDiagramEditor";
import {SequenceDiagramEditor} from "../sequenceDiagram/SequenceDiagramEditor";
import {HtmlDrop} from "./HtmlDrop";
import {IconButton, Menu, Stack, Tabs} from "@mui/material";
import {LinkToNewDialog} from "../dialogs/LinkToNewDialog";
import {useRecoilBridgeAcrossReactRoots_UNSTABLE, useRecoilState, useRecoilValue} from "recoil";
import {ElementType} from "../../package/packageModel";
import {
    diagramKindSelector,
    exportingAtom,
    importingAtom,
    linkingAtom, selectedRefsSelector, showContextAtom
} from "../diagramEditor/diagramEditorModel";
import {activeDiagramIdAtom, openDiagramIdsAtom} from "./diagramTabsModel";
import {
    addDiagramTabAction,
    elementCommandAction,
    elementSelectedAction, useDispatch
} from "../diagramEditor/diagramEditorSlice";
import Konva from "konva";
import {Stage} from 'react-konva';
import {AppLayoutContext} from "../../app/appModel";
import AddIcon from '@mui/icons-material/Add';
import MenuItem from '@mui/material/MenuItem';
import {PlainTab, TabHeight} from "./DiagramTab";
import {ExportDialog} from "../dialogs/ExportDialog";
import {ImportDialog} from "../dialogs/ImportDialog";
import {DeploymentDiagramEditor} from "../deploymentDiagram/DeploymentDiagramEditor";
import {useHotkeys} from "react-hotkeys-hook";
import {ContextPopup} from "../dialogs/ContextPopup";
import {Command} from "../propertiesEditor/propertiesEditorModel";


function AddNewTabButton() {
    const dispatch = useDispatch()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
                <MenuItem onClick={() => handleClose(ElementType.ClassDiagram)}>Class Diagram</MenuItem>
                <MenuItem onClick={() => handleClose(ElementType.DeploymentDiagram)}>Deployment Diagram</MenuItem>
                <MenuItem onClick={() => handleClose(ElementType.SequenceDiagram)}>Sequence Diagram</MenuItem>
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

    // State for right-click panning
    const [isRightMouseDown, setIsRightMouseDown] = useState(false);
    const [lastPointerPosition, setLastPointerPosition] = useState<{ x: number, y: number } | null>(null);
    const [stageContainer, setStageContainer] = useState<HTMLDivElement | null>(null);

    const diagramKind = useRecoilValue(diagramKindSelector(activeDiagramId!))
    const dispatch = useDispatch()
    let stageRef: React.RefObject<Konva.Stage> = useRef<Konva.Stage | null>(null);

    // Set up event handlers for right-click panning
    useEffect(() => {
        if (!stageRef.current) return;

        const stage = stageRef.current;
        const container = stage.container();
        setStageContainer(container);

        // Handle right mouse button down
        const handleMouseDown = (e: MouseEvent) => {
            // Right mouse button (button === 2)
            if (e.button === 2) {
                e.preventDefault();
                setIsRightMouseDown(true);
                setLastPointerPosition({
                    x: e.clientX,
                    y: e.clientY
                });
                // Change cursor to grabbing
                container.style.cursor = 'grabbing';
            }
        };

        // Handle mouse move for panning
        const handleMouseMove = (e: MouseEvent) => {
            if (isRightMouseDown && lastPointerPosition) {
                e.preventDefault();
                const dx = e.clientX - lastPointerPosition.x;
                const dy = e.clientY - lastPointerPosition.y;

                const newPos = {
                    x: stage.x() + dx,
                    y: stage.y() + dy
                };

                stage.position(newPos);
                stage.batchDraw();

                setLastPointerPosition({
                    x: e.clientX,
                    y: e.clientY
                });
            }
        };

        // Handle mouse up to stop panning
        const handleMouseUp = (e: MouseEvent) => {
            if (e.button === 2) {
                setIsRightMouseDown(false);
                setLastPointerPosition(null);
                // Reset cursor
                container.style.cursor = 'default';
            }
        };

        // Handle context menu to prevent it from showing
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        // Add event listeners
        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('contextmenu', handleContextMenu);

        // Clean up event listeners
        return () => {
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            container.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [isRightMouseDown, lastPointerPosition]);


    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // deselect when clicked on an empty area
        const clickedOnEmpty = e.target === e.target.getStage()
        if (clickedOnEmpty) {
            if (clickedOnEmpty) {
                dispatch(elementSelectedAction({element: undefined, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))
            }
        }
    }

    const selectedElements = useRecoilValue(selectedRefsSelector(activeDiagramId))
    useHotkeys('delete, backspace, left, right, up, down', (event) => {
        event.preventDefault();

        let command;
        switch (event.key) {
            case 'Delete':
            case 'Backspace':
                command = Command.Delete;
                break;
            case 'ArrowLeft':
                command = Command.SelectNextLeft;
                break;
            case 'ArrowRight':
                command = Command.SelectNextRight;
                break;
            case 'ArrowUp':
                command = Command.SelectNextUp;
                break;
            case 'ArrowDown':
                command = Command.SelectNextDown;
                break;
            default:
                return;
        }

        dispatch(elementCommandAction({
            command,
            elements: selectedElements
        }));
    });

    const handleTabChange = (_unused: React.SyntheticEvent, newValue: number) => {
        setActiveDiagramId(openDiagramIds[newValue]);
    }

    const Bridge = useRecoilBridgeAcrossReactRoots_UNSTABLE();

    return (
        <Stack direction="column" spacing="2">
            <Stack direction="row" spacing="2">
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
            <div>
                <HtmlDrop>
                    <AppLayoutContext.Consumer>
                    { value => (
                        <Stage
                            width={window.innerWidth}
                            height={window.innerHeight}
                            onMouseDown={e => checkDeselect(e)}
                            ref={stageRef}
                        >
                            <Bridge>
                                <AppLayoutContext.Provider value={value}>
                                    {diagramKind === ElementType.ClassDiagram && <ClassDiagramEditor diagramId={activeDiagramId!}/>}
                                    {diagramKind === ElementType.DeploymentDiagram && <DeploymentDiagramEditor diagramId={activeDiagramId!}/>}
                                    {diagramKind === ElementType.SequenceDiagram && <SequenceDiagramEditor diagramId={activeDiagramId!}/>}
                                </AppLayoutContext.Provider>
                            </Bridge>
                        </Stage>
                    )}
                    </AppLayoutContext.Consumer>
                </HtmlDrop>
            </div>
            {linking && linking.showLinkToNewDialog && <LinkToNewDialog/>}
            {exporting &&  <ExportDialog diagramKind={diagramKind} getStage={() => stageRef.current}/>}
            {importing &&  <ImportDialog diagramKind={diagramKind} />}
            {showingContext && <ContextPopup  {...showingContext} />}


        </Stack>
    )
}
