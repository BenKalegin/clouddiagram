import React, {ReactNode} from "react";
import {GalleryItem} from "../toolbox/models";
import {useRecoilTransaction_UNSTABLE} from "recoil";
import {dropFromPaletteAction, handleAction} from "../diagramEditor/diagramEditorSlice";
import {Action} from "@reduxjs/toolkit";

export function HtmlDrop(props: { children: ReactNode }) {
    const {children} = props;

    const handleDrop = useRecoilTransaction_UNSTABLE(
        ({get, set}) => (action: Action) => {
            handleAction(action, get, set);
        },
        []
    )

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
                handleDrop(dropFromPaletteAction({droppedAt: {x: offsetX, y: offsetY}, name: galleryItem.name}));
            }}
        >
            {children}
        </div>

    );
}
