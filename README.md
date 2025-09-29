# MCP Bun Streamable Starter Template

A starter template for building Model Context Protocol (MCP) servers with Streamable HTTP transport using Bun.

## Features

- ✅ **Streamable HTTP Transport**: Implements the MCP Streamable HTTP specification
- ✅ **Server-Sent Events (SSE)**: Real-time streaming support
- ✅ **Session Management**: Proper session handling with unique IDs
- ✅ **Security**: Origin validation and protocol version checking
- ✅ **TypeScript**: Full TypeScript support with proper types
- ✅ **Bun Runtime**: Fast JavaScript runtime optimized for performance

## Quick Start

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Run in development mode**:
   ```bash
   bun run dev
   ```

3. **Build for production**:
   ```bash
   bun run build
   bun start
   ```

The server will start on `http://localhost:3000/mcp` by default.

## Environment Variables

- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: localhost)

## Usage

### Basic Example

The starter includes two example tools:

- `echo`: Returns the input text
- `reverse`: Reverses the input text

### Testing the Server

You can test the server using curl:

```bash
# List available tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2025-03-26" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'

# Call the echo tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2025-03-26" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "echo",
      "arguments": {
        "text": "Hello, MCP!"
      }
    }
  }'

# Open SSE stream for real-time messages
curl -N http://localhost:3000/mcp \
  -H "Accept: text/event-stream" \
  -H "MCP-Protocol-Version: 2025-03-26"
```

## Project Structure

```
├── src/
│   ├── index.ts          # Main server entry point
│   └── transport.ts      # Streamable HTTP transport implementation
├── dist/                 # Compiled output (after build)
├── package.json
├── tsconfig.json
└── README.md
```

## MCP Streamable HTTP Transport

This implementation follows the [MCP Streamable HTTP Transport specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http):

### Key Features

- **POST requests**: For sending JSON-RPC messages
- **GET requests**: For opening SSE streams to receive real-time messages
- **Session management**: Unique session IDs for client tracking
- **Security**: Origin validation and protocol version checking
- **Backwards compatibility**: Supports the standard MCP protocol version

### Transport Characteristics

- Uses HTTP POST and GET methods
- Supports Server-Sent Events (SSE) for streaming
- JSON-RPC encoded messages in UTF-8
- Single endpoint path (`/mcp` by default)

## MCP Capabilities Configuration

The server's capabilities determine what features are available to MCP clients. Configure them in `src/index.ts`:

### **Tools** (`tools: {}`)
Currently **enabled** - allows clients to call functions that perform actions.

**Enable when:**
- ✅ Your server performs actions/operations (API calls, file operations, calculations)
- ✅ You need to execute functions with side effects
- ✅ You provide computational services

**Disable when:**
- ❌ Your server only provides static data
- ❌ You only need read-only access to resources

### **Resources** (`resources: { supported: true, subscriptions: false }`)
Currently **disabled** - uncomment to enable data/content serving.

**Enable when:**
- ✅ You serve data, documents, or content to clients
- ✅ You provide access to files, configurations, or databases
- ✅ You need to expose structured information

**Enable subscriptions when:**
- ✅ Your resources change over time and clients need updates
- ✅ You support real-time data monitoring

### **Prompts** (`prompts: { supported: true }`)
Currently **disabled** - uncomment to enable template workflows.

**Enable when:**
- ✅ You provide domain-specific templates for common tasks
- ✅ You want to standardize user interactions
- ✅ You have complex workflows that benefit from guidance

### **Sampling** (`sampling: { supported: true }`)
Currently **disabled** - uncomment to enable AI/LLM capabilities.

**Enable when:**
- ✅ Your server needs to generate natural language
- ✅ You require AI/LLM capabilities within your server logic
- ✅ You need to process or transform text intelligently

## Customization

### Adding New Tools

Add new tools in `src/index.ts`:

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ... existing tools
      {
        name: "your-tool",
        description: "Description of your tool",
        inputSchema: {
          type: "object",
          properties: {
            // Define your tool's parameters
          },
          required: ["param1"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    // ... existing cases
    case "your-tool":
      return {
        content: [
          {
            type: "text",
            text: "Your tool's response",
          },
        ],
      };
  }
});
```

### Transport Configuration

Modify the transport options in `src/index.ts`:

```typescript
const transport = new StreamableHttpTransport({
  host: "localhost",    // Server host
  port: 3000,          // Server port
  path: "/mcp",        // Endpoint path
});
```

## Development

- `bun run dev`: Start development server with hot reload
- `bun run build`: Build for production
- `bun run typecheck`: Run TypeScript type checking
- `bun test`: Run tests

## License

MIT