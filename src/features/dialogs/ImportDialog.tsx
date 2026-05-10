import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, SelectField, Tab, TabList, Tabs } from "@benkalegin/ui26";
import { ChevronDown, ChevronUp, Clipboard, FolderOpen, Globe } from "@benkalegin/ui26/icons";
import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { importingAtom, ImportPhase } from "../diagramEditor/diagramEditorModel";
import { importDiagramTabAction, useDispatch } from "../diagramEditor/diagramEditorSlice";
import { ExportImportFormat } from "../export/exportFormats";
import { ElementType } from "../../package/packageModel";
import { detectImportFormat, FormatDetection, formatLabel } from "./import/detectImportFormat";
import { ImportPreview } from "./import/ImportPreview";
import { builtInExamples, ExampleEntry } from "./import/examplesLibrary";
import "./ImportDialog.css";

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

    return (
        <Dialog
            open={open}
            onClose={() => close(ImportPhase.cancel)}
            ariaLabel="Import diagram"
            className="import-dialog"
        >
            <DialogHeader onClose={() => close(ImportPhase.cancel)}>Import diagram</DialogHeader>
            <DialogBody>
                <Tabs value={tab} onValueChange={(v) => { setTab(v as TabKey); resetPanelState(); }}>
                    <TabList ariaLabel="Import sources" className="import-dialog__tabs">
                        <Tab value="clipboard"><span className="import-dialog__inline-icon"><Clipboard size={14} /></span>Clipboard</Tab>
                        <Tab value="file"><span className="import-dialog__inline-icon"><FolderOpen size={14} /></span>From file</Tab>
                        <Tab value="examples"><span className="import-dialog__inline-icon"><Globe size={14} /></span>Examples</Tab>
                    </TabList>
                </Tabs>

                <div className="import-dialog__layout">
                    <div className="import-dialog__panel">
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
                    </div>

                    <div className="import-dialog__main">
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
                        <div>
                            <button
                                type="button"
                                className="import-dialog__source-toggle"
                                onClick={() => setShowSource(s => !s)}
                            >
                                {showSource ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {showSource ? "Hide source" : "Show source"}
                            </button>
                            {showSource && (
                                <textarea
                                    className="import-dialog__source"
                                    rows={8}
                                    value={source}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { setSource(e.target.value); setOverrideFormat(undefined); }}
                                    placeholder="Paste, drop a file, or pick an example to populate this."
                                />
                            )}
                        </div>
                    </div>
                </div>
            </DialogBody>
            <DialogFooter>
                <Button variant="secondary" onClick={() => close(ImportPhase.cancel)}>Cancel</Button>
                <Button
                    variant="primary"
                    onClick={() => close(ImportPhase.importing)}
                    disabled={!source.trim() || !effectiveFormat || detection.confidence === "mismatch"}
                >
                    Import
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

const DetectionStatus: React.FC<{
    detection: FormatDetection;
    override?: ExportImportFormat;
    onOverride: (f: ExportImportFormat | undefined) => void;
    diagramKind: ElementType;
}> = ({ detection, override, onOverride }) => {
    if (detection.confidence === "empty") {
        return <div className="alert alert--info" role="status">Waiting for source…</div>;
    }
    if (detection.confidence === "unknown") {
        return <div className="alert alert--warning" role="alert">{detection.message}</div>;
    }
    if (detection.confidence === "mismatch") {
        return <div className="alert alert--error" role="alert">{detection.message ?? "Format does not match this diagram type"}</div>;
    }

    return (
        <div className="import-dialog__detection-row">
            <span className="chip chip--success">Detected: {detection.detectedLabel}</span>
            {detection.candidates.length > 1 && (
                <SelectField
                    label="Importer"
                    value={override ?? detection.format ?? ""}
                    onChange={(v) => onOverride(v as ExportImportFormat)}
                    options={detection.candidates.map(f => ({ value: f, label: formatLabel(f) }))}
                />
            )}
        </div>
    );
};

const ClipboardPanel: React.FC<{ onPaste: () => void; error?: string; source: string }> = ({ onPaste, error, source }) => (
    <>
        <p className="import-dialog__panel-text">
            Paste a diagram you copied (Mermaid, CloudDiagram JSON…) and we'll detect the format.
        </p>
        <Button variant="secondary" onClick={onPaste}>
            <span className="import-dialog__inline-icon"><Clipboard size={14} /></span>
            Paste from clipboard
        </Button>
        {error && <div className="alert alert--warning" role="alert">{error}</div>}
        {source && (
            <p className="import-dialog__caption">{source.length.toLocaleString()} characters loaded</p>
        )}
    </>
);

const FilePanel: React.FC<{
    fileName?: string;
    onPick: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFile: (file: File) => void;
}> = ({ fileName, onPick, fileInputRef, onFile }) => (
    <>
        <p className="import-dialog__panel-text">
            Pick a file from your computer. We'll detect the format from its contents.
        </p>
        <Button variant="secondary" onClick={onPick}>
            <span className="import-dialog__inline-icon"><FolderOpen size={14} /></span>
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
            <p className="import-dialog__caption">Loaded: {fileName}</p>
        )}
    </>
);

const ExamplesPanel: React.FC<{
    diagramKind: ElementType;
    onSelect: (ex: ExampleEntry) => void;
    selectedSource: string;
}> = ({ diagramKind, onSelect, selectedSource }) => {
    const groups = builtInExamples.groups;
    return (
        <>
            <p className="import-dialog__panel-text">
                Pick a starter from the library. Compatible with this diagram type:
            </p>
            <div className="examples-list-wrap">
                <ul className="examples-list">
                    {groups.flatMap(group => {
                        const compatible = group.examples.filter(ex => ex.diagramKind === diagramKind);
                        if (compatible.length === 0) return [];
                        return [
                            <li key={`${group.id}-header`} className="examples-list__group">{group.title}</li>,
                            ...compatible.map(ex => (
                                <li key={ex.id}>
                                    <button
                                        type="button"
                                        className={"examples-list__btn" + (selectedSource === ex.source ? " examples-list__btn--selected" : "")}
                                        onClick={() => onSelect(ex)}
                                    >
                                        <span className="examples-list__title">{ex.title}</span>
                                        {ex.description && <span className="examples-list__desc">{ex.description}</span>}
                                    </button>
                                </li>
                            ))
                        ];
                    })}
                </ul>
            </div>
            <p className="import-dialog__caption">
                More examples coming soon at{" "}
                <a href="https://clouddiagram.com/examples" target="_blank" rel="noreferrer">clouddiagram.com/examples</a>
            </p>
        </>
    );
};
