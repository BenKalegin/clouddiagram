import React, {ReactNode} from "react";
import {classClass, classInterface, commonNote, GalleryItem, interactionLifeline} from "../toolbox/models";
import {dropFromPaletteAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {ElementType} from "../../package/packageModel";


function mapGalleryType(galleryType: string) : ElementType {
    switch (galleryType) {
        case commonNote:
            return ElementType.Note;
        case classClass:
        case classInterface:
            return ElementType.ClassNode;

        case interactionLifeline:
            return ElementType.SequenceLifeLine;

        default:
            throw new Error("Unknown gallery type: " + galleryType);
    }
}
export function HtmlDrop(props: { children: ReactNode }) {

    const dispatch = useDispatch();

    return (
        <div
            // Stage wrapper that handles drag and drop
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                const target = e.target as HTMLDivElement;
                const rect = target.getBoundingClientRect();

                const offsetX = e.clientX - rect.x;
                const offsetY = e.clientY - rect.y;
                const galleryItem: GalleryItem = JSON.parse(e.dataTransfer.getData("application/json"));
                dispatch(dropFromPaletteAction(
            {
                        droppedAt: {x: offsetX, y: offsetY},
                        name: galleryItem.name,
                        kind: mapGalleryType(galleryItem.key)
                    }));
            }}
        >
            {props.children}
        </div>

    );
}
