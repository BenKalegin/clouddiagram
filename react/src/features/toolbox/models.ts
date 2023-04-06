import {ReactComponent as ClassIcon} from "../classDiagram/graphics/class.svg";
import {ReactComponent as InterfaceIcon} from "../classDiagram/graphics/interface.svg";
import {ReactComponent as ActorIcon} from "../classDiagram/graphics/actor.svg";
import {ReactComponent as LifelineIcon} from "../classDiagram/graphics/lifeline.svg";
import {ReactComponent as NoteIcon} from "../classDiagram/graphics/note.svg";

export interface GalleryItem {
    key: string;
    name: string;
    icon?: any

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

const items: GalleryItem[] = [
    {key: classClass, name: 'Class', icon: ClassIcon},
    {key: classInterface, name: 'Interface', icon: InterfaceIcon},
    {key: 'class:data-type', name: 'Data Type'},
    {key: 'class:enum', name: 'Enumeration'},
    {key: 'class:primitive', name: 'Primitive'},
    {key: 'class:signal', name: 'Signal'},
    {key: 'class:association', name: 'Association'},
    {key: 'interaction:actor', name: 'Actor', icon: ActorIcon},
    {key: interactionLifeline, name: 'Lifeline', icon: LifelineIcon},
    {key: commonNote, name: 'Note', icon: NoteIcon},
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




