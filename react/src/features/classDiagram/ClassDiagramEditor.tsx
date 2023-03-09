import {Node} from "./Node";
import React from "react";
import {Layer, Stage} from 'react-konva';
import Konva from "konva";
import {Link} from "./Link";
import {classDiagramSelector} from "./classDiagramModel";
import {useRecoilBridgeAcrossReactRoots_UNSTABLE, useRecoilValue} from "recoil";
import {DiagramId} from "../diagramEditor/diagramEditorModel";
import {elementSelectedAction, useDispatch} from "../diagramEditor/diagramEditorSlice";

export const ClassDiagramEditor = ({diagramId}: {diagramId: DiagramId}) => {
    const diagram = useRecoilValue(classDiagramSelector(diagramId))
    const dispatch = useDispatch()
    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage()
        if (clickedOnEmpty) {
            if (clickedOnEmpty) {
                dispatch(elementSelectedAction({element: undefined, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))
            }
        }
    }

    const Bridge = useRecoilBridgeAcrossReactRoots_UNSTABLE();

    return (
        <>
        <Stage
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseDown={e => checkDeselect(e)}
        >
            <Bridge>
                <Layer>
                    {Object.keys(diagram.nodes).map((id, i) => {
                        return (
                            <Node
                                key={i}
                                diagramId={diagramId}
                                nodeId={id}
                            />
                        );
                    })}
                    {Object.keys(diagram.links).map((linkId, index) => {
                        return (
                            <Link
                                key={index}
                                linkId={linkId}
                                diagramId={diagramId}
                            />
                        )
                    })}
                </Layer>
            </Bridge>
        </Stage>
        </>
    )
};
