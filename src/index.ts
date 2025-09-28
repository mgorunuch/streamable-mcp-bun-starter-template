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
      tools: {},
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