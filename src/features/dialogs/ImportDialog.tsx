import {
    Alert,
    Box,
    Button,
    Chip,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    Link,
    List,
    ListItemButton,
    ListItemText,
    ListSubheader,
    MenuItem,
    Select,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import PublicIcon from "@mui/icons-material/Public";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {useAtomValue} from "jotai";
import {importingAtom, ImportPhase} from "../diagramEditor/diagramEditorModel";
import {importDiagramTabAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {ExportImportFormat} from "../export/exportFormats";
import {ElementType} from "../../package/packageModel";
import {detectImportFormat, FormatDetection, formatLabel} from "./import/detectImportFormat";
import {ImportPreview} from "./import/ImportPreview";
import {builtInExamples, ExampleEntry} from "./import/examplesLibrary";

type TabKey = "clipboard" | "file" | "examples";

const PREVIEW_W = 480;
const PREVIEW_H = 360;

export const ImportDialog = ({diagramKind}: {diagramKind: ElementType}) => {
    const importing = useAtomValue(importingAtom);
    const dispatch = useDispatch();

    const [tab, setTab] = useState<TabKey>("clipboard");
    const [source, setSource] = useState("");
    const [showSource, setShowSource] = useState(false);
    const [overrideFormat, setOverrideFormat] = useState<ExportImportFormat | undefined>();
    const [fileName, setFileName] = useState<string | undefined>();
    const [clipboardError, setClipboardError] = useState<string | undefined>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const open = importing !== undefined;

    const resetPanelState = () => {
        setSource("");
        setOverrideFormat(undefined);
        setFileName(undefined);
        setClipboardError(undefined);
    };

    useEffect(() => {
        if (!open) return;
        resetPanelState();
        setShowSource(false);
        setTab("clipboard");
    }, [open]);

    const detection: FormatDetection = useMemo(
        () => detectImportFormat(source, diagramKind),
        [source, diagramKind]
    );

    const effectiveFormat = overrideFormat ?? detection.format;

    const close = (state: ImportPhase) => {
        dispatch(importDiagramTabAction({importState: state, format: effectiveFormat, importedCode: source}));
    };

    const handlePasteClick = async () => {
        setClipboardError(undefined);
        try {
            const text = await navigator.clipboard.readText();
            if (!text) {
                setClipboardError("Clipboard is empty");
                return;
            }
            setSource(text);
            setOverrideFormat(undefined);
        } catch (e) {
            setClipboardError(e instanceof Error ? e.message : "Could not read clipboard");
        }
    };

    const handleFilePick = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            setSource(typeof reader.result === "string" ? reader.result : "");
            setFileName(file.name);
            setOverrideFormat(undefined);
        };
        reader.readAsText(file);
    };

    const handleExampleClick = (ex: ExampleEntry) => {
        setSource(ex.source);
        setOverrideFormat(undefined);
        setFileName(undefined);
    };

    const onTabChange = (_: React.SyntheticEvent, value: TabKey) => {
        setTab(value);
        resetPanelState();
    };

    return (
        <Dialog
            open={open}
            onClose={() => close(ImportPhase.cancel)}
            maxWidth="lg"
            PaperProps={{sx: {minWidth: 900}}}
        >
            <DialogTitle>Import diagram</DialogTitle>
            <DialogContent dividers>
                <Tabs value={tab} onChange={onTabChange} sx={{mb: 2}}>
                    <Tab value="clipboard" icon={<ContentPasteIcon fontSize="small" />} iconPosition="start" label="Clipboard" />
                    <Tab value="file" icon={<FolderOpenIcon fontSize="small" />} iconPosition="start" label="From file" />
                    <Tab value="examples" icon={<PublicIcon fontSize="small" />} iconPosition="start" label="Examples" />
                </Tabs>

                <Box sx={{display: "flex", gap: 2, alignItems: "stretch"}}>
                    <Box sx={{width: 320, display: "flex", flexDirection: "column", gap: 1}}>
                        {tab === "clipboard" && (
                            <ClipboardPanel
                                onPaste={handlePasteClick}
                                error={clipboardError}
                                source={source}
                            />
                        )}
                        {tab === "file" && (
                            <FilePanel
                                fileName={fileName}
                                onPick={() => fileInputRef.current?.click()}
                                fileInputRef={fileInputRef}
                                onFile={handleFilePick}
                            />
                        )}
                        {tab === "examples" && (
                            <ExamplesPanel
                                diagramKind={diagramKind}
                                onSelect={handleExampleClick}
                                selectedSource={source}
                            />
                        )}
                    </Box>

                    <Box sx={{flex: 1, display: "flex", flexDirection: "column", gap: 1}}>
                        <DetectionStatus
                            detection={detection}
                            override={overrideFormat}
                            onOverride={setOverrideFormat}
                            diagramKind={diagramKind}
                        />
                        <ImportPreview
                            diagramKind={diagramKind}
                            format={effectiveFormat}
                            source={source}
                            width={PREVIEW_W}
                            height={PREVIEW_H}
                        />
                        <Box>
                            <Button
                                size="small"
                                onClick={() => setShowSource(s => !s)}
                                startIcon={showSource ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                sx={{textTransform: "none"}}
                            >
                                {showSource ? "Hide source" : "Show source"}
                            </Button>
                            <Collapse in={showSource}>
                                <TextField
                                    multiline
                                    fullWidth
                                    minRows={6}
                                    maxRows={12}
                                    value={source}
                                    onChange={(e) => { setSource(e.target.value); setOverrideFormat(undefined); }}
                                    InputProps={{style: {fontFamily: "monospace", fontSize: 12}}}
                                    placeholder="Paste, drop a file, or pick an example to populate this."
                                />
                            </Collapse>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => close(ImportPhase.cancel)}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={() => close(ImportPhase.importing)}
                    disabled={!source.trim() || !effectiveFormat || detection.confidence === "mismatch"}
                >
                    Import
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const DetectionStatus: React.FC<{
    detection: FormatDetection;
    override?: ExportImportFormat;
    onOverride: (f: ExportImportFormat | undefined) => void;
    diagramKind: ElementType;
}> = ({detection, override, onOverride}) => {
    if (detection.confidence === "empty") {
        return <Alert severity="info" variant="outlined" sx={{py: 0}}>Waiting for source…</Alert>;
    }
    if (detection.confidence === "unknown") {
        return <Alert severity="warning" variant="outlined" sx={{py: 0}}>{detection.message}</Alert>;
    }
    if (detection.confidence === "mismatch") {
        return <Alert severity="error" variant="outlined" sx={{py: 0}}>{detection.message ?? "Format does not match this diagram type"}</Alert>;
    }

    return (
        <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
            <Chip size="small" color="success" label={`Detected: ${detection.detectedLabel}`} />
            {detection.candidates.length > 1 && (
                <FormControl size="small" sx={{minWidth: 220}}>
                    <InputLabel id="format-override-label">Importer</InputLabel>
                    <Select
                        labelId="format-override-label"
                        label="Importer"
                        value={override ?? detection.format ?? ""}
                        onChange={(e) => onOverride(e.target.value as ExportImportFormat)}
                    >
                        {detection.candidates.map(f => (
                            <MenuItem key={f} value={f}>{formatLabel(f)}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </Box>
    );
};

const ClipboardPanel: React.FC<{onPaste: () => void; error?: string; source: string}> = ({onPaste, error, source}) => (
    <Box sx={{display: "flex", flexDirection: "column", gap: 1.5}}>
        <Typography variant="body2" color="text.secondary">
            Paste a diagram you copied (Mermaid, CloudDiagram JSON…) and we'll detect the format.
        </Typography>
        <Button variant="outlined" startIcon={<ContentPasteIcon />} onClick={onPaste}>
            Paste from clipboard
        </Button>
        {error && <Alert severity="warning" variant="outlined" sx={{py: 0}}>{error}</Alert>}
        {source && (
            <Typography variant="caption" color="text.secondary">
                {source.length.toLocaleString()} characters loaded
            </Typography>
        )}
    </Box>
);

const FilePanel: React.FC<{
    fileName?: string;
    onPick: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFile: (file: File) => void;
}> = ({fileName, onPick, fileInputRef, onFile}) => (
    <Box sx={{display: "flex", flexDirection: "column", gap: 1.5}}>
        <Typography variant="body2" color="text.secondary">
            Pick a file from your computer. We'll detect the format from its contents.
        </Typography>
        <Button variant="outlined" startIcon={<FolderOpenIcon />} onClick={onPick}>
            Choose file…
        </Button>
        <input
            type="file"
            hidden
            ref={fileInputRef}
            accept=".cd,.json,.mmd,.txt,application/json,text/plain"
            onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
            }}
        />
        {fileName && (
            <Typography variant="caption" color="text.secondary">Loaded: {fileName}</Typography>
        )}
    </Box>
);

const ExamplesPanel: React.FC<{
    diagramKind: ElementType;
    onSelect: (ex: ExampleEntry) => void;
    selectedSource: string;
}> = ({diagramKind, onSelect, selectedSource}) => {
    const groups = builtInExamples.groups;
    return (
        <Box sx={{display: "flex", flexDirection: "column", gap: 0.5}}>
            <Typography variant="body2" color="text.secondary" sx={{mb: 0.5}}>
                Pick a starter from the library. Compatible with this diagram type:
            </Typography>
            <Box sx={{maxHeight: PREVIEW_H + 24, overflowY: "auto", border: 1, borderColor: "divider", borderRadius: 1}}>
                <List dense disablePadding>
                    {groups.flatMap(group => {
                        const compatible = group.examples.filter(ex => ex.diagramKind === diagramKind);
                        if (compatible.length === 0) return [];
                        return [
                            <ListSubheader key={`${group.id}-header`} sx={{lineHeight: "32px"}}>{group.title}</ListSubheader>,
                            ...compatible.map(ex => (
                                <ListItemButton
                                    key={ex.id}
                                    selected={selectedSource === ex.source}
                                    onClick={() => onSelect(ex)}
                                >
                                    <ListItemText
                                        primary={ex.title}
                                        secondary={ex.description}
                                        secondaryTypographyProps={{variant: "caption"}}
                                    />
                                </ListItemButton>
                            )),
                        ];
                    })}
                </List>
            </Box>
            <Typography variant="caption" color="text.secondary">
                More examples coming soon at{" "}
                <Link href="https://clouddiagram.com/examples" target="_blank" rel="noreferrer">clouddiagram.com/examples</Link>
            </Typography>
        </Box>
    );
};
