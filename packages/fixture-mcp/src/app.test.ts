import { once } from 'node:events';
import { request, type Server } from 'node:http';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createFixtureMcpApp } from './app.js';

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

async function callTool(caseId: string): Promise<string> {
  const response = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'get_case_metadata', arguments: { caseId } },
    }),
  });

  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('text/event-stream');
  return response.text();
}

async function getWithHostHeader(path: string, host: string): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    const outgoing = request(`${baseUrl}${path}`, { headers: { host } }, (response) => {
      response.resume();
      resolve(response.statusCode);
    });
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
    const status = await getWithHostHeader('/health', 'untrusted.example');

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

  it('returns the owned synthetic case over Streamable HTTP', async () => {
    const response = await callTool('checkout-networkpolicy-egress-exposure');

    expect(response).toContain('"caseId":"checkout-networkpolicy-egress-exposure"');
    expect(response).toContain('"fixtureVersion":"1"');
    expect(response).toContain('"synthetic":true');
  });

  it('fails closed for an unknown synthetic case', async () => {
    const response = await callTool('unknown-case');

    expect(response).toContain('Unknown synthetic case: unknown-case');
    expect(response).toContain('"isError":true');
  });
});
