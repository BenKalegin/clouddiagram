import {DetailsRow, GroupedList, IGroup, INavStyles, SelectionMode} from "@fluentui/react";
import React from "react";
import {IColumn} from "@fluentui/react/src/components/DetailsList/DetailsList.types";

const navStyles: Partial<INavStyles> = { root: { width: 300 } };

const navLinkGroups: IGroup[] = [
    {
        key: "class",
        name: "Class",
        startIndex: 0,
        count: 7,
    },

    {
        key: "interaction",
        name: 'Interaction',
        startIndex: 2,
        count: 9,
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
    { key: 'class:class', name: 'Class' },
    { key: 'class:interface', name: 'Interface' },
    { key: 'class:data-type', name: 'Data Type' },
    { key: 'class:enum', name: 'Enumeration' },
    { key: 'class:primitive', name: 'Primitive' },
    { key: 'class:signal', name: 'Signal' },
    { key: 'class:association', name: 'Association' },
    { key: 'interaction:actor', name: 'Actor' },
    { key: 'interaction:lifeline', name: 'Lifeline' },
]

const columns: IColumn[] = [
    {
        key: "name",
        name: "name",
        fieldName: "name",
        minWidth: 100,
        maxWidth: 100,
    }
];
const onRenderCell = (nestingDepth?: number, item?: GalleryItem, itemIndex?: number, group?: IGroup): JSX.Element => {
    return (
        <DetailsRow
            columns={columns}
            groupNestingDepth={nestingDepth}
            item={item}
            itemIndex={itemIndex ?? -1}
            compact={true}
            group={group}
            selectionMode={SelectionMode.none}
        />
    );
};
export const ComponentLibrary = () =>
    <GroupedList
        styles={navStyles}
        groups={navLinkGroups}
        items={items}
        selectionMode={SelectionMode.none}
        onRenderCell={onRenderCell}
    />;
