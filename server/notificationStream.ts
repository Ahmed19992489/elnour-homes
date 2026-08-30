import type { Request, Response } from "express";

const streamsByUser = new Map<number, Set<Response>>();

/** Opens a same-origin, authenticated SSE stream for one customer's account. */
export function openAccountNotificationStream(req: Request, res: Response, userId: number) {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  res.write("retry: 3000\n\n");

  const userStreams = streamsByUser.get(userId) || new Set<Response>();
  userStreams.add(res);
  streamsByUser.set(userId, userStreams);

  req.on("close", () => {
    userStreams.delete(res);
    if (!userStreams.size) streamsByUser.delete(userId);
  });
}

/** Signals connected customer-account tabs to refetch their authoritative notification list. */
export function publishAccountNotification(userId: number) {
  const streams = streamsByUser.get(userId);
  if (!streams?.size) return;
  for (const stream of Array.from(streams)) {
    stream.write("event: order_notification\ndata: {}\n\n");
  }
}
