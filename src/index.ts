#!/usr/bin/env bun

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { StreamableHttpTransport } from "./transport.js";
import {
  EchoSchema,
  ReverseSchema,
  CalculatorSchema,
  zodToJsonSchema,
  createToolHandler,
} from "./schemas.js";

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
      tools: {}

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

// Create validated tool handlers
const echoHandler = createToolHandler(EchoSchema, async (args) => {
  return {
    content: [
      {
        type: "text",
        text: `Echo: ${args.text}`,
      },
    ],
  };
});

const reverseHandler = createToolHandler(ReverseSchema, async (args) => {
  return {
    content: [
      {
        type: "text",
        text: `Reversed: ${args.text.split("").reverse().join("")}`,
      },
    ],
  };
});

const calculatorHandler = createToolHandler(CalculatorSchema, async (args) => {
  let result: number;

  switch (args.operation) {
    case "add":
      result = args.a + args.b;
      break;
    case "subtract":
      result = args.a - args.b;
      break;
    case "multiply":
      result = args.a * args.b;
      break;
    case "divide":
      if (args.b === 0) {
        throw new McpError(ErrorCode.InvalidParams, "Division by zero is not allowed");
      }
      result = args.a / args.b;
      break;
    default:
      throw new McpError(ErrorCode.InvalidParams, `Unknown operation: ${args.operation}`);
  }

  return {
    content: [
      {
        type: "text",
        text: `${args.a} ${args.operation} ${args.b} = ${result}`,
      },
    ],
  };
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "echo",
        description: "Echo back the input text",
        inputSchema: zodToJsonSchema(EchoSchema),
      },
      {
        name: "reverse",
        description: "Reverse the input text",
        inputSchema: zodToJsonSchema(ReverseSchema),
      },
      {
        name: "calculator",
        description: "Perform basic mathematical operations",
        inputSchema: zodToJsonSchema(CalculatorSchema),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "echo":
        return await echoHandler(args);

      case "reverse":
        return await reverseHandler(args);

      case "calculator":
        return await calculatorHandler(args);

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }

    // Handle Zod validation errors
    if (error && typeof error === "object" && "issues" in error) {
      const zodError = error as any;
      const issues = zodError.issues.map((issue: any) =>
        `${issue.path.join(".")}: ${issue.message}`
      ).join(", ");

      throw new McpError(
        ErrorCode.InvalidParams,
        `Validation error: ${issues}`
      );
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error}`
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
