import React, { useEffect, useState } from "react";
import { IconButton, TextareaField, Tooltip } from "@benkalegin/ui26";
import { Copy } from "@benkalegin/ui26/icons";
import "./CodeMemo.css";

interface CodeMemoProps {
    label: string;
    placeholder: string;
    value: string | undefined;
    onChange?: (value: string) => void;
    minRows: number;
}

const useCopyToClipboard = (text: string) => {
    const [isCopied, setIsCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    useEffect(() => {
        if (!isCopied) return;
        const timeoutId = setTimeout(() => setIsCopied(false), 2000);
        return () => clearTimeout(timeoutId);
    }, [isCopied]);

    return [isCopied, copy] as const;
};

export const CodeMemo: React.FC<CodeMemoProps> = ({ label, placeholder, value, onChange, minRows }) => {
    const [isCopied, copy] = useCopyToClipboard(value || "");

    return (
        <div className="code-memo">
            <TextareaField
                label={label}
                placeholder={value ? "" : placeholder}
                value={value ?? ""}
                onChange={onChange}
                rows={minRows}
                className="code-memo__textarea"
            />
            <Tooltip content={isCopied ? "Copied!" : "Copy to Clipboard"}>
                <IconButton aria-label="Copy to clipboard" onClick={copy} className="code-memo__copy">
                    <Copy size={16} />
                </IconButton>
            </Tooltip>
        </div>
    );
};

