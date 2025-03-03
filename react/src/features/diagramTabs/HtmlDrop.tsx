import React, {ReactNode} from "react";
import {
    classClass,
    classInterface,
    commonNote,
    deploymentCloudFront,
    deploymentDynamoDb,
    deploymentEcs,
    deploymentElb,
    deploymentKinesis, deploymentLambda, deploymentRoute53, deploymentS3,
    deploymentSqs,
    GalleryItem,
    interactionActor,
    interactionBoundary,
    interactionControl,
    interactionEntity,
    interactionLifeline
} from "../toolbox/models";
import {dropFromPaletteAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {ElementType} from "../../package/packageModel";
import {PredefinedSvg} from "../graphics/graphicsReader";

export interface TypeAndSubType {
    type: ElementType;
    subType?: PredefinedSvg;
}
function mapGalleryType(galleryType: string) : TypeAndSubType {
    switch (galleryType) {
        case commonNote:
            return { type: ElementType.Note};
        case classClass:
        case classInterface:
            return { type: ElementType.ClassNode};

        case interactionLifeline:
            return { type: ElementType.SequenceLifeLine};

        case interactionBoundary:
            return { type: ElementType.SequenceLifeLine, subType: PredefinedSvg.Boundary }
        case interactionControl:
            return { type: ElementType.SequenceLifeLine, subType: PredefinedSvg.Control }
        case interactionEntity:
            return { type: ElementType.SequenceLifeLine, subType: PredefinedSvg.Entity }
        case interactionActor:
            return { type: ElementType.SequenceLifeLine, subType: PredefinedSvg.Actor }

        case deploymentSqs:
            return { type: ElementType.DeploymentNode, subType: PredefinedSvg.SQS }
        case deploymentKinesis:
            return { type: ElementType.DeploymentNode, subType: PredefinedSvg.Kinesis }
        case deploymentElb:
            return { type: ElementType.DeploymentNode, subType: PredefinedSvg.ELB }
        case deploymentEcs:
            return { type: ElementType.DeploymentNode, subType: PredefinedSvg.ECS }
        case deploymentDynamoDb:
            return { type: ElementType.DeploymentNode, subType: PredefinedSvg.DynamoDB }
        case deploymentCloudFront:
            return { type: ElementType.DeploymentNode, subType: PredefinedSvg.CloudFront }
        case deploymentRoute53:
            return { type: ElementType.DeploymentNode, subType: PredefinedSvg.Route53 }
        case deploymentS3:
            return { type: ElementType.DeploymentNode, subType: PredefinedSvg.S3 }
        case deploymentLambda:
            return { type: ElementType.DeploymentNode, subType: PredefinedSvg.Lambda }


        default:
            throw new Error("Unknown gallery type: " + galleryType);
    }
}
export function HtmlDrop(props: { children: ReactNode }) {

    const dispatch = useDispatch();

    return (
        <div
            // Stage wrapper that handles drag and drop
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                const target = e.target as HTMLDivElement;
                const rect = target.getBoundingClientRect();

                const offsetX = e.clientX - rect.x;
                const offsetY = e.clientY - rect.y;
                const galleryItem: GalleryItem = JSON.parse(e.dataTransfer.getData("application/json"));
                dispatch(dropFromPaletteAction(
            {
                        droppedAt: {x: offsetX, y: offsetY},
                        name: galleryItem.name,
                        kind: mapGalleryType(galleryItem.key)
                    }));
            }}
        >
            {props.children}
        </div>

    );
}
