import React, {useRef, useState, useEffect} from "react";
import {ClassDiagramEditor} from "../classDiagram/ClassDiagramEditor";
import {SequenceDiagramEditor} from "../sequenceDiagram/SequenceDiagramEditor";
import {HtmlDrop} from "./HtmlDrop";
import {IconButton, Menu, Stack, Tabs, Box, Slider, Typography} from "@mui/material";
import {LinkToNewDialog} from "../dialogs/LinkToNewDialog";
import {useRecoilBridgeAcrossReactRoots_UNSTABLE, useRecoilState, useRecoilValue} from "recoil";
import {ElementType} from "../../package/packageModel";
import {
    diagramKindSelector,
    exportingAtom,
    importingAtom,
    linkingAtom, selectedRefsSelector, showContextAtom
} from "../diagramEditor/diagramEditorModel";
import { ThemeService } from "../../services/theme/themeService";
import {activeDiagramIdAtom, openDiagramIdsAtom} from "./diagramTabsModel";
import {
    addDiagramTabAction,
    elementCommandAction,
    elementSelectedAction, useDispatch
} from "../diagramEditor/diagramEditorSlice";
import Konva from "konva";
import {Stage} from 'react-konva';
import AddIcon from '@mui/icons-material/Add';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import MenuItem from '@mui/material/MenuItem';
import {PlainTab, TabHeight} from "./DiagramTab";
import {ExportDialog} from "../dialogs/ExportDialog";
import {ImportDialog} from "../dialogs/ImportDialog";
import {DeploymentDiagramEditor} from "../deploymentDiagram/DeploymentDiagramEditor";
import {useHotkeys} from "react-hotkeys-hook";
import {ContextPopup} from "../dialogs/ContextPopup";
import {Command} from "../propertiesEditor/propertiesEditorModel";
import {GridLayer} from "../../common/components/GridLayer";


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

    // State for right-click panning
    const [isRightMouseDown, setIsRightMouseDown] = useState(false);
    const [lastPointerPosition, setLastPointerPosition] = useState<{ x: number, y: number } | null>(null);

    // State for zoom controls
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const diagramKind = useRecoilValue(diagramKindSelector(activeDiagramId!))
    const dispatch = useDispatch()
    let stageRef: React.RefObject<Konva.Stage> = useRef<Konva.Stage | null>(null);

    // Set up event handlers for right-click panning and wheel zooming
    useEffect(() => {
        if (!stageRef.current || !containerRef.current) return;

        const stage = stageRef.current;
        const container = stage.container();
        const scrollContainer = containerRef.current;
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
                setPosition(newPos);

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

        // Handle wheel event for zooming
        const handleWheel = (e: WheelEvent) => {
            // Prevent default scrolling behavior
            e.preventDefault();
            e.stopPropagation();

            const oldScale = stage.scaleX();

            // Get pointer position
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            // Calculate new scale
            // Zoom in: scale up, Zoom out: scale down
            const direction = e.deltaY > 0 ? -1 : 1;
            const scaleBy = 1.1;
            const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

            // Limit scale to reasonable bounds
            const limitedScale = Math.max(0.1, Math.min(newScale, 5));

            // Set new scale
            stage.scale({ x: limitedScale, y: limitedScale });

            // Calculate new position
            const newPos = {
                x: pointer.x - mousePointTo.x * limitedScale,
                y: pointer.y - mousePointTo.y * limitedScale,
            };

            // Set new position
            stage.position(newPos);
            stage.batchDraw();

            // Update state
            setScale(limitedScale);
            setPosition(newPos);
        };

        // Prevent wheel events on the scroll container from scrolling
        const preventWheelScroll = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                // Allow pinch-to-zoom on trackpads
                e.preventDefault();
            }
        };

        // Add event listeners
        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('contextmenu', handleContextMenu);
        container.addEventListener('wheel', handleWheel);
        scrollContainer.addEventListener('wheel', preventWheelScroll, { passive: false });

        // Clean up event listeners
        return () => {
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            container.removeEventListener('contextmenu', handleContextMenu);
            container.removeEventListener('wheel', handleWheel);
            scrollContainer.removeEventListener('wheel', preventWheelScroll);
        };
    }, [isRightMouseDown, lastPointerPosition, scale]);


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

    // Zoom control functions
    const handleZoomIn = () => {
        if (!stageRef.current) return;

        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const newScale = Math.min(oldScale * 1.2, 5);

        // Keep the center of the view fixed when zooming
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const mousePointTo = {
            x: (centerX - stage.x()) / oldScale,
            y: (centerY - stage.y()) / oldScale,
        };

        const newPos = {
            x: centerX - mousePointTo.x * newScale,
            y: centerY - mousePointTo.y * newScale,
        };

        stage.scale({ x: newScale, y: newScale });
        stage.position(newPos);
        stage.batchDraw();

        setScale(newScale);
        setPosition(newPos);
    };

    const handleZoomOut = () => {
        if (!stageRef.current) return;

        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const newScale = Math.max(oldScale / 1.2, 0.1);

        // Keep the center of the view fixed when zooming
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const mousePointTo = {
            x: (centerX - stage.x()) / oldScale,
            y: (centerY - stage.y()) / oldScale,
        };

        const newPos = {
            x: centerX - mousePointTo.x * newScale,
            y: centerY - mousePointTo.y * newScale,
        };

        stage.scale({ x: newScale, y: newScale });
        stage.position(newPos);
        stage.batchDraw();

        setScale(newScale);
        setPosition(newPos);
    };

    const handleZoomToFit = () => {
        if (!stageRef.current) return;

        const stage = stageRef.current;

        // Reset to default scale and position
        const newScale = 1;
        const newPos = { x: 0, y: 0 };

        stage.scale({ x: newScale, y: newScale });
        stage.position(newPos);
        stage.batchDraw();

        setScale(newScale);
        setPosition(newPos);
    };

    const handleSliderChange = (_event: Event, newValue: number | number[]) => {
        if (!stageRef.current || typeof newValue !== 'number') return;

        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const newScale = newValue;

        // Keep the center of the view fixed when zooming
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const mousePointTo = {
            x: (centerX - stage.x()) / oldScale,
            y: (centerY - stage.y()) / oldScale,
        };

        const newPos = {
            x: centerX - mousePointTo.x * newScale,
            y: centerY - mousePointTo.y * newScale,
        };

        stage.scale({ x: newScale, y: newScale });
        stage.position(newPos);
        stage.batchDraw();

        setScale(newScale);
        setPosition(newPos);
    };

    const Bridge = useRecoilBridgeAcrossReactRoots_UNSTABLE();

    return (
        <Stack direction="column" spacing="2">
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

            {/* Zoom controls */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <IconButton onClick={handleZoomOut} size="small">
                    <ZoomOutIcon />
                </IconButton>

                <Slider
                    value={scale}
                    min={0.1}
                    max={5}
                    step={0.1}
                    onChange={handleSliderChange}
                    aria-labelledby="zoom-slider"
                    sx={{ width: 200 }}
                />

                <IconButton onClick={handleZoomIn} size="small">
                    <ZoomInIcon />
                </IconButton>

                <IconButton onClick={handleZoomToFit} size="small">
                    <FitScreenIcon />
                </IconButton>

                <Typography variant="body2">
                    {Math.round(scale * 100)}%
                </Typography>
            </Stack>

            {/* Scrollable container for the stage */}
            <Box
                ref={containerRef}
                sx={{
                    width: '100%',
                    height: 'calc(100vh - 150px)',
                    overflow: 'auto',
                    border: '1px solid #ddd',
                    position: 'relative'
                }}
            >
                <HtmlDrop>
                    <AppLayoutContext.Consumer>
                    { value => (
                        <Stage
                            width={2000} // Large enough to accommodate most diagrams
                            height={2000} // Large enough to accommodate most diagrams
                            onMouseDown={e => checkDeselect(e)}
                            ref={stageRef}
                            scaleX={scale}
                            scaleY={scale}
                            x={position.x}
                            y={position.y}
                            draggable={false} // Disable built-in dragging as we're using custom panning
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
            </Box>

            {linking && linking.showLinkToNewDialog && <LinkToNewDialog/>}
            {exporting &&  <ExportDialog diagramKind={diagramKind} getStage={() => stageRef.current}/>}
            {importing &&  <ImportDialog diagramKind={diagramKind} />}
            {showingContext && <ContextPopup  {...showingContext} />}
        </Stack>
    )
}
