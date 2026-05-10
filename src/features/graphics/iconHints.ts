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
        icon: PredefinedSvg.SNS,
        patterns: [/\bsns\b/i, /\bsimple\s*notification\b/i],
        inheritChildren: true,
        childPatterns: [/\btopics?\b/i, /\bnotifications?\b/i, /\bsubscriptions?\b/i, /\bpub.?sub\b/i]
    },
    {
        icon: PredefinedSvg.EventBridge,
        patterns: [/\bevent.?bridge\b/i, /\bevent.?bus\b/i],
        inheritChildren: true,
        childPatterns: [/\bevents?\b/i, /\brules?\b/i, /\bbus\b/i]
    },
    {
        icon: PredefinedSvg.Firehose,
        patterns: [/\bfirehose\b/i, /\bdata\s*firehose\b/i],
        inheritChildren: true,
        childPatterns: [/\bstreams?\b/i, /\bdeliver(y|ies)\b/i]
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
        icon: PredefinedSvg.ECR,
        patterns: [/\becr\b/i, /\belastic\s*container\s*registry\b/i, /\bcontainer\s*registry\b/i],
        inheritChildren: true,
        childPatterns: [/\bimages?\b/i, /\brepositor(y|ies)\b/i, /\brepos?\b/i]
    },
    {
        icon: PredefinedSvg.Route53,
        patterns: [/\broute.?53\b/i, /\br53\b/i, /\bdns\b/i]
    },
    {
        icon: PredefinedSvg.NatGateway,
        patterns: [/\bnat.?gateway\b/i, /\bnat.?gw\b/i, /\bnat\b/i]
    },
    {
        icon: PredefinedSvg.InternetGateway,
        patterns: [/\binternet.?gateway\b/i, /\bigw\b/i]
    },
    {
        icon: PredefinedSvg.ParamStore,
        patterns: [/\bparameter\s*store\b/i, /\bparam\s*store\b/i, /\bparamstore\b/i, /\bssm\s*parameter\b/i],
        inheritChildren: true,
        childPatterns: [/\bparameters?\b/i, /\bparams?\b/i, /\bconfigs?\b/i]
    },
    {
        icon: PredefinedSvg.EC2,
        patterns: [/\bec2\b/i, /\belastic\s*compute\b/i],
        inheritChildren: true,
        childPatterns: [/\binstances?\b/i, /\bservers?\b/i, /\bvms?\b/i, /\bnodes?\b/i]
    },
    {
        icon: PredefinedSvg.Beanstalk,
        patterns: [/\bbeanstalk\b/i, /\belastic\s*beanstalk\b/i]
    },
    {
        icon: PredefinedSvg.Batch,
        patterns: [/\baws.?batch\b/i, /\bbatch\s+jobs?\b/i, /\bbatch\b/i]
    },
    {
        icon: PredefinedSvg.EKS,
        patterns: [/\beks\b/i, /\belastic\s*kubernetes\b/i, /\bkubernetes\b/i, /\bk8s\b/i],
        inheritChildren: true,
        childPatterns: [/\bpods?\b/i, /\bnodes?\b/i, /\bclusters?\b/i, /\bdeployments?\b/i]
    },
    {
        icon: PredefinedSvg.RDS,
        patterns: [/\brds\b/i, /\brelational\s*database\b/i, /\bpostgres(ql)?\b/i, /\bmysql\b/i, /\bmariadb\b/i, /\boracle\b/i],
        inheritChildren: true,
        childPatterns: [/\btables?\b/i, /\bdatabases?\b/i, /\bdbs?\b/i, /\bschemas?\b/i]
    },
    {
        icon: PredefinedSvg.Aurora,
        patterns: [/\baurora\b/i],
        inheritChildren: true,
        childPatterns: [/\bclusters?\b/i, /\bwriters?\b/i, /\breaders?\b/i, /\breplicas?\b/i]
    },
    {
        icon: PredefinedSvg.ElastiCache,
        patterns: [/\belastic.?cache\b/i, /\belasticache\b/i, /\bredis\b/i, /\bmemcached\b/i],
        inheritChildren: true,
        childPatterns: [/\bcaches?\b/i, /\bnodes?\b/i]
    },
    {
        icon: PredefinedSvg.EFS,
        patterns: [/\befs\b/i, /\belastic\s*file\s*system\b/i, /\belastic\s*file\b/i],
        inheritChildren: true,
        childPatterns: [/\bfilesystems?\b/i, /\bfile\s*systems?\b/i, /\bmounts?\b/i]
    },
    {
        icon: PredefinedSvg.EBS,
        patterns: [/\bebs\b/i, /\belastic\s*block\s*store\b/i, /\belastic\s*block\b/i],
        inheritChildren: true,
        childPatterns: [/\bvolumes?\b/i, /\bsnapshots?\b/i]
    },
    {
        icon: PredefinedSvg.Backup,
        patterns: [/\baws.?backup\b/i, /\bbackup\s*vaults?\b/i, /\bbackup\s*plans?\b/i, /\bbackup\b/i]
    },
    {
        icon: PredefinedSvg.VPC,
        patterns: [/\bvpc\b/i, /\bvirtual\s*private\s*cloud\b/i],
        inheritChildren: true,
        childPatterns: [/\bsubnets?\b/i, /\broute.?tables?\b/i]
    },
    {
        icon: PredefinedSvg.TransitGateway,
        patterns: [/\btransit.?gateway\b/i, /\btgw\b/i]
    },
    {
        icon: PredefinedSvg.DirectConnect,
        patterns: [/\bdirect.?connect\b/i, /\bdirectconnect\b/i]
    },
    {
        icon: PredefinedSvg.IAM,
        patterns: [/\biam\b/i, /\bidentity\s*and\s*access\b/i],
        inheritChildren: true,
        childPatterns: [/\broles?\b/i, /\bpolic(y|ies)\b/i, /\bgroups?\b/i, /\bprincipals?\b/i]
    },
    {
        icon: PredefinedSvg.CloudFormation,
        patterns: [/\bcloud.?formation\b/i, /\bcfn\b/i],
        inheritChildren: true,
        childPatterns: [/\bstacks?\b/i, /\btemplates?\b/i]
    },
    {
        icon: PredefinedSvg.CloudTrail,
        patterns: [/\bcloud.?trail\b/i],
        inheritChildren: true,
        childPatterns: [/\btrails?\b/i, /\baudit\s*logs?\b/i]
    },
    {
        icon: PredefinedSvg.StepFunctions,
        patterns: [/\bstep\s*functions?\b/i, /\bsfn\b/i, /\bstate\s*machines?\b/i],
        inheritChildren: true,
        childPatterns: [/\bstates?\b/i, /\btasks?\b/i, /\bworkflows?\b/i]
    },
    {
        icon: PredefinedSvg.SES,
        patterns: [/\bses\b/i, /\bsimple\s*email\b/i],
        inheritChildren: true,
        childPatterns: [/\bemails?\b/i, /\bidentit(y|ies)\b/i]
    },
    {
        icon: PredefinedSvg.MSK,
        patterns: [/\bmsk\b/i, /\bmanaged\s*streaming\b/i, /\bkafka\b/i],
        inheritChildren: true,
        childPatterns: [/\btopics?\b/i, /\bbrokers?\b/i, /\bpartitions?\b/i]
    },
    {
        icon: PredefinedSvg.MQ,
        patterns: [/\bamazon.?mq\b/i, /\bactivemq\b/i, /\brabbitmq\b/i, /\bamq\b/i, /\bmq\b/i]
    },
    {
        icon: PredefinedSvg.Glue,
        patterns: [/\baws.?glue\b/i, /\bglue\b/i],
        inheritChildren: true,
        childPatterns: [/\bcrawlers?\b/i, /\betl\b/i, /\bjobs?\b/i, /\bdata\s*catalog\b/i]
    },
    {
        icon: PredefinedSvg.Athena,
        patterns: [/\bathena\b/i],
        inheritChildren: true,
        childPatterns: [/\bquer(y|ies)\b/i, /\bworkgroups?\b/i]
    },
    {
        icon: PredefinedSvg.Redshift,
        patterns: [/\bredshift\b/i],
        inheritChildren: true,
        childPatterns: [/\bclusters?\b/i, /\bwarehouses?\b/i]
    },
    {
        icon: PredefinedSvg.OpenSearch,
        patterns: [/\bopen.?search\b/i, /\belasticsearch\b/i, /\bopensearch\b/i],
        inheritChildren: true,
        childPatterns: [/\bindexe?s\b/i, /\bdocuments?\b/i, /\bshards?\b/i]
    },
    {
        icon: PredefinedSvg.Bedrock,
        patterns: [/\bbedrock\b/i],
        inheritChildren: true,
        childPatterns: [/\bmodels?\b/i, /\bllms?\b/i, /\bagents?\b/i]
    },
    {
        icon: PredefinedSvg.SageMaker,
        patterns: [/\bsage.?maker\b/i],
        inheritChildren: true,
        childPatterns: [/\bnotebooks?\b/i, /\bmodels?\b/i, /\bendpoints?\b/i, /\btraining\b/i]
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
        icon: PredefinedSvg.SecretsManager,
        patterns: [/\bsecrets?\s*manager\b/i, /\bsecretsmanager\b/i, /\basm\b/i],
        inheritChildren: true,
        childPatterns: [/\bsecrets?\b/i, /\bcredentials?\b/i]
    },
    {
        icon: PredefinedSvg.KMS,
        patterns: [/\bkms\b/i, /\bkey\s*management\b/i],
        inheritChildren: true,
        childPatterns: [/\bkeys?\b/i, /\bcmk\b/i, /\bencryption\b/i]
    },
    {
        icon: PredefinedSvg.CloudWatch,
        patterns: [/\bcloud.?watch\b/i, /\bcw\b/i],
        inheritChildren: true,
        childPatterns: [/\bmetrics?\b/i, /\balarms?\b/i, /\blog\s*groups?\b/i, /\bdashboards?\b/i, /\blogs?\b/i]
    },
    {
        icon: PredefinedSvg.XRay,
        patterns: [/\bx[-\s]?ray\b/i],
        inheritChildren: true,
        childPatterns: [/\btraces?\b/i, /\bsegments?\b/i]
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
