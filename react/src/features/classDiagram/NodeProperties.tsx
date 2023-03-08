import React from "react";
import {Box, TextField} from "@mui/material";
import {NodeId, nodeSelector} from "./classDiagramModel";
import {useRecoilState} from "recoil";

export const NodeProperties = ({nodeId} : {nodeId: NodeId}) => {
    const [node, setNode] = useRecoilState(nodeSelector(nodeId))
    return (
        <Box display="flex" flexDirection="column" p={2}>
            <TextField
                id="node-name"
                label="Name"
                variant="outlined"
                size="small"
                value={node.text}
                onChange={ event => {
                    setNode({...node, text: event.target.value || ''});
                }}
            />
        </Box>
    )
}
