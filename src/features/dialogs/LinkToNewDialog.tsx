import { useRef } from "react";
import { Button, useClickOutside, useEscapeKey } from "@benkalegin/ui26";
import { galleryGroups, GalleryItem } from "../toolbox/models";
import { useAtomValue } from "jotai";
import { diagramKindSelector, linkingAtom } from "../diagramEditor/diagramEditorModel";
import { linkToNewDialogCompletedAction, useDispatch } from "../diagramEditor/diagramEditorSlice";
import { activeDiagramIdAtom } from "../diagramTabs/diagramTabsModel";
import { ElementType } from "../../package/packageModel";
import "./LinkToNewDialog.css";


export const LinkToNewDialog = () => {
    const linking = useAtomValue(linkingAtom);
    const source = linking?.sourceElement;
    const activeDiagramId = useAtomValue(activeDiagramIdAtom);
    const diagramKind = useAtomValue(diagramKindSelector(activeDiagramId));
    const groupKeys = diagramKind === ElementType.FlowchartDiagram ? ["flowchart", "c4"] : ["class"];
    const items = galleryGroups.filter(group => groupKeys.includes(group.key)).flatMap(group => group.items);
    const dispatch = useDispatch();
    const paperRef = useRef<HTMLDivElement>(null);

    const closeWith = (item?: GalleryItem) => {
        dispatch(linkToNewDialogCompletedAction({ selectedKey: item?.key, selectedName: item?.name, success: !!item }));
    };

    const cancel = () => closeWith(undefined);
    const open = linking?.showLinkToNewDialog === true;

    useEscapeKey(cancel, open);
    useClickOutside(paperRef, cancel, open);

    if (!open) return null;

    const pos = {
        x: Math.max(linking?.mousePos?.x || 0, 0),
        y: Math.max(linking?.mousePos?.y || 0, 0)
    };

    return (
        <div className="link-to-new-overlay">
            <div
                ref={paperRef}
                role="dialog"
                aria-modal="true"
                aria-label={`Linking ${source} to new`}
                className="link-to-new-paper"
                style={{ top: pos.y, left: pos.x }}
            >
                <div className="link-to-new-paper__title">{`Linking ${source} to new...`}</div>
                <ul className="link-to-new-paper__list">
                    {items.map(item => (
                        <li key={item.key}>
                            <button
                                type="button"
                                className="link-to-new-paper__item"
                                onClick={() => closeWith(item)}
                            >
                                <span className="link-to-new-paper__icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" />
                                </span>
                                <span>{item.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
                <div className="link-to-new-paper__actions">
                    <Button variant="secondary" onClick={cancel}>Cancel</Button>
                </div>
            </div>
        </div>
    );
};
