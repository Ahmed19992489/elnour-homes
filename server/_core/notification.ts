export type NotificationPayload = {
  title: string;
  content: string;
};

export async function sendNotification(
  payload: NotificationPayload
): Promise<boolean> {
  console.log(`[Notification] ${payload.title}: ${payload.content}`);
  return true;
}
