import { RouteStyle } from "../../package/packageModel";
import React from "react";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@benkalegin/ui26";
import { ChevronDown } from "@benkalegin/ui26/icons";
import { PropAndKind } from "./propertiesEditorModel";
import { enumKeys } from "../../common/EnumUtils";

const LinkStyleIcon: React.FC<{ linkStyle: RouteStyle }> = ({ linkStyle }) => {
    let path;
    switch (linkStyle) {
        case RouteStyle.Direct:
            path = <path d="M10 60 L90 20 M80 20 L90 20 L80 30" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case RouteStyle.AutoRouting:
            path = <path d="M10 40 L50 40 L50 20 L90 20 M80 10 L90 20 L80 30" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case RouteStyle.CustomLine:
            path = <path d="M10 40 L30 20 L70 60 L90 40 M80 30 L90 40 L80 50" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case RouteStyle.Bezier:
            path = <path d="M10 40 Q50 10, 90 40 M80 30 L90 40 L80 50" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case RouteStyle.OrthogonalSquare:
            path = <path d="M10 40 L50 40 L50 20 L90 20 M80 10 L90 20 L80 30" stroke="currentColor" fill="none" strokeWidth="4" strokeLinejoin="miter" />;
            break;
        case RouteStyle.OrthogonalRounded:
            path = <path d="M10 40 L50 40 L50 20 L90 20 M80 10 L90 20 L80 30" stroke="currentColor" fill="none" strokeWidth="4" strokeLinejoin="round" />;
            break;
        default:
            path = <path d="M10 40 L90 40 M80 30 L90 40 L80 50" stroke="currentColor" fill="none" strokeWidth="4" />;
    }
    return (
        <svg width="30" height="24" viewBox="0 0 100 80">
            {path}
        </svg>
    );
};

interface LinkStylePropertyEditorProps {
    propAndKind: PropAndKind;
    value: RouteStyle;
    updateProps: (value: any) => void;
}

export const LinkStylePropertyEditor: React.FC<LinkStylePropertyEditorProps> = (props) => (
    <div className="prop-editor-row">
        <label className="prop-editor-row__label">{props.propAndKind.prop.label}</label>
        <Menu placement="bottom-start">
            <MenuTrigger className="prop-editor-trigger">
                <LinkStyleIcon linkStyle={props.value} />
                <ChevronDown size={14} />
            </MenuTrigger>
            <MenuContent>
                {enumKeys(RouteStyle).map((styleKey) => (
                    <MenuItem
                        key={styleKey}
                        onSelect={() => props.updateProps(RouteStyle[styleKey])}
                    >
                        <span className="prop-editor-menu-item">
                            <LinkStyleIcon linkStyle={RouteStyle[styleKey]} />
                            <span>{styleKey}</span>
                        </span>
                    </MenuItem>
                ))}
            </MenuContent>
        </Menu>
    </div>
);
