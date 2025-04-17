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
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return { color: null, hasTopLeftPixel: false };

        canvas.width = 1;
        canvas.height = 1;
        context.drawImage(image, 0, 0, image.width, image.height, 0, 0, 1, 1);

        const pixelData = context.getImageData(0, 0, 1, 1).data;
        // If pixel has some opacity, use it
        if (pixelData[3] > 10) {
            const color = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;

            // Specifically check top-left pixel for edge detection
            // Clear the canvas before the second drawing
            context.clearRect(0, 0, 1, 1);
            // Specifically check top-left pixel for edge detection
            context.drawImage(image, 0, 0, 1, 1, 0, 0, 1, 1);
            const pixelData2 = context.getImageData(0, 0, 1, 1).data;

            return {
                color: color,
                hasTopLeftPixel: pixelData2[3] > 10
            };
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

    const { color: borderColor, hasTopLeftPixel} = getTopLeftPixelColor(image);
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
                    x={placement.bounds.x + (hasTopLeftPixel ? 0 : 2)}
                    y={placement.bounds.y + (hasTopLeftPixel ? 0 : 2)}
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
