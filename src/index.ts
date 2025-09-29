#!/usr/bin/env bun

import { z, MCPApp, TextResponse, ProgressResponse, LogResponse, RawResponse } from "@the-ihor/mcp-sdk-typescript";

async function main() {
  const app = new MCPApp({
    name: "mcp-generator-server",
    version: "1.0.0",
    transport: {
      host: process.env.HOST || "localhost",
      port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
      path: "/mcp"
    }
  });

  // Create tools with generator handlers and response classes
  app
    .createTool({
      name: "echo",
      description: "Echo back the input text",
      schema: z.object({
        text: z.string().describe("Text to echo back"),
        uppercase: z.boolean().optional().describe("Convert to uppercase")
      }),
      handler: async function* (args) {
        // Generator function with yield
        yield new LogResponse("Starting echo operation", "info");
        
        const result = args.uppercase ? args.text.toUpperCase() : args.text;
        yield new TextResponse(`Echo: ${result}`);
      }
    })
    .createTool({
      name: "calculator",
      description: "Perform basic mathematical operations",
      schema: z.object({
        operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("Mathematical operation"),
        a: z.number().describe("First number"),
        b: z.number().describe("Second number")
      }),
      handler: async function* (args) {
        yield new LogResponse(`Calculating ${args.a} ${args.operation} ${args.b}`, "info");
        
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
              throw new Error("Division by zero is not allowed");
            }
            result = args.a / args.b;
            break;
        }
        
        yield new TextResponse(`${args.a} ${args.operation} ${args.b} = ${result}`);
      }
    })
    .createTool({
      name: "long_process",
      description: "Simulate a long-running process with progress updates",
      schema: z.object({
        steps: z.number().min(1).max(10).default(5).describe("Number of steps to simulate"),
        delay: z.number().min(100).max(2000).default(500).describe("Delay between steps in ms")
      }),
      handler: async function* (args) {
        yield new LogResponse("Starting long process", "info");
        
        for (let i = 1; i <= args.steps; i++) {
          yield new ProgressResponse(`Step ${i} of ${args.steps}`, i, args.steps);
          
          // Simulate work
          await new Promise(resolve => setTimeout(resolve, args.delay));
        }
        
        yield new TextResponse("Process completed successfully!");
        yield new RawResponse({
          type: "result",
          totalSteps: args.steps,
          totalTime: args.steps * args.delay
        });
      }
    });

  await app.start();
}

main().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
