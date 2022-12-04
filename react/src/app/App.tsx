import React from 'react';
import './App.css';
import {ComponentLibrary} from "../features/componentLibrary/ComponentLibrary";
import {OpenDiagramSelector} from "../features/opendiagramSelector/OpenDiagramSelector";
import {Divider, Stack, Typography} from "@mui/material";
import {FilterDrama}  from '@mui/icons-material';

export const App = () => {
    return (
        <Stack direction="column">
            <Stack direction="row">
                <FilterDrama/>
                <Typography>Cloud Diagram</Typography>
            </Stack>
            <Stack direction="row">
                <ComponentLibrary/>
                <Divider/>
                <OpenDiagramSelector/>

            </Stack>
        </Stack>
    );
};
