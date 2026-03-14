import { ServerResponse, IncomingMessage } from 'node:http';
import { Readable, Writable } from 'node:stream';
import { createNodeMiddleware, createProbot } from "probot";
const app = require("safe-settings");

/**
 * Converts Web Request to Node IncomingMessage
 */
export async function toIncomingMessage(request: Request): Promise<any> {
  const url = new URL(request.url);
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });

  const bodyStream = request.body ? Readable.fromWeb(request.body as any) : Readable.from([]);

  return Object.assign(bodyStream, {
    url: url.pathname + url.search,
    method: request.method,
    headers,
    httpVersion: '1.1',
    complete: true,
  });
}

/**
 * Main Fluid Compute Function
 */
export default async function handler(request: Request) {
  const probot = createProbot();
  const middleware = await createNodeMiddleware(app, { probot });

  const nodeReq = await toIncomingMessage(request);

  // 1. Create a promise that resolves when the middleware finishes writing
  return new Promise<Response>((resolve) => {
    let statusCode = 200;
    let resHeaders: Record<string, string> = {};
    const chunks: any[] = [];

    // 2. Mock the ServerResponse
    const res = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      }
    }) as any;

    // Add required Node ServerResponse methods
    res.setHeader = (name: string, value: string) => { resHeaders[name.toLowerCase()] = value; return res; };
    res.getHeader = (name: string) => resHeaders[name.toLowerCase()];
    res.writeHead = (code: number, headers?: any) => { 
      statusCode = code; 
      if (headers) Object.assign(resHeaders, headers);
      return res; 
    };

    // 3. When the middleware calls res.end(), we resolve the Web Response
    res.end = (chunk?: any) => {
      if (chunk) chunks.push(chunk);
      resolve(new Response(Buffer.concat(chunks), {
        status: statusCode,
        headers: resHeaders as HeadersInit
      }));
      return res;
    };

    // 4. Trigger the Probot middleware
    middleware(nodeReq, res);
  });
}