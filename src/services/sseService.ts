export function addConnection(_userId: string, _controller: ReadableStreamDefaultController) {}
export function removeConnection(_userId: string) {}
export function sendNotificationToUser(_userId: string, _notification: Record<string, unknown>): boolean { return false; }
export function broadcastNotification(_notification: Record<string, unknown>): number { return 0; }
export function addGeneralClient(_controller: ReadableStreamDefaultController) {}
export function removeGeneralClient(_controller: ReadableStreamDefaultController) {}
export function sendToAllGeneralClients(_data: Record<string, unknown>) {}
