import {ElementType} from "../../../package/packageModel";

export interface ExampleManifest {
    version: 1;
    groups: ExampleGroup[];
}

export interface ExampleGroup {
    id: string;
    title: string;
    description?: string;
    examples: ExampleEntry[];
}

export interface ExampleEntry {
    id: string;
    title: string;
    description?: string;
    diagramKind: keyof typeof ElementType | ElementType;
    source: string;
}

export const builtInExamples: ExampleManifest = {
    version: 1,
    groups: [
        {
            id: "auth",
            title: "Authentication",
            description: "OAuth, OIDC, and login flows",
            examples: [
                {
                    id: "oauth-device-code",
                    title: "OAuth 2.0 Device Code Flow",
                    description: "Browserless device requests a code; user authorises in another tab.",
                    diagramKind: ElementType.SequenceDiagram,
                    source: `sequenceDiagram
  participant Device
  participant AuthServer as Auth Server
  participant User
  participant Browser
  Device->>AuthServer: POST /device_authorization (client_id)
  AuthServer-->>Device: device_code, user_code, verification_uri, interval
  Device->>User: Display user_code & verification_uri
  User->>Browser: Open verification_uri, enter user_code
  Browser->>AuthServer: Authenticate & approve
  loop Poll until authorised
    Device->>AuthServer: POST /token (device_code)
    AuthServer-->>Device: authorization_pending
  end
  AuthServer-->>Device: access_token, refresh_token
`,
                },
                {
                    id: "oauth-auth-code-pkce",
                    title: "OAuth 2.0 Authorization Code + PKCE",
                    description: "Standard SPA / mobile login flow with PKCE.",
                    diagramKind: ElementType.SequenceDiagram,
                    source: `sequenceDiagram
  participant App
  participant Browser
  participant AuthServer as Auth Server
  participant API
  App->>App: Generate code_verifier + code_challenge
  App->>Browser: Redirect /authorize?code_challenge=...
  Browser->>AuthServer: GET /authorize
  AuthServer-->>Browser: Login page
  Browser->>AuthServer: Submit credentials
  AuthServer-->>Browser: 302 redirect with code
  Browser->>App: code
  App->>AuthServer: POST /token (code, code_verifier)
  AuthServer-->>App: access_token, id_token, refresh_token
  App->>API: GET /resource (Bearer access_token)
  API-->>App: 200 OK
`,
                },
            ],
        },
        {
            id: "ecommerce",
            title: "E-commerce",
            description: "Shopping cart, checkout, payment",
            examples: [
                {
                    id: "shopping-cart-checkout",
                    title: "Shopping Cart Checkout",
                    description: "Cart → payment → order confirmation flow.",
                    diagramKind: ElementType.SequenceDiagram,
                    source: `sequenceDiagram
  participant Customer
  participant Web as Web App
  participant Cart as Cart Service
  participant Payment as Payment Gateway
  participant Order as Order Service
  participant Email
  Customer->>Web: Click "Checkout"
  Web->>Cart: GET /cart
  Cart-->>Web: items, total
  Customer->>Web: Submit payment details
  Web->>Payment: POST /charge (amount, token)
  Payment-->>Web: payment_id, approved
  Web->>Order: POST /orders (items, payment_id)
  Order-->>Web: order_id
  Web->>Email: Send confirmation
  Web-->>Customer: Order confirmed
`,
                },
            ],
        },
        {
            id: "aws",
            title: "AWS Deployment",
            description: "Cloud architectures",
            examples: [
                {
                    id: "aws-three-tier-web",
                    title: "AWS Three-Tier Web App",
                    description: "Users → CloudFront → ALB → EC2/ECS → RDS, with S3 for static assets.",
                    diagramKind: ElementType.DeploymentDiagram,
                    source: `flowchart LR
  Users[Users] --> CF[CloudFront]
  CF --> S3[S3]
  CF --> ALB[ALB]
  subgraph VPC
    ALB --> EC2[EC2]
    EC2 --> RDS[(RDS)]
  end
`,
                },
            ],
        },
    ],
};

export async function loadExamples(remoteUrl?: string): Promise<ExampleManifest> {
    if (!remoteUrl) return builtInExamples;
    try {
        const res = await fetch(remoteUrl, {cache: "default"});
        if (!res.ok) return builtInExamples;
        const data = await res.json();
        if (!isExampleManifest(data)) return builtInExamples;
        return mergeManifests(builtInExamples, data);
    } catch {
        return builtInExamples;
    }
}

function isExampleManifest(value: unknown): value is ExampleManifest {
    return !!value
        && typeof value === "object"
        && (value as ExampleManifest).version === 1
        && Array.isArray((value as ExampleManifest).groups);
}

function mergeManifests(base: ExampleManifest, override: ExampleManifest): ExampleManifest {
    const groupsById = new Map<string, ExampleGroup>();
    for (const g of base.groups) groupsById.set(g.id, g);
    for (const g of override.groups) groupsById.set(g.id, g);
    return {version: 1, groups: Array.from(groupsById.values())};
}
