import Konva from "konva";
import { Shape } from "konva/lib/Shape";
import ShapeConfig = Konva.ShapeConfig;
import Context = Konva.Context;
export declare enum PredefinedSvg {
    Actor = 1,
    Boundary = 2,
    Control = 3,
    Entity = 4,
    Class = 5,
    Interface = 6,
    Note = 7,
    Lifeline = 8,
    SQS = 9,
    Kinesis = 10,
    ELB = 11,
    Route53 = 12,
    CloudFront = 13,
    ECS = 14,
    DynamoDB = 15,
    S3 = 16,
    Lambda = 17,
    Users = 18,
    Client = 19,
    WAF = 20,
    S3Bucket = 21,
    Cognito = 22,
    ApiGateway = 23
}
export declare const iconRegistry: Record<PredefinedSvg, string>;
export type CustomDraw = (context: Context, shape: Shape<ShapeConfig>) => void;
export declare function getLifelineCustomDrawById(id: PredefinedSvg): CustomDraw;
//# sourceMappingURL=graphicsReader.d.ts.map