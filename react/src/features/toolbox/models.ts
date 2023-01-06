import {ReactComponent as ClassIcon} from "../classDiagram/graphics/class.svg";
import {ReactComponent as InterfaceIcon} from "../classDiagram/graphics/interface.svg";
import {ReactComponent as ActorIcon} from "../classDiagram/graphics/actor.svg";
import {ReactComponent as LifelineIcon} from "../classDiagram/graphics/lifeline.svg";

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

const items: GalleryItem[] = [
    {key: 'class:class', name: 'Class', icon: ClassIcon},
    {key: 'class:interface', name: 'Interface', icon: InterfaceIcon},
    {key: 'class:data-type', name: 'Data Type'},
    {key: 'class:enum', name: 'Enumeration'},
    {key: 'class:primitive', name: 'Primitive'},
    {key: 'class:signal', name: 'Signal'},
    {key: 'class:association', name: 'Association'},
    {key: 'interaction:actor', name: 'Actor', icon: ActorIcon},
    {key: 'interaction:lifeline', name: 'Lifeline', icon: LifelineIcon},
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
];




