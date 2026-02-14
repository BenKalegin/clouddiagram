import {PredefinedSvg} from "../graphics/graphicsReader";

export interface GalleryItem {
    key: string;
    name: string;
    icon?: PredefinedSvg

    thumbnail?: string;
    description?: string;
    color?: string;
    shape?: string;
    location?: string;
    width?: number;
    height?: number;
}

export const commonNote = 'common:note';
export const classClass = 'class:class';
export const classInterface = 'class:interface';
export const interactionLifeline = 'interaction:lifeline';

export const interactionActor = 'interaction:actor';
export const interactionBoundary = 'interaction:boundary';
export const interactionControl = 'interaction:control';
export const interactionEntity = 'interaction:entity';
export const interactionFragment = 'interaction:fragment';
export const interactionEndpoint = 'interaction:endpoint';

export const deploymentSqs = 'deployment:aws:sqs';
export const deploymentKinesis = 'deployment:aws:kinesis';
export const deploymentElb = 'deployment:aws:elb';
export const deploymentRoute53 = 'deployment:aws:route53';
export const deploymentCloudFront = 'deployment:aws:cloudfront';
export const deploymentEcs = 'deployment:aws:ecs';
export const deploymentDynamoDb = 'deployment:aws:dynamodb';
export const deploymentS3 = 'deployment:aws:s3';
export const deploymentLambda = 'deployment:aws:lambda';
export const deploymentUsers = 'deployment:aws:users';
export const deploymentClient = 'deployment:aws:client';
export const deploymentWaf = 'deployment:aws:waf';
export const deploymentS3Bucket = `deployment:aws:s3bucket`;
export const deploymentCognito = `deployment:aws:cognito`;
export const deploymentApiGateway = `deployment:aws:apigateway`;

export const flowchartProcess = "flowchart:process";
export const flowchartDecision = "flowchart:decision";
export const flowchartTerminator = "flowchart:terminator";
export const flowchartInputOutput = "flowchart:input-output";

export const c4Person = "c4:person";
export const c4System = "c4:system";
export const c4Container = "c4:container";
export const c4Component = "c4:component";

const items: GalleryItem[] = [
    {key: classClass, name: 'Class', icon: PredefinedSvg.Class},
    {key: classInterface, name: 'Interface', icon: PredefinedSvg.Interface},
    {key: 'class:data-type', name: 'Data Type'},
    {key: 'class:enum', name: 'Enumeration'},
    {key: 'class:primitive', name: 'Primitive'},
    {key: 'class:signal', name: 'Signal'},
    {key: 'class:association', name: 'Association'},
    {key: interactionActor, name: 'Actor', icon: PredefinedSvg.Actor},
    {key: interactionLifeline, name: 'Lifeline', icon: PredefinedSvg.Lifeline},
    {key: interactionBoundary, name: 'Boundary', icon: PredefinedSvg.Boundary},
    {key: interactionControl, name: 'Control', icon: PredefinedSvg.Control},
    {key: interactionEntity, name: 'Entity', icon: PredefinedSvg.Entity},
    {key: commonNote, name: 'Note', icon: PredefinedSvg.Note},
    {key: deploymentSqs, name: 'SQS', icon: PredefinedSvg.SQS},
    {key: deploymentKinesis, name: 'Kinesis', icon: PredefinedSvg.Kinesis},
    {key: deploymentElb, name: 'ELB', icon: PredefinedSvg.ELB},
    {key: deploymentRoute53, name: 'Route 53', icon: PredefinedSvg.Route53},
    {key: deploymentCloudFront, name: 'Cloud Front', icon: PredefinedSvg.CloudFront},
    {key: deploymentEcs, name: 'ECS', icon: PredefinedSvg.ECS},
    {key: deploymentDynamoDb, name: 'DynamoDB', icon: PredefinedSvg.DynamoDB},
    {key: deploymentS3, name: 'S3', icon: PredefinedSvg.S3},
    {key: deploymentLambda, name: 'Lambda', icon: PredefinedSvg.Lambda},
    {key: deploymentUsers, name: 'Users', icon: PredefinedSvg.Users},
    {key: deploymentClient, name: 'Client', icon: PredefinedSvg.Client},
    {key: deploymentWaf, name: 'WAF', icon: PredefinedSvg.WAF},
    {key: deploymentS3Bucket, name: 'S3 Bucket', icon: PredefinedSvg.S3Bucket},
    {key: deploymentCognito, name: 'Cognito', icon: PredefinedSvg.Cognito},
    {key: deploymentApiGateway, name: 'API Gateway', icon: PredefinedSvg.ApiGateway},
    {key: flowchartProcess, name: 'Process'},
    {key: flowchartDecision, name: 'Decision'},
    {key: flowchartTerminator, name: 'Terminator'},
    {key: flowchartInputOutput, name: 'Input/Output'},
    {key: c4Person, name: 'Person', icon: PredefinedSvg.Actor},
    {key: c4System, name: 'System'},
    {key: c4Container, name: 'Container'},
    {key: c4Component, name: 'Component'},
]


interface IGalleryGroup {
    name: string,
    key: string,
    items: GalleryItem[]
}

export const galleryGroups: IGalleryGroup[] = [
    {
        name: "Class",
        key: "class",
        items: items.filter(item => item.key.startsWith("class:"))
    },
    {
        name: 'Interaction',
        key: 'interaction',
        items: items.filter(item => item.key.startsWith("interaction:"))
    },
    {
        name: 'Common',
        key: 'common',
        items: items.filter(item => item.key.startsWith("common:"))
    },
    {
        name: 'Deployment',
        key: 'deployment',
        items: items.filter(item => item.key.startsWith("deployment:"))
    },
    {
        name: "Flowchart",
        key: "flowchart",
        items: items.filter(item => item.key.startsWith("flowchart:"))
    },
    {
        name: "C4",
        key: "c4",
        items: items.filter(item => item.key.startsWith("c4:"))
    },
];



