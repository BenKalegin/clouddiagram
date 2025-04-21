import {ElementRef} from "../../package/packageModel";
import {Bounds, rightOf} from "../../common/model";
import {Group, Rect, Text} from "react-konva";
import React from "react";

export interface PopupContextProps {
    bounds: Bounds;
    element: ElementRef;
}

export const PopupContextPane = (props: PopupContextProps) => {
    const bounds = rightOf(props.bounds, 100);
    const [hoverButton, setHoverButton] = React.useState(false);

    return (
        <Group>
        <Rect
            x={bounds.x}
            y={bounds.y}
            width={bounds.width}
            height={bounds.height}
                fill={"white"}
            dash={[3, 5]}
            stroke={"darkgray"}
            strokeWidth={4}
            cornerRadius={0}
        />
            <Group
                x={bounds.x + 20}
                y={bounds.y + 20}
                width={bounds.width - 40}
                height={40}
                onMouseEnter={() => setHoverButton(true)}
                onMouseLeave={() => setHoverButton(false)}
                onMouseDown={(e) => {
                    e.cancelBubble = true;
                    console.log("Button clicked");
                    // Add your button action here
                }}
            >
                <Rect
                    width={bounds.width - 40}
                    height={40}
                    fill={hoverButton ? "#e0e0e0" : "#f0f0f0"}
                    stroke={"gray"}
                    strokeWidth={1}
                    cornerRadius={4}
                />
                <Text
                    text="Action Button"
                    width={bounds.width - 40}
                    height={40}
                    align="center"
                    verticalAlign="middle"
                    fontSize={16}
                />
            </Group>
        </Group>
    );
}
