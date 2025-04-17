import React, {FC, useContext} from "react";
import {Image, Rect, Text} from "react-konva";
import {NodeContentProps} from "./NodeContentProps";
import {AppLayoutContext} from "../../app/AppModel";
import {adjustColorSchemaForTheme} from "../../common/colors/colorTransform";

const getTopLeftPixelColor = (image: HTMLImageElement | undefined): { color: string | null, hasTopLeftPixel: boolean } => {
    // todo can we obtain it from svg earlier?
    if (!image) return { color: null, hasTopLeftPixel: false };
    try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return { color: null, hasTopLeftPixel: false };

        const size = 3; // Check a small area
        canvas.width = size;
        canvas.height = size;
        context.drawImage(image, 0, 0, size, size, 0, 0, size, size);

        // Try multiple pixels until we find one with opacity
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const pixelData = context.getImageData(x, y, 1, 1).data;
                // If pixel has some opacity, use it
                if (pixelData[3] > 10) {
                    return {
                        color: `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`,
                        hasTopLeftPixel: x === 0 && y === 0
                    };
                }
            }
        }

        // If all pixels are transparent, return null
        return { color: null, hasTopLeftPixel: false };
    } catch (e) {
        console.error('Error getting pixel color:', e);
        return { color: null, hasTopLeftPixel: false };
    }
};

export const NodeContentTopLeftIcon: FC<NodeContentProps> = ({
      node,
      placement,
      shadowEnabled,
      image
  }) => {

    const { appLayout } = useContext(AppLayoutContext);
    const colorSchema = adjustColorSchemaForTheme(node.colorSchema, appLayout.darkMode);

    const { color: borderColor, hasTopLeftPixel: hasColoredEdge } = getTopLeftPixelColor(image);
    const finalBorderColor = borderColor || node.colorSchema.strokeColor;
    return (
        <>
            <Rect
                stroke={finalBorderColor}
                {...placement.bounds}
                cornerRadius={2}
                shadowEnabled={shadowEnabled}
                shadowColor={'black'}
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}
                listening={false}
            />

            {node.customShape?.pictureId && (
                <Image
                    image={image}
                    x={placement.bounds.x + (hasColoredEdge ? 0 : 2)}
                    y={placement.bounds.y + (hasColoredEdge ? 0 : 2)}
                    width={placement.bounds.height / 3}
                    height={placement.bounds.height / 3}
                    listening={false}
                />
            )}

            <Text
                {...placement.bounds}
                fontSize={14}
                fill={colorSchema.textColor}
                align={"center"}
                verticalAlign={"middle"}
                text={node.text}
                draggable={false}
                listening={false}
                preventDefault={true}
            />
        </>
    );
};
