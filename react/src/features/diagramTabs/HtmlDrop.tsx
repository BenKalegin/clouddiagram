import React, {ReactNode} from "react";
import {
    classClass,
    classInterface,
    commonNote, deploymentApiGateway, deploymentClient,
    deploymentCloudFront, deploymentCognito,
    deploymentDynamoDb,
    deploymentEcs,
    deploymentElb,
    deploymentKinesis, deploymentLambda, deploymentRoute53, deploymentS3, deploymentS3Bucket,
    deploymentSqs, deploymentUsers, deploymentWaf,
    c4Component,
    c4Container,
    c4Person,
    c4System,
    flowchartDecision,
    flowchartInputOutput,
    flowchartProcess,
    flowchartTerminator,
    GalleryItem,
    interactionActor,
    interactionBoundary,
    interactionControl,
    interactionEntity,
    interactionLifeline
} from "../toolbox/models";
import {dropFromPaletteAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {ElementType, FlowchartNodeKind} from "../../package/packageModel";
import {PredefinedSvg} from "../graphics/graphicsReader";
import {useRecoilValue} from "recoil";
import {diagramDisplaySelector} from "../diagramEditor/diagramEditorModel";
import {activeDiagramIdAtom} from "./diagramTabsModel";

export interface TypeAndSubType {
    type: ElementType;
    subType?: PredefinedSvg;
    flowchartKind?: FlowchartNodeKind;
}
function mapGalleryType(galleryType: string) : TypeAndSubType {
    switch (galleryType) {
        case commonNote:
            return { type: ElementType.Note};
        case classClass:
        case classInterface:
            return { type: ElementType.ClassNode};

        case flowchartProcess:
            return { type: ElementType.ClassNode, flowchartKind: FlowchartNodeKind.Process };
        case flowchartDecision:
            return { type: ElementType.ClassNode, flowchartKind: FlowchartNodeKind.Decision };
        case flowchartTerminator:
            return { type: ElementType.ClassNode, flowchartKind: FlowchartNodeKind.Terminator };
        case flowchartInputOutput:
            return { type: ElementType.ClassNode, flowchartKind: FlowchartNodeKind.InputOutput };

        case c4Person:
            return { type: ElementType.ClassNode, flowchartKind: FlowchartNodeKind.C4Person, subType: PredefinedSvg.Actor };
        case c4System:
            return { type: ElementType.ClassNode, flowchartKind: FlowchartNodeKind.C4System };
        case c4Container:
            return { type: ElementType.ClassNode, flowchartKind: FlowchartNodeKind.C4Container };
        case c4Component:
            return { type: ElementType.ClassNode, flowchartKind: FlowchartNodeKind.C4Component };

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
        case deploymentUsers:
            return { type: ElementType.DeploymentNode, subType: PredefinedSvg.Users }
        case deploymentClient:
            return { type: ElementType.DeploymentNode, subType: PredefinedSvg.Client }
        case deploymentWaf:
            return { type: ElementType.DeploymentNode, subType: PredefinedSvg.WAF }
        case deploymentS3Bucket:
            return { type: ElementType.DeploymentNode, subType: PredefinedSvg.S3Bucket }
        case deploymentCognito:
            return { type: ElementType.DeploymentNode, subType: PredefinedSvg.Cognito }
        case deploymentApiGateway:
            return { type: ElementType.DeploymentNode, subType: PredefinedSvg.ApiGateway }


        default:
            throw new Error("Unknown gallery type: " + galleryType);
    }
}
export function HtmlDrop(props: { children: ReactNode }) {

    const dispatch = useDispatch();
    const activeDiagramId = useRecoilValue(activeDiagramIdAtom);
    const diagramDisplay = useRecoilValue(diagramDisplaySelector(activeDiagramId!));

    return (
        <div
            // Stage wrapper that handles drag and drop
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                const target = e.target as HTMLDivElement;
                const rect = target.getBoundingClientRect();

                // Calculate position relative to the container
                const offsetX = e.clientX - rect.x;
                const offsetY = e.clientY - rect.y;

                // Adjust for diagram scale and offset
                const adjustedX = (offsetX - diagramDisplay.offset.x) / diagramDisplay.scale;
                const adjustedY = (offsetY - diagramDisplay.offset.y) / diagramDisplay.scale;

                const galleryItem: GalleryItem = JSON.parse(e.dataTransfer.getData("application/json"));
                dispatch(dropFromPaletteAction(
            {
                        droppedAt: {x: adjustedX, y: adjustedY},
                        name: galleryItem.name,
                        kind: mapGalleryType(galleryItem.key)
                    }));
            }}
        >
            {props.children}
        </div>

    );
}
