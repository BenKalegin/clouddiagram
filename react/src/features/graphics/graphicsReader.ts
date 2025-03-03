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
}

export const iconRegistry: Record<PredefinedSvg, string> = {
    [PredefinedSvg.Actor]: ActorIcon,
    [PredefinedSvg.Boundary]: BoundaryIcon,
    [PredefinedSvg.Control]: ControlIcon,
    [PredefinedSvg.Entity]: EntityIcon,
    [PredefinedSvg.Class]: ClassIcon,
    [PredefinedSvg.Interface]: InterfaceIcon,
    [PredefinedSvg.Actor]: ActorIcon,
    [PredefinedSvg.Boundary]: BoundaryIcon,
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
