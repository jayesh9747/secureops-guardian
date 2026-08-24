import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

import { caseMetadataSchema } from '@guardian/shared';

import { getCaseMetadata } from './metadata.js';

function createServer(): McpServer {
  const server = new McpServer({
    name: 'secureops-guardian-fixture-mcp',
    version: '0.0.0',
  });

  server.registerTool(
    'get_case_metadata',
    {
      title: 'Get synthetic Guardian case metadata',
      description:
        'Returns the identity and explicit synthetic-data boundary for an owned Guardian demo case.',
      inputSchema: {
        caseId: z.string().min(1).describe('Exact owned demo case identifier.'),
      },
      outputSchema: caseMetadataSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    ({ caseId }) => {
      const result = getCaseMetadata(caseId);
      if (result === undefined) {
        return {
          content: [{ type: 'text', text: `Unknown synthetic case: ${caseId}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
        structuredContent: result,
      };
    },
  );

  return server;
}

export function createFixtureMcpApp(host: string) {
  const app = createMcpExpressApp({
    host,
    allowedHosts: ['127.0.0.1', '::1', 'localhost', 'host.docker.internal'],
  });

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok', synthetic: true });
  });

  app.post('/mcp', async (request, response) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, request.body);
    } catch (error: unknown) {
      console.error('Fixture MCP request failed', error);
      if (!response.headersSent) {
        response.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32_603, message: 'Internal server error' },
          id: null,
        });
      }
    } finally {
      await transport.close();
      await server.close();
    }
  });

  app.get('/mcp', (_request, response) => {
    response.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32_000, message: 'Method not allowed in stateless mode.' },
      id: null,
    });
  });

  app.delete('/mcp', (_request, response) => {
    response.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32_000, message: 'Method not allowed in stateless mode.' },
      id: null,
    });
  });

  return app;
}
