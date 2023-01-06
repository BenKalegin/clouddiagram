import React, {ReactNode} from "react";
import {useAppDispatch} from "../../app/hooks";
import {dropFromPalette} from "../classDiagram/classDiagramSlice";
import {GalleryItem} from "../toolbox/models";

export function HtmlDrop(props: { children: ReactNode }) {
    const dispatch = useAppDispatch();
    const {children} = props;
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
                dispatch(dropFromPalette({droppedAt: {x: offsetX, y: offsetY}, name: galleryItem.name}))
            }}
        >
            {children}
        </div>

    );
}
