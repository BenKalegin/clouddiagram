import {
    DetailsRow,
    GroupedList,
    IDragDropEvents,
    IDragDropHelper,
    IGroup,
    INavStyles,
    SelectionMode
} from "@fluentui/react";
import React from "react";
import {EventGroup} from "@fluentui/react/lib/Utilities";
import {IDragDropOptions} from "@fluentui/react/lib/utilities/dragdrop/interfaces";

const navStyles: Partial<INavStyles> = {root: {width: 300}};

const navLinkGroups: IGroup[] = [
    {
        key: "class",
        name: "Class",
        startIndex: 0,
        count: 7,
        isDropEnabled: true,
    },

    {
        key: "interaction",
        name: 'Interaction',
        startIndex: 2,
        count: 9,
        isDropEnabled: true,
    },
];

export interface GalleryItem {
    key: string;
    name: string;

    thumbnail?: string;
    description?: string;
    color?: string;
    shape?: string;
    location?: string;
    width?: number;
    height?: number;
}

const items: GalleryItem[] = [
    {key: 'class:class', name: 'Class'},
    {key: 'class:interface', name: 'Interface'},
    {key: 'class:data-type', name: 'Data Type'},
    {key: 'class:enum', name: 'Enumeration'},
    {key: 'class:primitive', name: 'Primitive'},
    {key: 'class:signal', name: 'Signal'},
    {key: 'class:association', name: 'Association'},
    {key: 'interaction:actor', name: 'Actor'},
    {key: 'interaction:lifeline', name: 'Lifeline'},
]

const columns = [
    {
        key: "name",
        name: "name",
        fieldName: "name",
        minWidth: 100,
        maxWidth: 100,
    }
];


export const ComponentLibrary = () => {

    const dragDropEvents = (): IDragDropEvents => {
        return {
            canDrop: (dropContext?, dragContext?) => {
                return true;
            },
            canDrag: (item?: any) => {
                return true;
            },
            onDragEnter: (item?: any, event?: DragEvent) => {
                // return string is the css classes that will be added to the entering element.
                return "dragEnterClass";
            },
            onDragLeave: (item?: any, event?: DragEvent) => {
                return;
            },
            onDrop: (item?: any, event?: DragEvent) => {
            },
            onDragStart: (
                item?: any,
                itemIndex?: number,
                selectedItems?: any[],
                event?: MouseEvent
            ) => {
                console.log("drag start");
            },
            onDragEnd: (item?: any, event?: DragEvent) => {
            }
        };
    };

    const onRenderCell = (nestingDepth?: number, item?: GalleryItem, itemIndex?: number, group?: IGroup): JSX.Element => {
        return (
            <DetailsRow
                id={item!.key}
                columns={columns}
                groupNestingDepth={nestingDepth}
                item={item}
                itemIndex={itemIndex ?? -1}
                compact={true}
                group={group}
                selectionMode={SelectionMode.none}
                dragDropEvents={dragDropEvents()}
            />
        );
    };

    return (
        <GroupedList
            styles={navStyles}
            groups={navLinkGroups}
            items={items}
            selectionMode={SelectionMode.none}
            onRenderCell={onRenderCell}
        />)
}
