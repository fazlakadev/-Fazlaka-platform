export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify({ type: 'connected' })}\n\n`;

  return new Response(message, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}