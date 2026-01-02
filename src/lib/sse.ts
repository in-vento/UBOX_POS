type SSEClient = {
    id: string;
    controller: ReadableStreamDefaultController;
};

let clients: SSEClient[] = [];

export function addClient(id: string, controller: ReadableStreamDefaultController) {
    clients.push({ id, controller });
    console.log(`SSE Client connected: ${id}. Total clients: ${clients.length}`);
}

export function removeClient(id: string) {
    clients = clients.filter(client => client.id !== id);
    console.log(`SSE Client disconnected: ${id}. Total clients: ${clients.length}`);
}

export function broadcast(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();

    clients.forEach(client => {
        try {
            client.controller.enqueue(encoder.encode(payload));
        } catch (error) {
            console.error(`Error sending SSE to client ${client.id}:`, error);
            // Client might be disconnected, but we'll let the close handler handle it
        }
    });
}
