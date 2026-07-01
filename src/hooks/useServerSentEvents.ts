"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface EventSourceOptions {
  onMessage?: (data: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useServerSentEvents(url: string, options: EventSourceOptions = {}) {
  const { data: session } = useSession();
  const [readyState, setReadyState] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttempts = useRef(0);
  const {
    onMessage,
    onError,
    onOpen,
    reconnectInterval = 5000,
    maxReconnectAttempts = 9999
  } = options;

  const poll = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const eventUrl = `${url}?userId=${session.user.id}&_t=${Date.now()}`;
      const response = await fetch(eventUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Poll failed: ${response.status}`);
      
      const data = await response.json();
      setReadyState(1);
      reconnectAttempts.current = 0;
      if (onOpen) onOpen();
      if (onMessage) onMessage(data);
    } catch (err) {
      setReadyState(2);
      if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
      }
    }
  }, [session?.user?.id, url, onMessage, onError, onOpen, maxReconnectAttempts]);

  useEffect(() => {
    if (!session?.user?.id) return;

    poll();
    intervalRef.current = setInterval(poll, reconnectInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [session?.user?.id, poll, reconnectInterval]);

  return {
    readyState,
    lastEventId: null,
    eventSource: null
  };
}
