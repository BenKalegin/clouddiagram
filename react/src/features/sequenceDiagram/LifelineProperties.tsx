import React from "react";
import {Box, TextField} from "@mui/material";
import {LifelineId, lifelineSelector} from "./sequenceDiagramModel";
import {useRecoilValue} from "recoil";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {elementPropertyChangedAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {ElementType} from "../../package/packageModel";

export const LifelineProperties = ({lifelineId} : {lifelineId: LifelineId}) => {
    const diagramId = useRecoilValue(activeDiagramIdAtom)
    const lifeline = useRecoilValue(lifelineSelector({lifelineId, diagramId}))
    const dispatch = useDispatch()
    return (
        <Box display="flex" flexDirection="column" p={2}>
            <TextField
                id="node-name"
                label="Name"
                variant="outlined"
                size="small"
                value={lifeline.title}
                onChange={e => dispatch(elementPropertyChangedAction({
                    elements: [{id: lifelineId, type: ElementType.SequenceLifeLine}],
                    propertyName: "title",
                    value: e.target.value
                }))}
            />
        </Box>
    )
}
