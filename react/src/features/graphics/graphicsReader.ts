import {ReactComponent as ClassIcon} from "../graphics/class.svg";
import {ReactComponent as InterfaceIcon} from "../graphics/interface.svg";
import {ReactComponent as ActorIcon} from "../graphics/actor.svg";
import {ReactComponent as LifelineIcon} from "../graphics/lifeline.svg";
import {ReactComponent as NoteIcon} from "../graphics/note.svg";
import {ReactComponent as BoundaryIcon} from "../graphics/boundary.svg";
import {ReactComponent as ControlIcon} from "../graphics/control.svg";
import {ReactComponent as EntityIcon} from "../graphics/entity.svg";
import {ReactComponent as SqsIcon} from "../graphics/aws/sqs.svg";
import {ReactComponent as KinesisIcon} from "../graphics/aws/kinesis.svg";
import {ReactComponent as ElbIcon} from "../graphics/aws/elb.svg";
import {ReactComponent as Route53Icon} from "../graphics/aws/route53.svg";
import {ReactComponent as CloudFrontIcon} from "../graphics/aws/cloudfront.svg";
import {ReactComponent as EcsIcon} from "../graphics/aws/ecs.svg";
import {ReactComponent as DynamoDBIcon} from "../graphics/aws/dynamodb.svg";
import Konva from "konva";
import {Shape} from "konva/lib/Shape";
import React from "react";
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
}

export const iconRegistry: Record<PredefinedSvg, React.FunctionComponent<React.SVGProps<SVGSVGElement>>> = {
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
    [PredefinedSvg.CloudFront]: CloudFrontIcon,
    [PredefinedSvg.ECS]: EcsIcon,
    [PredefinedSvg.DynamoDB]: DynamoDBIcon,
};
export type CustomDraw  = (context: Context, shape: Shape<ShapeConfig>) => void


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



export function getCustomDrawById(id: PredefinedSvg) : CustomDraw {
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
            throw new Error("No custom draw for id: " + id);
    }
}
