import { TipStyle } from "../../package/packageModel";
import React from "react";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@benkalegin/ui26";
import { ChevronDown } from "@benkalegin/ui26/icons";
import { PropAndKind } from "./propertiesEditorModel";
import { enumKeys } from "../../common/EnumUtils";

const TipStyleIcon: React.FC<{ tipStyle: TipStyle }> = ({ tipStyle }) => {
    let path;
    switch (tipStyle) {
        case TipStyle.Arrow:
            path = <path d="M10,40 L80,40 L60,25 M80,40 L60,55" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case TipStyle.Triangle:
            path = <path d="M10,40 L60,40 L60,25 L80,40 L60,55 L60,40 L10,40 Z" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case TipStyle.Diamond:
            path = <path d="M10,40 L40,40 L60,25 L80,40 L60,55 L40,40 L10,40 Z" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case TipStyle.Circle:
            path = <circle cx="80" cy="40" r="10" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case TipStyle.Square:
            path = <rect x="70" y="30" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case TipStyle.None:
            path = <path d="M10,40 L80,40" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
    }
    return (
        <svg width="30" height="24" viewBox="0 0 100 80">
            {path}
        </svg>
    );
};

interface TipStylePropertyEditorProps {
    propAndKind: PropAndKind;
    value: TipStyle;
    updateProps: (value: any) => void;
}

export const TipStylePropertyEditor: React.FC<TipStylePropertyEditorProps> = (props) => (
    <div className="prop-editor-row">
        <label className="prop-editor-row__label">{props.propAndKind.prop.label}</label>
        <Menu placement="bottom-start">
            <MenuTrigger className="prop-editor-trigger">
                <TipStyleIcon tipStyle={props.value} />
                <ChevronDown size={14} />
            </MenuTrigger>
            <MenuContent>
                {enumKeys(TipStyle).map((styleKey) => (
                    <MenuItem
                        key={styleKey}
                        onSelect={() => props.updateProps(TipStyle[styleKey])}
                    >
                        <span className="prop-editor-menu-item">
                            <TipStyleIcon tipStyle={TipStyle[styleKey]} />
                            <span>{styleKey}</span>
                        </span>
                    </MenuItem>
                ))}
            </MenuContent>
        </Menu>
    </div>
);
