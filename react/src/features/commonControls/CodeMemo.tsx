import React from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

import {CSSProperties} from "@mui/material/styles/createTypography";
import {IconButton, Tooltip} from "@mui/material";
import FileCopyIcon from '@mui/icons-material/FileCopy';
interface CodeMemoProps {
    label: string;
    placeholder: string;
    value: string | undefined
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    minRows: number;
}

const useCopyToClipboard = (text: string) => {
    const [isCopied, setIsCopied] = React.useState<boolean>(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    React.useEffect(() => {
        if (isCopied) {
            const timeoutId = setTimeout(() => setIsCopied(false), 2000);
            return () => clearTimeout(timeoutId);
        }
    }, [isCopied]);

    return [isCopied, copy] as const;
};

export const CodeMemo: React.FC<CodeMemoProps> = (props) => {
    const { label, placeholder, value, onChange, minRows } = props;
    const [isCopied, copy] = useCopyToClipboard(value || '');

    const fixedFontStyle: CSSProperties = {
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
    };

    return (
        <Box>
            <TextField
                label={label}
                placeholder={value ? "" : placeholder}
                value={value}
                onChange={onChange}
                multiline
                minRows={minRows}
                fullWidth
                InputProps={{ style: fixedFontStyle }}
            />
            <Tooltip title={isCopied ? 'Copied!' : 'Copy to Clipboard'} >
                <IconButton
                    onClick={copy}
                    edge="end"
                    color="primary"
                    sx={{ position: 'absolute',
                          top: 60,
                          right: 30}}>
                    <FileCopyIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

