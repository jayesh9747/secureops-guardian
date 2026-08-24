import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

import {
  caseMetadataSchema,
  deploymentResultSchema,
  reachabilityResultSchema,
  securityAlertResultSchema,
  serviceDependenciesResultSchema,
} from '@guardian/shared';

import {
  getDeployment,
  getReachabilityObservations,
  getSecurityAlert,
  getServiceDependencies,
} from './evidence.js';
import { getCaseMetadata } from './fixtures.js';

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const caseInputSchema = {
  case_id: z.string().min(1).describe('Exact owned synthetic demo case identifier.'),
};

function unknownCaseResult(caseId: string) {
  return {
    content: [{ type: 'text' as const, text: `Unknown synthetic case: ${caseId}` }],
    isError: true,
  };
}

function successResult(structuredContent: Record<string, unknown>) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(structuredContent) }],
    structuredContent,
  };
}

function createServer(): McpServer {
  const server = new McpServer({
    name: 'secureops-guardian-fixture-mcp',
    version: '0.1.0',
  });

  server.registerTool(
    'get_case_metadata',
    {
      title: 'Get synthetic Guardian case metadata',
      description:
        'Returns identity and explicit synthetic-data boundaries for an owned Guardian demo case.',
      inputSchema: caseInputSchema,
      outputSchema: caseMetadataSchema.shape,
      annotations: readOnlyAnnotations,
    },
    ({ case_id }) => {
      const result = getCaseMetadata(case_id);
      return result === undefined ? unknownCaseResult(case_id) : successResult(result);
    },
  );

  server.registerTool(
    'get_security_alert',
    {
      title: 'Get synthetic security alert',
      description:
        'Returns the source observation emitted by the owned synthetic security sensor without interpreting cause or severity.',
      inputSchema: caseInputSchema,
      outputSchema: securityAlertResultSchema.shape,
      annotations: readOnlyAnnotations,
    },
    ({ case_id }) => {
      const result = getSecurityAlert(case_id);
      return result === undefined ? unknownCaseResult(case_id) : successResult(result);
    },
  );

  server.registerTool(
    'get_deployment',
    {
      title: 'Get synthetic deployment observation',
      description:
        'Returns the owned synthetic deployment record, including source-native revision fields, without causal interpretation.',
      inputSchema: caseInputSchema,
      outputSchema: deploymentResultSchema.shape,
      annotations: readOnlyAnnotations,
    },
    ({ case_id }) => {
      const result = getDeployment(case_id);
      return result === undefined ? unknownCaseResult(case_id) : successResult(result);
    },
  );

  server.registerTool(
    'get_reachability_observations',
    {
      title: 'Get synthetic reachability observations',
      description:
        'Returns owned synthetic reachability probe observations without inferring a policy rule or root cause.',
      inputSchema: caseInputSchema,
      outputSchema: reachabilityResultSchema.shape,
      annotations: readOnlyAnnotations,
    },
    ({ case_id }) => {
      const result = getReachabilityObservations(case_id);
      return result === undefined ? unknownCaseResult(case_id) : successResult(result);
    },
  );

  server.registerTool(
    'get_service_dependencies',
    {
      title: 'Get synthetic service dependencies',
      description:
        'Returns declared dependencies from the owned synthetic service catalog without recommending remediation.',
      inputSchema: caseInputSchema,
      outputSchema: serviceDependenciesResultSchema.shape,
      annotations: readOnlyAnnotations,
    },
    ({ case_id }) => {
      const result = getServiceDependencies(case_id);
      return result === undefined ? unknownCaseResult(case_id) : successResult(result);
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
