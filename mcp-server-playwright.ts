import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { chromium, Browser, Page } from "playwright";

const server = new Server(
  {
    name: "playwright-browser",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let browser: Browser | undefined;
let page: Page | undefined;

async function ensureBrowser() {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    page = await context.newPage();
  }
  return page!;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "navigate",
        description: "Navigate to a URL",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
          },
          required: ["url"],
        },
      },
      {
        name: "screenshot",
        description: "Take a screenshot of the current page",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "click",
        description: "Click an element",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string" },
          },
          required: ["selector"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const p = await ensureBrowser();

  switch (request.params.name) {
    case "navigate": {
      const url = request.params.arguments?.url as string;
      await p.goto(url);
      return {
        content: [{ type: "text", text: `Navigated to ${url}` }],
      };
    }
    case "screenshot": {
      const screenshot = await p.screenshot();
      return {
        content: [
          {
            type: "text",
            text: `Screenshot taken (base64 length: ${screenshot.toString("base64").length})`,
          },
        ],
      };
    }
    case "click": {
      const selector = request.params.arguments?.selector as string;
      await p.click(selector);
      return {
        content: [{ type: "text", text: `Clicked ${selector}` }],
      };
    }
    default:
      throw new Error("Unknown tool");
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Playwright MCP server running on stdio");
}

run().catch(console.error);
