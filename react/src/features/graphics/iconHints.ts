import {PredefinedSvg} from "./graphicsReader";

export interface IconHint {
    icon: PredefinedSvg;
    patterns: RegExp[];
    childPatterns?: RegExp[];
    childHints?: { patterns: RegExp[]; icon: PredefinedSvg }[];
    inheritChildren?: boolean;
}

export const iconHints: IconHint[] = [
    // ApiGateway before ELB — "API Gateway / Load Balancer" should prefer ApiGateway
    {
        icon: PredefinedSvg.ApiGateway,
        patterns: [/\bapi.?gateway\b/i, /\bapigw\b/i, /\brest\s*api\b/i]
    },
    {
        icon: PredefinedSvg.ELB,
        patterns: [/\belb\b/i, /\bload.?balancer\b/i, /\balb\b/i, /\bnlb\b/i]
    },
    {
        icon: PredefinedSvg.SQS,
        patterns: [/\bsqs\b/i],
        inheritChildren: true,
        childPatterns: [/\bqueues?\b/i, /\bjob\b/i, /\btask\b/i, /\bmessage\b/i]
    },
    {
        icon: PredefinedSvg.Kinesis,
        patterns: [/\bkinesis\b/i],
        childPatterns: [/\bstream\b/i, /\bshard\b/i, /\brecord\b/i]
    },
    {
        icon: PredefinedSvg.Lambda,
        patterns: [/\blambda\b/i],
        inheritChildren: true,
        childPatterns: [/\bfunction\b/i, /\bhandler\b/i, /\bworker\b/i]
    },
    {
        icon: PredefinedSvg.DynamoDB,
        patterns: [/\bdynamodb\b/i, /\bdynamo\b/i],
        inheritChildren: true,
        childPatterns: [/\btable\b/i, /\bitem\b/i, /\brecord\b/i]
    },
    {
        icon: PredefinedSvg.S3,
        patterns: [/\bs3\b/i],
        childHints: [{patterns: [/\bbucket\b/i, /\bfile\b/i, /\bobject\b/i, /\bstorage\b/i], icon: PredefinedSvg.S3Bucket}]
    },
    {
        icon: PredefinedSvg.S3Bucket,
        patterns: [/\bs3.?bucket\b/i, /\bbucket\b/i]
    },
    {
        icon: PredefinedSvg.CloudFront,
        patterns: [/\bcloudfront\b/i, /\bcdn\b/i]
    },
    {
        icon: PredefinedSvg.ECS,
        patterns: [/\becs\b/i, /\bfargate\b/i],
        inheritChildren: true,
        childPatterns: [/\bcontainer\b/i, /\bservice\b/i]
    },
    {
        icon: PredefinedSvg.Route53,
        patterns: [/\broute.?53\b/i, /\br53\b/i, /\bdns\b/i]
    },
    {
        icon: PredefinedSvg.Cognito,
        patterns: [/\bcognito\b/i, /\buser\s*pool\b/i]
    },
    {
        icon: PredefinedSvg.WAF,
        patterns: [/\bwaf\b/i, /\bweb\s+acl\b/i, /\bfirewall\b/i]
    },
    {
        icon: PredefinedSvg.Users,
        patterns: [/\busers\b/i, /\bend\s*users\b/i, /\bpersons?\b/i]
    },
    {
        icon: PredefinedSvg.Client,
        patterns: [/\bclient\b/i, /\bweb\s*ui\b/i, /\bmobile\b/i, /\bbrowser\b/i],
        inheritChildren: false,
        childPatterns: [/\badd.?in\b/i, /\bplugin\b/i, /\bextension\b/i]
    },
];

export function detectIcon(
    id: string,
    label: string,
    parentIcon?: PredefinedSvg,
    parentInheritsChildren?: boolean
): PredefinedSvg | undefined {
    const text = `${id} ${label}`;

    // Strong match on id+label
    for (const hint of iconHints) {
        if (hint.patterns.some(p => p.test(text))) return hint.icon;
    }

    // Contextual match via parent
    if (parentIcon !== undefined) {
        if (parentInheritsChildren) return parentIcon;
        const parentHint = iconHints.find(h => h.icon === parentIcon);
        if (parentHint) {
            if (parentHint.childHints) {
                for (const child of parentHint.childHints) {
                    if (child.patterns.some(p => p.test(text))) return child.icon;
                }
            }
            if (parentHint.childPatterns?.some(p => p.test(text))) return parentIcon;
        }
    }

    return undefined;
}
