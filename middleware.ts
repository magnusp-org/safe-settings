export const config = {
  runtime: 'nodejs', // optional: use 'nodejs' or omit for 'edge' (default)
};
 
export default function middleware(request: Request) {
  console.log('Request to:', request.url);
  return new Response('Logging request URL from Middleware');
}