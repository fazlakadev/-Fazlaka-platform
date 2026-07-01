export class RealtimeNotifications {
  private static instance: RealtimeNotifications;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners: { [key: string]: ((data: unknown) => void)[] } = {};
  private userId: string | null = null;
  private lastFetch: number = 0;
  private pollInterval: number = 5000;

  private constructor() {}

  public static getInstance(): RealtimeNotifications {
    if (!RealtimeNotifications.instance) {
      RealtimeNotifications.instance = new RealtimeNotifications();
    }
    return RealtimeNotifications.instance;
  }

  public connect(userId: string): void {
    if (this.intervalId) this.disconnect();
    this.userId = userId;
    this.lastFetch = 0;
    this.startPolling();
  }

  private async startPolling(): Promise<void> {
    this.poll();
    this.intervalId = setInterval(() => this.poll(), this.pollInterval);
  }

  private async poll(): Promise<void> {
    if (!this.userId) return;
    try {
      const url = `/api/notifications/stream?userId=${this.userId}&since=${this.lastFetch}&_t=${Date.now()}`;
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return;
      
      const data = await response.json();
      this.lastFetch = Date.now();
      
      if (data.type) {
        this.emit(data.type, data.data || data);
      }
    } catch {
      // Silently retry on next interval
    }
  }

  public disconnect(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public on(eventType: string, callback: (data: unknown) => void): void {
    if (!this.listeners[eventType]) this.listeners[eventType] = [];
    this.listeners[eventType].push(callback);
  }

  public off(eventType: string, callback: (data: unknown) => void): void {
    if (!this.listeners[eventType]) return;
    const index = this.listeners[eventType].indexOf(callback);
    if (index > -1) this.listeners[eventType].splice(index, 1);
  }

  private emit(eventType: string, data: unknown): void {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType].forEach(callback => callback(data));
  }
}

export default RealtimeNotifications;
