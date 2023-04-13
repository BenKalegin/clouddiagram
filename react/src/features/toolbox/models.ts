import {PredefinedSvg} from "../graphics/graphicsReader";

export interface GalleryItem {
    key: string;
    name: string;
    icon?: PredefinedSvg

    thumbnail?: string;
    description?: string;
    color?: string;
    shape?: string;
    location?: string;
    width?: number;
    height?: number;
}

export const commonNote = 'common:note';
export const classClass = 'class:class';
export const classInterface = 'class:interface';
export const interactionLifeline = 'interaction:lifeline';

export const interactionActor = 'interaction:actor';
export const interactionBoundary = 'interaction:boundary';
export const interactionControl = 'interaction:control';
export const interactionEntity = 'interaction:entity';
export const interactionFragment = 'interaction:fragment';
export const interactionEndpoint = 'interaction:endpoint';

const items: GalleryItem[] = [
    {key: classClass, name: 'Class', icon: PredefinedSvg.Class},
    {key: classInterface, name: 'Interface', icon: PredefinedSvg.Interface},
    {key: 'class:data-type', name: 'Data Type'},
    {key: 'class:enum', name: 'Enumeration'},
    {key: 'class:primitive', name: 'Primitive'},
    {key: 'class:signal', name: 'Signal'},
    {key: 'class:association', name: 'Association'},
    {key: interactionActor, name: 'Actor', icon: PredefinedSvg.Actor},
    {key: interactionLifeline, name: 'Lifeline', icon: PredefinedSvg.Lifeline},
    {key: interactionBoundary, name: 'Boundary', icon: PredefinedSvg.Boundary},
    {key: interactionControl, name: 'Control', icon: PredefinedSvg.Control},
    {key: interactionEntity, name: 'Entity', icon: PredefinedSvg.Entity},
    {key: commonNote, name: 'Note', icon: PredefinedSvg.Note},
]


interface IGalleryGroup {
    name: string,
    key: string,
    items: GalleryItem[]
}

export const galleryGroups: IGalleryGroup[] = [
    {
        name: "Class",
        key: "class",
        items: items.filter(item => item.key.startsWith("class:"))
    },
    {
        name: 'Interaction',
        key: 'interaction',
        items: items.filter(item => item.key.startsWith("interaction:"))
    },
    {
        name: 'Common',
        key: 'common',
        items: items.filter(item => item.key.startsWith("common:"))
    },
];




