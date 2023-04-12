import React, {ReactNode} from "react";
import {
    classClass,
    classInterface,
    commonNote,
    GalleryItem,
    interactionBoundary,
    interactionLifeline
} from "../toolbox/models";
import {dropFromPaletteAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {ElementType} from "../../package/packageModel";
import {PredefinedSvg} from "../graphics/graphicsReader";

export interface TypeAndSubType {
    type: ElementType;
    subType?: PredefinedSvg;
}
function mapGalleryType(galleryType: string) : TypeAndSubType {
    switch (galleryType) {
        case commonNote:
            return { type: ElementType.Note};
        case classClass:
        case classInterface:
            return { type: ElementType.ClassNode};

        case interactionLifeline:
            return { type: ElementType.SequenceLifeLine};

        case interactionBoundary:
            return { type: ElementType.SequenceLifeLine, subType: PredefinedSvg.Boundary }

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
