import type { Request, Response } from "express";

const clients = new Map<number, Set<Response>>();

export function openAccountNotificationStream(req: Request, res: Response, userId: number) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId)!.add(res);

  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  req.on("close", () => {
    const userClients = clients.get(userId);
    if (userClients) {
      userClients.delete(res);
      if (userClients.size === 0) {
        clients.delete(userId);
      }
    }
  });
}

export function broadcastNotification(userId: number, payload: any) {
  const userClients = clients.get(userId);
  if (userClients) {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    userClients.forEach((res) => res.write(data));
  }
}
