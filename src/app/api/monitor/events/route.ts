import { addClient, removeClient } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function GET() {
    const clientId = Math.random().toString(36).substring(7);

    const stream = new ReadableStream({
        start(controller) {
            addClient(clientId, controller);

            // Send initial connection message
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ connected: true, clientId })}\n\n`));
        },
        cancel() {
            removeClient(clientId);
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
