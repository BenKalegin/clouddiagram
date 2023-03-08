import React from "react";
import {Box, TextField} from "@mui/material";
import {LifelineId, lifelineSelector} from "./sequenceDiagramModel";
import {useRecoilValue} from "recoil";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";

export const LifelineProperties = ({lifelineId} : {lifelineId: LifelineId}) => {
    const diagramId = useRecoilValue(activeDiagramIdAtom)
    const lifeline = useRecoilValue(lifelineSelector({lifelineId, diagramId}))
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
