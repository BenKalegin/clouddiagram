import { PredefinedSvg } from "../graphics/graphicsReader";
export interface GalleryItem {
    key: string;
    name: string;
    icon?: PredefinedSvg;
    thumbnail?: string;
    description?: string;
    color?: string;
    shape?: string;
    location?: string;
    width?: number;
    height?: number;
}
export declare const commonNote = "common:note";
export declare const classClass = "class:class";
export declare const classInterface = "class:interface";
export declare const interactionLifeline = "interaction:lifeline";
export declare const interactionActor = "interaction:actor";
export declare const interactionBoundary = "interaction:boundary";
export declare const interactionControl = "interaction:control";
export declare const interactionEntity = "interaction:entity";
export declare const interactionFragment = "interaction:fragment";
export declare const interactionEndpoint = "interaction:endpoint";
export declare const deploymentSqs = "deployment:aws:sqs";
export declare const deploymentKinesis = "deployment:aws:kinesis";
export declare const deploymentElb = "deployment:aws:elb";
export declare const deploymentRoute53 = "deployment:aws:route53";
export declare const deploymentCloudFront = "deployment:aws:cloudfront";
export declare const deploymentEcs = "deployment:aws:ecs";
export declare const deploymentDynamoDb = "deployment:aws:dynamodb";
export declare const deploymentS3 = "deployment:aws:s3";
export declare const deploymentLambda = "deployment:aws:lambda";
export declare const deploymentUsers = "deployment:aws:users";
export declare const deploymentClient = "deployment:aws:client";
export declare const deploymentWaf = "deployment:aws:waf";
export declare const deploymentS3Bucket = "deployment:aws:s3bucket";
export declare const deploymentCognito = "deployment:aws:cognito";
export declare const deploymentApiGateway = "deployment:aws:apigateway";
export declare const flowchartProcess = "flowchart:process";
export declare const flowchartDecision = "flowchart:decision";
export declare const flowchartTerminator = "flowchart:terminator";
export declare const flowchartInputOutput = "flowchart:input-output";
export declare const c4Person = "c4:person";
export declare const c4System = "c4:system";
export declare const c4Container = "c4:container";
export declare const c4Component = "c4:component";
interface IGalleryGroup {
    name: string;
    key: string;
    items: GalleryItem[];
}
export declare const galleryGroups: IGalleryGroup[];
export {};
//# sourceMappingURL=models.d.ts.map