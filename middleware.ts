const { createNodeMiddleware, createProbot } = require("probot");
const app = require("safe-settings"); // Path to your main Probot logic

export const config = {
  runtime: 'bun', // optional: use 'nodejs' or omit for 'edge' (default)
};

export default function middleware(request: Request) {
  console.log('Request to:', request.url);
  return createNodeMiddleware(app, {
    probot: createProbot(),
  })(request);
}