import React, {FC, useContext, useMemo} from "react";
import {Image, Rect, Text} from "react-konva";
import {NodeContentProps} from "./NodeContentProps";
import {AppLayoutContext} from "../../app/AppModel";
import {adjustColorSchemaForTheme} from "../../common/colors/colorTransform";

// Add a WeakMap to cache results by image instance
const pixelColorCache = new WeakMap<HTMLImageElement, { color: string | null, hasTopLeftPixel: boolean }>();

const getDominantColorAndEitherTopLeftPixelVisible = (image: HTMLImageElement | undefined): { color: string | null, hasTopLeftPixel: boolean } => {
    if (!image) return { color: null, hasTopLeftPixel: false };

    // Check if result is already cached
    if (pixelColorCache.has(image)) {
        return pixelColorCache.get(image)!;
    }

    try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return { color: null, hasTopLeftPixel: false };

        canvas.width = 1;
        canvas.height = 1;
        // zoom icon to 1x1 canvas to get dominant color
        context.drawImage(image, 0, 0, image.width, image.height, 0, 0, 1, 1);

        // draw only the top-left pixel
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

            const result = {
                color: color,
                hasTopLeftPixel: pixelData2[3] > 10
            };

            // Cache the result
            pixelColorCache.set(image, result);
            return result;
        }

        // If all pixels are transparent, return null
        const result = { color: null, hasTopLeftPixel: false };
        pixelColorCache.set(image, result);
        return result;
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

    const { color: borderColor, hasTopLeftPixel } = useMemo(() =>
      getDominantColorAndEitherTopLeftPixelVisible(image), [image]);
    const finalBorderColor = borderColor || colorSchema.strokeColor;
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
                    width={32}
                    height={32}
                    listening={false}
                />
            )}

            <Text
                x={placement.bounds.x + 32 + 4} // Right of icon with padding
                y={placement.bounds.y}
                width={placement.bounds.width - 32 - 4}
                height={32}
                fontSize={14}
                fill={colorSchema.textColor}
                align={"left"}
                verticalAlign={"middle"}
                text={node.text}
                draggable={false}
                listening={false}
                preventDefault={true}
            />
        </>
    );
};
