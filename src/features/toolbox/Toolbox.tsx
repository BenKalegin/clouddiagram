import { CollapsibleWithChevron } from "@benkalegin/ui26";
import { ChevronDown, ChevronUp } from "@benkalegin/ui26/icons";
import { GalleryItem, galleryGroups } from "./models";
import { iconRegistry } from "../graphics/graphicsReader";
import "./Toolbox.css";

export const Toolbox = () => {
    const renderItem = (item: GalleryItem) => {
        const iconUrl = item.icon !== undefined ? iconRegistry[item.icon] : undefined;
        return (
            <div
                key={item.key}
                className="toolbox-item"
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "all";
                    e.dataTransfer.dropEffect = "copy";
                    e.dataTransfer.items.add(JSON.stringify(item), "application/json");
                }}
            >
                <span className="toolbox-item__icon">
                    {iconUrl && <img src={iconUrl} alt="" />}
                </span>
                <span className="toolbox-item__label">{item.name}</span>
            </div>
        );
    };

    return (
        <nav className="toolbox" aria-labelledby="library-subheader">
            <h2 className="toolbox__subheader" id="library-subheader">Component Library</h2>
            {galleryGroups.map((group) => (
                <CollapsibleWithChevron
                    key={group.key}
                    header={group.name}
                    chevronPosition="right"
                    chevronIcons={{
                        open: <ChevronUp size={16} />,
                        closed: <ChevronDown size={16} />
                    }}
                >
                    {group.items.map((item) => renderItem(item))}
                </CollapsibleWithChevron>
            ))}
        </nav>
    );
};

