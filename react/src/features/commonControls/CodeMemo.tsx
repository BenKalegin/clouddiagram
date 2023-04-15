import React from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

import {CSSProperties} from "@mui/material/styles/createTypography";

interface CodeMemoProps {
    label: string;
    placeholder: string;
    value: string | undefined
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    minRows: number;
}

export const CodeMemo: React.FC<CodeMemoProps> = (props) => {
    const { label, placeholder, value, onChange, minRows } = props;

    const fixedFontStyle: CSSProperties = {
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
    };

    return (
        <Box>
            <TextField
                label={label}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                multiline
                minRows={minRows}
                fullWidth
                InputProps={{ style: fixedFontStyle }}
            />
        </Box>
    );
};

