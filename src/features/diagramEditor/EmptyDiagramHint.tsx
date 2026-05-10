import {Text} from "react-konva";
import React from "react";
import {importDiagramTabAction, useDispatch} from "./diagramEditorSlice";
import {ImportPhase} from "./diagramEditorModel";

export const EmptyDiagramHint = () => {
    const dispatch = useDispatch()

    return (
        <Text
            y={50}
            x={50}
            fontSize={14}
            lineHeight={1.5}
            opacity={0.4}
            align={"left"}
            text={"Your diagram is empty. You can \n\n- drag component from the library, \n- load demo example diagram \n- click on the plus button \n- start free drawing and follow suggestions \n- import diagram from the external  storage"}
            draggable={false}
            listening={true}
            preventDefault={true}
            onClick={() => dispatch(importDiagramTabAction({importState: ImportPhase.start, format: undefined}))}
        />
    )
};
