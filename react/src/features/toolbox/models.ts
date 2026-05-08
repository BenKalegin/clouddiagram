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
export const deploymentEcr = `deployment:aws:ecr`;
export const deploymentKms = `deployment:aws:kms`;
export const deploymentSecretsManager = `deployment:aws:secretsmanager`;
export const deploymentSns = `deployment:aws:sns`;
export const deploymentXRay = `deployment:aws:xray`;
export const deploymentCloudWatch = `deployment:aws:cloudwatch`;
export const deploymentEventBridge = `deployment:aws:eventbridge`;
export const deploymentNatGateway = `deployment:aws:natgateway`;
export const deploymentInternetGateway = `deployment:aws:internetgateway`;
export const deploymentParamStore = `deployment:aws:paramstore`;
export const deploymentEc2 = `deployment:aws:ec2`;
export const deploymentRds = `deployment:aws:rds`;
export const deploymentAurora = `deployment:aws:aurora`;
export const deploymentIam = `deployment:aws:iam`;
export const deploymentVpc = `deployment:aws:vpc`;
export const deploymentEks = `deployment:aws:eks`;
export const deploymentEfs = `deployment:aws:efs`;
export const deploymentEbs = `deployment:aws:ebs`;
export const deploymentElastiCache = `deployment:aws:elasticache`;
export const deploymentCloudFormation = `deployment:aws:cloudformation`;
export const deploymentCloudTrail = `deployment:aws:cloudtrail`;
export const deploymentStepFunctions = `deployment:aws:stepfunctions`;
export const deploymentBeanstalk = `deployment:aws:beanstalk`;
export const deploymentBatch = `deployment:aws:batch`;
export const deploymentBackup = `deployment:aws:backup`;
export const deploymentTransitGateway = `deployment:aws:transitgateway`;
export const deploymentDirectConnect = `deployment:aws:directconnect`;
export const deploymentSes = `deployment:aws:ses`;
export const deploymentMsk = `deployment:aws:msk`;
export const deploymentFirehose = `deployment:aws:firehose`;
export const deploymentMq = `deployment:aws:mq`;
export const deploymentGlue = `deployment:aws:glue`;
export const deploymentAthena = `deployment:aws:athena`;
export const deploymentRedshift = `deployment:aws:redshift`;
export const deploymentOpenSearch = `deployment:aws:opensearch`;
export const deploymentBedrock = `deployment:aws:bedrock`;
export const deploymentSageMaker = `deployment:aws:sagemaker`;

export const flowchartProcess = "flowchart:process";
export const flowchartDecision = "flowchart:decision";
export const flowchartTerminator = "flowchart:terminator";
export const flowchartInputOutput = "flowchart:input-output";

export const c4Person = "c4:person";
export const c4System = "c4:system";
export const c4Container = "c4:container";
export const c4Component = "c4:component";

export const mindmapTopic = "mindmap:topic";
export const mindmapSubtopic = "mindmap:subtopic";

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
    {key: deploymentEcr, name: 'ECR', icon: PredefinedSvg.ECR},
    {key: deploymentKms, name: 'KMS', icon: PredefinedSvg.KMS},
    {key: deploymentSecretsManager, name: 'Secrets Manager', icon: PredefinedSvg.SecretsManager},
    {key: deploymentSns, name: 'SNS', icon: PredefinedSvg.SNS},
    {key: deploymentXRay, name: 'X-Ray', icon: PredefinedSvg.XRay},
    {key: deploymentCloudWatch, name: 'CloudWatch', icon: PredefinedSvg.CloudWatch},
    {key: deploymentEventBridge, name: 'EventBridge', icon: PredefinedSvg.EventBridge},
    {key: deploymentNatGateway, name: 'NAT Gateway', icon: PredefinedSvg.NatGateway},
    {key: deploymentInternetGateway, name: 'Internet Gateway', icon: PredefinedSvg.InternetGateway},
    {key: deploymentParamStore, name: 'Parameter Store', icon: PredefinedSvg.ParamStore},
    {key: deploymentEc2, name: 'EC2', icon: PredefinedSvg.EC2},
    {key: deploymentRds, name: 'RDS', icon: PredefinedSvg.RDS},
    {key: deploymentAurora, name: 'Aurora', icon: PredefinedSvg.Aurora},
    {key: deploymentIam, name: 'IAM', icon: PredefinedSvg.IAM},
    {key: deploymentVpc, name: 'VPC', icon: PredefinedSvg.VPC},
    {key: deploymentEks, name: 'EKS', icon: PredefinedSvg.EKS},
    {key: deploymentEfs, name: 'EFS', icon: PredefinedSvg.EFS},
    {key: deploymentEbs, name: 'EBS', icon: PredefinedSvg.EBS},
    {key: deploymentElastiCache, name: 'ElastiCache', icon: PredefinedSvg.ElastiCache},
    {key: deploymentCloudFormation, name: 'CloudFormation', icon: PredefinedSvg.CloudFormation},
    {key: deploymentCloudTrail, name: 'CloudTrail', icon: PredefinedSvg.CloudTrail},
    {key: deploymentStepFunctions, name: 'Step Functions', icon: PredefinedSvg.StepFunctions},
    {key: deploymentBeanstalk, name: 'Beanstalk', icon: PredefinedSvg.Beanstalk},
    {key: deploymentBatch, name: 'Batch', icon: PredefinedSvg.Batch},
    {key: deploymentBackup, name: 'Backup', icon: PredefinedSvg.Backup},
    {key: deploymentTransitGateway, name: 'Transit Gateway', icon: PredefinedSvg.TransitGateway},
    {key: deploymentDirectConnect, name: 'Direct Connect', icon: PredefinedSvg.DirectConnect},
    {key: deploymentSes, name: 'SES', icon: PredefinedSvg.SES},
    {key: deploymentMsk, name: 'MSK', icon: PredefinedSvg.MSK},
    {key: deploymentFirehose, name: 'Firehose', icon: PredefinedSvg.Firehose},
    {key: deploymentMq, name: 'MQ', icon: PredefinedSvg.MQ},
    {key: deploymentGlue, name: 'Glue', icon: PredefinedSvg.Glue},
    {key: deploymentAthena, name: 'Athena', icon: PredefinedSvg.Athena},
    {key: deploymentRedshift, name: 'Redshift', icon: PredefinedSvg.Redshift},
    {key: deploymentOpenSearch, name: 'OpenSearch', icon: PredefinedSvg.OpenSearch},
    {key: deploymentBedrock, name: 'Bedrock', icon: PredefinedSvg.Bedrock},
    {key: deploymentSageMaker, name: 'SageMaker', icon: PredefinedSvg.SageMaker},
    {key: flowchartProcess, name: 'Process'},
    {key: flowchartDecision, name: 'Decision'},
    {key: flowchartTerminator, name: 'Terminator'},
    {key: flowchartInputOutput, name: 'Input/Output'},
    {key: c4Person, name: 'Person', icon: PredefinedSvg.Actor},
    {key: c4System, name: 'System'},
    {key: c4Container, name: 'Container'},
    {key: c4Component, name: 'Component'},
    {key: mindmapTopic, name: 'Topic'},
    {key: mindmapSubtopic, name: 'Subtopic'},
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
    {
        name: "Mind Map",
        key: "mindmap",
        items: items.filter(item => item.key.startsWith("mindmap:"))
    },
];



