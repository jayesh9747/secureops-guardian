import { once } from 'node:events';
import { request, type Server } from 'node:http';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createFixtureMcpApp } from './app.js';
import { DEMO_CASE_ID } from './fixtures.js';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createFixtureMcpApp('127.0.0.1').listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Fixture MCP test server did not bind a TCP port.');
  }
  baseUrl = `http://127.0.0.1:${String(address.port)}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

async function callMcp(options: {
  method: string;
  params?: Record<string, unknown>;
}): Promise<string> {
  const response = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: options.method,
      params: options.params,
    }),
  });

  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('text/event-stream');
  return response.text();
}

async function callTool(options: {
  name: string;
  arguments: Record<string, unknown>;
}): Promise<string> {
  return callMcp({
    method: 'tools/call',
    params: { name: options.name, arguments: options.arguments },
  });
}

async function getWithHostHeader(options: {
  path: string;
  host: string;
}): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    const outgoing = request(
      `${baseUrl}${options.path}`,
      { headers: { host: options.host } },
      (response) => {
        response.resume();
        resolve(response.statusCode);
      },
    );
    outgoing.on('error', reject);
    outgoing.end();
  });
}

describe('Fixture MCP HTTP app', () => {
  it('reports an explicitly synthetic health response', async () => {
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok', synthetic: true });
  });

  it('rejects an untrusted Host header', async () => {
    const status = await getWithHostHeader({ path: '/health', host: 'untrusted.example' });

    expect(status).toBe(403);
  });

  it('rejects stateful GET and DELETE MCP methods', async () => {
    const [getResponse, deleteResponse] = await Promise.all([
      fetch(`${baseUrl}/mcp`),
      fetch(`${baseUrl}/mcp`, { method: 'DELETE' }),
    ]);

    expect(getResponse.status).toBe(405);
    expect(deleteResponse.status).toBe(405);
  });

  it('lists only metadata and the four Phase 1 tools as read-only', async () => {
    const response = await callMcp({ method: 'tools/list' });

    const expectedTools = [
      'get_case_metadata',
      'get_security_alert',
      'get_deployment',
      'get_reachability_observations',
      'get_service_dependencies',
    ];
    for (const tool of expectedTools) expect(response).toContain(`"name":"${tool}"`);
    expect(response.match(/"name":"get_/gu)).toHaveLength(expectedTools.length);
    expect(response.match(/"readOnlyHint":true/gu)).toHaveLength(expectedTools.length);
    expect(response.match(/"destructiveHint":false/gu)).toHaveLength(expectedTools.length);
  });

  it('returns structured content from every Phase 1 evidence tool', async () => {
    const tools = [
      'get_security_alert',
      'get_deployment',
      'get_reachability_observations',
      'get_service_dependencies',
    ];

    for (const name of tools) {
      const response = await callTool({ name, arguments: { case_id: DEMO_CASE_ID } });
      expect(response).toContain(`"case_id":"${DEMO_CASE_ID}"`);
      expect(response).toContain('"synthetic":true');
      expect(response).toContain('"structuredContent"');
    }
  });

  it('is deterministic across repeated read calls', async () => {
    const requestOptions = {
      name: 'get_deployment',
      arguments: { case_id: DEMO_CASE_ID },
    };

    expect(await callTool(requestOptions)).toBe(await callTool(requestOptions));
  });

  it('fails closed for unknown and malformed case IDs', async () => {
    const unknownResponse = await callTool({
      name: 'get_security_alert',
      arguments: { case_id: 'unknown-case' },
    });
    const malformedResponse = await callTool({
      name: 'get_security_alert',
      arguments: { case_id: '' },
    });

    expect(unknownResponse).toContain('Unknown synthetic case: unknown-case');
    expect(unknownResponse).toContain('"isError":true');
    expect(malformedResponse).toContain('Invalid arguments for tool get_security_alert');
    expect(malformedResponse).toContain('"isError":true');
  });
});
