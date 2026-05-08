import ClassIcon from "../graphics/class.svg";
import InterfaceIcon from "../graphics/interface.svg";
import ActorIcon from "../graphics/actor.svg";
import LifelineIcon from "../graphics/lifeline.svg";
import NoteIcon from "../graphics/note.svg";
import BoundaryIcon from "../graphics/boundary.svg";
import ControlIcon from "../graphics/control.svg";
import EntityIcon from "../graphics/entity.svg";
import SqsIcon from "../graphics/aws/sqs.svg";
import KinesisIcon from "../graphics/aws/kinesis.svg";
import ElbIcon from "../graphics/aws/elb.svg";
import Route53Icon from "../graphics/aws/route53.svg";
import S3Icon from "../graphics/aws/s3.svg";
import CloudFrontIcon from "../graphics/aws/cloudfront.svg";
import EcsIcon from "../graphics/aws/ecs.svg";
import DynamoDBIcon from "../graphics/aws/dynamodb.svg";
import LambdaIcon from "../graphics/aws/lambda.svg";
import UsersIcon from "../graphics/aws/users.svg";
import ClientIcon from "../graphics/aws/client.svg";
import WafIcon from "../graphics/aws/waf.svg";
import S3Bucket from "../graphics/aws/s3bucket.svg";
import Cognito from "../graphics/aws/cognito.svg";
import ApiGateway from "../graphics/aws/apigateway.svg";
import EcrIcon from "../graphics/aws/ecr.svg";
import KmsIcon from "../graphics/aws/kms.svg";
import SecretsManagerIcon from "../graphics/aws/secretsmanager.svg";
import SnsIcon from "../graphics/aws/sns.svg";
import XRayIcon from "../graphics/aws/xray.svg";
import CloudWatchIcon from "../graphics/aws/cloudwatch.svg";
import EventBridgeIcon from "../graphics/aws/eventbridge.svg";
import NatGatewayIcon from "../graphics/aws/natgateway.svg";
import InternetGatewayIcon from "../graphics/aws/internetgateway.svg";
import ParamStoreIcon from "../graphics/aws/paramstore.svg";
import Ec2Icon from "../graphics/aws/ec2.svg";
import RdsIcon from "../graphics/aws/rds.svg";
import AuroraIcon from "../graphics/aws/aurora.svg";
import IamIcon from "../graphics/aws/iam.svg";
import VpcIcon from "../graphics/aws/vpc.svg";
import EksIcon from "../graphics/aws/eks.svg";
import EfsIcon from "../graphics/aws/efs.svg";
import EbsIcon from "../graphics/aws/ebs.svg";
import ElastiCacheIcon from "../graphics/aws/elasticache.svg";
import CloudFormationIcon from "../graphics/aws/cloudformation.svg";
import CloudTrailIcon from "../graphics/aws/cloudtrail.svg";
import StepFunctionsIcon from "../graphics/aws/stepfunctions.svg";
import BeanstalkIcon from "../graphics/aws/beanstalk.svg";
import BatchIcon from "../graphics/aws/batch.svg";
import BackupIcon from "../graphics/aws/backup.svg";
import TransitGatewayIcon from "../graphics/aws/transitgateway.svg";
import DirectConnectIcon from "../graphics/aws/directconnect.svg";
import SesIcon from "../graphics/aws/ses.svg";
import MskIcon from "../graphics/aws/msk.svg";
import FirehoseIcon from "../graphics/aws/firehose.svg";
import MqIcon from "../graphics/aws/mq.svg";
import GlueIcon from "../graphics/aws/glue.svg";
import AthenaIcon from "../graphics/aws/athena.svg";
import RedshiftIcon from "../graphics/aws/redshift.svg";
import OpenSearchIcon from "../graphics/aws/opensearch.svg";
import BedrockIcon from "../graphics/aws/bedrock.svg";
import SageMakerIcon from "../graphics/aws/sagemaker.svg";
import Konva from "konva";
import {Shape} from "konva/lib/Shape";
import ShapeConfig = Konva.ShapeConfig;
import Context = Konva.Context;


export enum PredefinedSvg {
    Actor = 1,
    Boundary,
    Control,
    Entity,
    Class,
    Interface,
    Note,
    Lifeline,
    SQS,
    Kinesis,
    ELB,
    Route53,
    CloudFront,
    ECS,
    DynamoDB,
    S3,
    Lambda,
    Users,
    Client,
    WAF,
    S3Bucket,
    Cognito,
    ApiGateway,
    ECR,
    KMS,
    SecretsManager,
    SNS,
    XRay,
    CloudWatch,
    EventBridge,
    NatGateway,
    InternetGateway,
    ParamStore,
    EC2,
    RDS,
    Aurora,
    IAM,
    VPC,
    EKS,
    EFS,
    EBS,
    ElastiCache,
    CloudFormation,
    CloudTrail,
    StepFunctions,
    Beanstalk,
    Batch,
    Backup,
    TransitGateway,
    DirectConnect,
    SES,
    MSK,
    Firehose,
    MQ,
    Glue,
    Athena,
    Redshift,
    OpenSearch,
    Bedrock,
    SageMaker,
}

export const iconRegistry: Record<PredefinedSvg, string> = {
    [PredefinedSvg.Actor]: ActorIcon,
    [PredefinedSvg.Boundary]: BoundaryIcon,
    [PredefinedSvg.Control]: ControlIcon,
    [PredefinedSvg.Entity]: EntityIcon,
    [PredefinedSvg.Class]: ClassIcon,
    [PredefinedSvg.Interface]: InterfaceIcon,
    [PredefinedSvg.Note]: NoteIcon,
    [PredefinedSvg.Lifeline]: LifelineIcon,
    [PredefinedSvg.SQS]: SqsIcon,
    [PredefinedSvg.Kinesis]: KinesisIcon,
    [PredefinedSvg.ELB]: ElbIcon,
    [PredefinedSvg.Route53]: Route53Icon,
    [PredefinedSvg.S3]: S3Icon,
    [PredefinedSvg.CloudFront]: CloudFrontIcon,
    [PredefinedSvg.ECS]: EcsIcon,
    [PredefinedSvg.DynamoDB]: DynamoDBIcon,
    [PredefinedSvg.Lambda]: LambdaIcon,
    [PredefinedSvg.Users]: UsersIcon,
    [PredefinedSvg.Client]: ClientIcon,
    [PredefinedSvg.WAF]: WafIcon,
    [PredefinedSvg.S3Bucket]: S3Bucket,
    [PredefinedSvg.Cognito]: Cognito,
    [PredefinedSvg.ApiGateway]: ApiGateway,
    [PredefinedSvg.ECR]: EcrIcon,
    [PredefinedSvg.KMS]: KmsIcon,
    [PredefinedSvg.SecretsManager]: SecretsManagerIcon,
    [PredefinedSvg.SNS]: SnsIcon,
    [PredefinedSvg.XRay]: XRayIcon,
    [PredefinedSvg.CloudWatch]: CloudWatchIcon,
    [PredefinedSvg.EventBridge]: EventBridgeIcon,
    [PredefinedSvg.NatGateway]: NatGatewayIcon,
    [PredefinedSvg.InternetGateway]: InternetGatewayIcon,
    [PredefinedSvg.ParamStore]: ParamStoreIcon,
    [PredefinedSvg.EC2]: Ec2Icon,
    [PredefinedSvg.RDS]: RdsIcon,
    [PredefinedSvg.Aurora]: AuroraIcon,
    [PredefinedSvg.IAM]: IamIcon,
    [PredefinedSvg.VPC]: VpcIcon,
    [PredefinedSvg.EKS]: EksIcon,
    [PredefinedSvg.EFS]: EfsIcon,
    [PredefinedSvg.EBS]: EbsIcon,
    [PredefinedSvg.ElastiCache]: ElastiCacheIcon,
    [PredefinedSvg.CloudFormation]: CloudFormationIcon,
    [PredefinedSvg.CloudTrail]: CloudTrailIcon,
    [PredefinedSvg.StepFunctions]: StepFunctionsIcon,
    [PredefinedSvg.Beanstalk]: BeanstalkIcon,
    [PredefinedSvg.Batch]: BatchIcon,
    [PredefinedSvg.Backup]: BackupIcon,
    [PredefinedSvg.TransitGateway]: TransitGatewayIcon,
    [PredefinedSvg.DirectConnect]: DirectConnectIcon,
    [PredefinedSvg.SES]: SesIcon,
    [PredefinedSvg.MSK]: MskIcon,
    [PredefinedSvg.Firehose]: FirehoseIcon,
    [PredefinedSvg.MQ]: MqIcon,
    [PredefinedSvg.Glue]: GlueIcon,
    [PredefinedSvg.Athena]: AthenaIcon,
    [PredefinedSvg.Redshift]: RedshiftIcon,
    [PredefinedSvg.OpenSearch]: OpenSearchIcon,
    [PredefinedSvg.Bedrock]: BedrockIcon,
    [PredefinedSvg.SageMaker]: SageMakerIcon,
};
export type CustomDraw = (context: Context, shape: Shape<ShapeConfig>) => void


function drawBoundary(context: Context, shape: Shape<ShapeConfig>): void {
    context.beginPath();
    context.arc(shape.width() * 0.5, shape.height() / 2, shape.height() * 0.5, 0, Math.PI * 2, false);
    context.moveTo(shape.width() * 0.3, shape.height() * 0.5);
    context.lineTo(shape.width() * 0.2, shape.height() * 0.5);
    context.moveTo(shape.width() * 0.2, shape.height() * 0.1);
    context.lineTo(shape.width() * 0.2, shape.height() * 0.9);
    context.closePath();
    context.fillStrokeShape(shape);
}

function drawEntity(context: Context, shape: Shape<ShapeConfig>): void {
    context.beginPath();
    context.arc(shape.width() * 0.5, shape.height() / 2, shape.height() * 0.5, 0, Math.PI * 2, false);
    context.moveTo(shape.width() * 0.25, shape.height() * 1.05);
    context.lineTo(shape.width() * 0.75, shape.height() * 1.05);
    context.closePath();
    context.fillStrokeShape(shape);
}

function drawControl(context: Context, shape: Shape<ShapeConfig>): void {
    context.beginPath();
    context.arc(shape.width() * 0.5, shape.height() / 2, shape.height() * 0.5, 0, Math.PI * 2, false);
    context.moveTo(shape.width() * 0.5, 0);
    context.lineTo(shape.width() * 0.6, shape.height() * -0.1);
    context.moveTo(shape.width() * 0.5, 0);
    context.lineTo(shape.width() * 0.6, shape.height() * 0.15);
    context.closePath();
    context.fillStrokeShape(shape);
}

function drawActor(context: Context, shape: Shape<ShapeConfig>): void {
    context.beginPath();
    context.arc(shape.width() * 0.5, shape.height() * 0.2, shape.height() * 0.15, 0, Math.PI * 2, false);
    // body
    context.moveTo(shape.width() * 0.5, shape.height() * 0.33);
    context.lineTo(shape.width() * 0.5, shape.height() * 0.7);
    // legs
    context.moveTo(shape.width() * 0.5, shape.height() * 0.65);
    context.lineTo(shape.width() * 0.4, shape.height() * 0.9);
    context.moveTo(shape.width() * 0.5, shape.height() * 0.65);
    context.lineTo(shape.width() * 0.6, shape.height() * 0.9);
    // hands
    context.moveTo(shape.width() * 0.4, shape.height() * 0.5);
    context.lineTo(shape.width() * 0.6, shape.height() * 0.5);
    context.closePath();
    context.fillStrokeShape(shape);
}

// TODO move this code to separate SVGs
export function getLifelineCustomDrawById(id: PredefinedSvg): CustomDraw {
    switch (id) {
        case PredefinedSvg.Actor:
            return drawActor;
        case PredefinedSvg.Boundary:
            return drawBoundary;
        case PredefinedSvg.Control:
            return drawControl;
        case PredefinedSvg.Entity:
            return drawEntity;
        default:
            throw new Error("Unknown id: " + id);
    }
}
