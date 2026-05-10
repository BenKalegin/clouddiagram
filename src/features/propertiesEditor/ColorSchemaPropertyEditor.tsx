import { ColorSchema } from "../../package/packageModel";
import React, { useContext } from "react";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@benkalegin/ui26";
import { ChevronDown } from "@benkalegin/ui26/icons";
import { PropAndKind } from "./propertiesEditorModel";
import { colorSchemaList } from "../../common/colors/colorSchemas";
import { AppLayoutContext } from "../../editor/editorLayout";
import { adjustColorSchemaForTheme } from "../../common/colors/colorTransform";

const ColorSchemaIcon: React.FC<ColorSchema> = (props: ColorSchema) => (
    <svg width="30" height="24" viewBox="0 0 100 80">
        <rect
            rx="15"
            ry="15"
            y="10"
            x="10"
            height="60"
            width="80"
            fill={props.fillColor}
            stroke={props.strokeColor}
            strokeWidth={2}
        />
    </svg>
);

interface ColorSchemaPropertyEditorProps {
    propAndKind: PropAndKind;
    value: ColorSchema;
    updateProps: (value: any) => void;
}

export const ColorSchemaPropertyEditor: React.FC<ColorSchemaPropertyEditorProps> = (props) => {
    const { appLayout } = useContext(AppLayoutContext);

    return (
        <div className="prop-editor-row">
            <label className="prop-editor-row__label">{props.propAndKind.prop.label}</label>
            <Menu placement="bottom-start">
                <MenuTrigger className="prop-editor-trigger">
                    <ColorSchemaIcon {...adjustColorSchemaForTheme(props.value, appLayout.darkMode)} />
                    <ChevronDown size={14} />
                </MenuTrigger>
                <MenuContent>
                    {colorSchemaList.map((colorSchema, i) => (
                        <MenuItem key={i} onSelect={() => props.updateProps(colorSchema)}>
                            <span className="prop-editor-menu-item">
                                <ColorSchemaIcon {...adjustColorSchemaForTheme(colorSchema, appLayout.darkMode)} />
                            </span>
                        </MenuItem>
                    ))}
                </MenuContent>
            </Menu>
        </div>
    );
};
