import { LineStyle, lineStyleList } from "../../package/packageModel";
import React from "react";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@benkalegin/ui26";
import { ChevronDown } from "@benkalegin/ui26/icons";
import { PropAndKind } from "./propertiesEditorModel";

const LineStyleIcon: React.FC<LineStyle> = (props: LineStyle) => (
    <svg width="30" height="24" viewBox="0 0 100 80">
        <line
            x1="10"
            y1="40"
            x2="90"
            y2="40"
            stroke={props.strokeColor}
            strokeWidth={2}
        />
    </svg>
);

interface LineStylePropertyEditorProps {
    propAndKind: PropAndKind;
    value: LineStyle;
    updateProps: (value: any) => void;
}

export const LineStylePropertyEditor: React.FC<LineStylePropertyEditorProps> = (props) => (
    <div className="prop-editor-row">
        <label className="prop-editor-row__label">{props.propAndKind.prop.label}</label>
        <Menu placement="bottom-start">
            <MenuTrigger className="prop-editor-trigger">
                <LineStyleIcon {...props.value} />
                <ChevronDown size={14} />
            </MenuTrigger>
            <MenuContent>
                {lineStyleList.map((lineStyle, i) => (
                    <MenuItem key={i} onSelect={() => props.updateProps(lineStyle)}>
                        <span className="prop-editor-menu-item">
                            <LineStyleIcon {...lineStyle} />
                        </span>
                    </MenuItem>
                ))}
            </MenuContent>
        </Menu>
    </div>
);
