import React from "react";
import {Box, TextField} from "@mui/material";
import {NodeState} from "../../package/packageModel";

export const NodeProperties = ({node} : {node: NodeState}) => {
    return (
        <Box display="flex" flexDirection="column" p={2}>
            <TextField
                id="node-name"
                label="Name"
                variant="outlined"
                size="small"
                value={node.text}
            />
        </Box>
    )
}
