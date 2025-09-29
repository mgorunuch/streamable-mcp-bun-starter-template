#!/usr/bin/env bun

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { StreamableHttpTransport } from "./transport.js";

const server = new Server(
  {
    name: "mcp-bun-streamable-starter",
    version: "1.0.0",
  },
  {
    capabilities: {
      // Tools: Enable when your server performs actions/operations (not just data retrieval)
      // ✅ Use for: API calls, file operations, calculations, external integrations
      // ❌ Disable for: Read-only servers, static data providers
      tools: {},

      // Resources: Enable when serving data, documents, or content to clients
      // ✅ Use for: File access, database queries, configuration data
      // ❌ Disable for: Action-only servers with no data exposure
      // resources: {
      //   supported: true,
      //   
      //   // Subscriptions: Enable when resources change over time and clients need updates
      //   // ✅ Use for: Live logs, real-time metrics, file monitoring
      //   // ❌ Disable for: Static resources, rarely changing data
      //   subscriptions: false
      // },

      // Prompts: Enable when providing domain-specific templates for common tasks
      // ✅ Use for: Code generation templates, report builders, guided workflows
      // ❌ Disable for: Simple services, when users always provide custom inputs
      // prompts: {
      //   supported: false
      // },

      // Sampling: Enable when your server needs to generate natural language
      // ✅ Use for: Content generation, summarization, AI-powered responses
      // ❌ Disable for: Structured data only, when intelligence stays client-side
      // sampling: {
      //   supported: false
      // }
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "echo",
        description: "Echo back the input text",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Text to echo back",
            },
          },
          required: ["text"],
        },
      },
      {
        name: "reverse",
        description: "Reverse the input text",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Text to reverse",
            },
          },
          required: ["text"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new McpError(ErrorCode.InvalidParams, "Missing arguments");
  }

  switch (name) {
    case "echo":
      return {
        content: [
          {
            type: "text",
            text: `Echo: ${args.text}`,
          },
        ],
      };

    case "reverse":
      return {
        content: [
          {
            type: "text",
            text: `Reversed: ${String(args.text).split("").reverse().join("")}`,
          },
        ],
      };

    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${name}`
      );
  }
});

async function main() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const host = process.env.HOST || "localhost";

  const transport = new StreamableHttpTransport({
    host,
    port,
    path: "/mcp",
  });

  await server.connect(transport);
  console.log(`MCP Streamable HTTP server running on http://${host}:${port}/mcp`);
}

main().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
