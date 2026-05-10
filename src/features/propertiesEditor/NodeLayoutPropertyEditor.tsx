import { CustomShape, PictureLayout } from "../../package/packageModel";
import React, { useContext } from "react";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@benkalegin/ui26";
import { ChevronDown } from "@benkalegin/ui26/icons";
import { PropAndKind } from "./propertiesEditorModel";
import { enumKeys } from "../../common/EnumUtils";
import { AppLayoutContext } from "../../editor/editorLayout";

const NodeLayoutIcon: React.FC<{ layout: PictureLayout }> = ({ layout }) => {
    const { appLayout } = useContext(AppLayoutContext);
    const isDarkMode = appLayout.darkMode;
    let svgContent;

    switch (layout) {
        case PictureLayout.NoIconRect:
            svgContent = (
                <>
                    <rect height="100%" width="100%" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth={2} />
                    <text x="50%" y="50%" textAnchor="middle" fill={isDarkMode ? "white" : "black"}>Caption</text>
                </>
            );
            break;
        case PictureLayout.TopLeftCorner:
            svgContent = (
                <>
                    <rect height="100%" width="100%" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth={2} />
                    <rect width="25%" height="30%" fill={isDarkMode ? "white" : "black"} />
                    <circle cx="12%" cy="13%" r="9%" fill={isDarkMode ? "black" : "white"} />
                    <text x="35%" y="15%" textAnchor="start" fill={isDarkMode ? "white" : "black"}>Caption</text>
                </>
            );
            break;
        case PictureLayout.FullIconTextBelow:
            svgContent = (
                <>
                    <circle cx="50%" cy="40%" r="30%" fill={isDarkMode ? "white" : "black"} />
                    <text x="50%" y="90%" textAnchor="middle" fill={isDarkMode ? "white" : "black"}>Caption</text>
                </>
            );
            break;
        case PictureLayout.Center:
            svgContent = (
                <>
                    <rect height="100%" width="100%" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth={2} />
                    <circle cx="50%" cy="50%" r="40%" fill={isDarkMode ? "white" : "black"} />
                    <text x="50%" y="50%" textAnchor="middle" fill={isDarkMode ? "black" : "white"}>Caption</text>
                </>
            );
    }

    return (
        <svg width="36" height="24" viewBox="0 0 300 200">
            {svgContent}
        </svg>
    );
};

interface NodeLayoutPropertyEditorProps {
    propAndKind: PropAndKind;
    value: CustomShape;
    updateProps: (value: CustomShape) => void;
}

export const NodeLayoutPropertyEditor: React.FC<NodeLayoutPropertyEditorProps> = (props) => {
    const setLayout = (layout: PictureLayout) => {
        props.updateProps({ ...props.value, layout });
    };

    return (
        <div className="prop-editor-row">
            <label className="prop-editor-row__label">{props.propAndKind.prop.label}</label>
            <Menu placement="bottom-start">
                <MenuTrigger className="prop-editor-trigger">
                    <NodeLayoutIcon layout={props.value?.layout} />
                    <ChevronDown size={14} />
                </MenuTrigger>
                <MenuContent>
                    {enumKeys(PictureLayout).map((layoutKey, i) => (
                        <MenuItem
                            key={i}
                            onSelect={() => setLayout(PictureLayout[layoutKey as keyof typeof PictureLayout])}
                        >
                            <span className="prop-editor-menu-item">
                                <NodeLayoutIcon layout={PictureLayout[layoutKey as keyof typeof PictureLayout]} />
                            </span>
                        </MenuItem>
                    ))}
                </MenuContent>
            </Menu>
        </div>
    );
};
