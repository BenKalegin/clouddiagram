import React from "react";
import {Box, TextField} from "@mui/material";
import {NodeState} from "../../package/packageModel";
import {LifelineState} from "./sequenceDiagramModel";

export const LifelineProperties = ({lifeline} : {lifeline: LifelineState}) => {
    return (
        <Box display="flex" flexDirection="column" p={2}>
            <TextField
                id="node-name"
                label="Name"
                variant="outlined"
                size="small"
                value={lifeline.title}
            />
        </Box>
    )
}
