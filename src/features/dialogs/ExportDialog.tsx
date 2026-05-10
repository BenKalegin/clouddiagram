import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@benkalegin/ui26";
import { useAtomValue } from "jotai";
import { useStoreCallback } from "../../common/state/jotaiShim";
import { elementsAtom, exportingAtom, ExportPhase } from "../diagramEditor/diagramEditorModel";
import { useEffect, useState } from "react";
import { exportDiagramTabAction, useDispatch } from "../diagramEditor/diagramEditorSlice";
import { exportDiagramAs, exportFormats, ExportImportFormat } from "../export/exportFormats";
import { CodeMemo } from "../commonControls/CodeMemo";
import { DiagramElement, ElementType, Id } from "../../package/packageModel";
import Konva from "konva";
import { activeDiagramIdAtom } from "../diagramTabs/diagramTabsModel";
import { Diagram } from "../../common/model";
import "./ExportDialog.css";

export const ExportDialog = ({ diagramKind, getStage }: { diagramKind: ElementType; getStage: () => Konva.Stage | null }) => {
    const exporting = useAtomValue(exportingAtom);
    const dispatch = useDispatch();
    const activeDiagramId = useAtomValue(activeDiagramIdAtom);
    const diagram = useAtomValue(elementsAtom(activeDiagramId)) as Diagram;
    const [exportedContent, setExportedContent] = useState("");

    const closeWith = (item: ExportImportFormat | undefined) => {
        dispatch(exportDiagramTabAction({
            exportState: item === undefined ? ExportPhase.cancel : ExportPhase.selected,
            format: item
        }));
    };

    const cancel = () => closeWith(undefined);
    const stage = getStage();

    const exportSelectedDiagram = useStoreCallback(({ get }) =>
        async (format: ExportImportFormat, diagram: Diagram, stage: Konva.Stage | null) =>
            exportDiagramAs(
                diagram,
                format,
                stage,
                (id: Id): DiagramElement | undefined => get(elementsAtom(id)) as DiagramElement | undefined
            ),
        []
    );

    useEffect(() => {
        const fetchExportedContent = async () => {
            if (exporting?.format) {
                try {
                    const content = await exportSelectedDiagram(exporting.format, diagram, stage);
                    setExportedContent(content);
                } catch (error) {
                    console.error("Error exporting diagram:", error);
                    setExportedContent("Error exporting diagram");
                }
            } else {
                setExportedContent("");
            }
        };
        fetchExportedContent();
    }, [diagram, exporting?.format, exportSelectedDiagram, stage]);

    return (
        <Dialog open={exporting !== undefined} onClose={cancel} ariaLabel="Export diagram">
            <DialogHeader onClose={cancel}>Exporting diagram...</DialogHeader>
            <DialogBody>
                <div className="export-dialog__body">
                    <ul className="export-dialog__formats">
                        {exportFormats(diagramKind).map(([kind, name], index) => (
                            <li key={index}>
                                <button
                                    type="button"
                                    className="export-dialog__format-item"
                                    onClick={() => closeWith(kind)}
                                >
                                    {name}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="export-dialog__preview">
                        <CodeMemo
                            label="Exported code"
                            placeholder="Exported code"
                            value={exportedContent}
                            minRows={20}
                        />
                    </div>
                </div>
            </DialogBody>
            <DialogFooter>
                <Button onClick={cancel}>Close</Button>
            </DialogFooter>
        </Dialog>
    );
};
