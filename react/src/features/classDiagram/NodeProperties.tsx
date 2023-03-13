import React from "react";
import {Box, TextField} from "@mui/material";
import {NodeId, nodeSelector} from "./classDiagramModel";
import { useRecoilValue} from "recoil";
import {elementPropertyChangedAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {ElementType} from "../../package/packageModel";

export const NodeProperties = ({nodeId} : {nodeId: NodeId}) => {
    const node = useRecoilValue(nodeSelector(nodeId))
    const dispatch = useDispatch()
    return (
        <Box display="flex" flexDirection="column" p={2}>
            <TextField
                id="node-name"
                label="Name"
                variant="outlined"
                size="small"
                value={node.text}
                onChange={e => dispatch(elementPropertyChangedAction({
                    elements: [{id: nodeId, type: ElementType.ClassNode}],
                    propertyName: "text",
                    value: e.target.value
                }))}
            />
        </Box>
    )
}
