import React from 'react';
import './App.css';
import {Toolbox} from "../features/toolbox/Toolbox";
import {DiagramTabs} from "../features/diagramTabs/DiagramTabs";
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
                <Toolbox/>
                <Divider/>
                <DiagramTabs/>

            </Stack>
        </Stack>
    );
};
