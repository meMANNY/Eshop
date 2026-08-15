"use client";

import { createContext, useContext, useEffect, useState } from "react";

const WebSocketContext = createContext<any>(null);

export const WebSocketProvider = ({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) => {
  /*
    The socket lives in state, not a ref: consumers need to re-render when it
    becomes available, and a ref mutation alone never triggers that.
  */
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user?.id) return;

    const uri = process.env.NEXT_PUBLIC_CHATTING_WEBSOCKET_URI;
    if (!uri) {
      // Without this the constructor resolves `undefined` against the page URL
      // and silently dials ws://localhost:3000/undefined.
      console.warn("NEXT_PUBLIC_CHATTING_WEBSOCKET_URI is not set — chat disabled.");
      return;
    }

    const ws = new WebSocket(uri);

    ws.onopen = () => {
      ws.send(`user_${user.id}`);
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "UNSEEN_COUNT_UPDATE") {
          const { conversationId, count } = data.payload;
          setUnreadCounts((prev) => ({ ...prev, [conversationId]: count }));
        }
      } catch {
        // The server also sends plain-text frames; those are not ours to read.
      }
    };

    ws.onclose = () => setSocket(null);

    return () => {
      /*
        Calling close() on a socket that is still CONNECTING is what logs
        "WebSocket is closed before the connection is established" — and in dev
        StrictMode mounts, unmounts and remounts every effect, so the very first
        socket is always torn down mid-handshake. Wait for the handshake to
        finish, then close it.
      */
      ws.onclose = null;
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      } else if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener("open", () => ws.close(), { once: true });
      }
      setSocket(null);
    };
  }, [user?.id]);

  /*
    This provider wraps the entire logged-in app, so it must never gate its own
    children on the socket. It previously returned null until the handshake
    completed, which blanked the whole storefront during connection — and left
    it permanently blank whenever the chatting service was down.
  */
  return (
    <WebSocketContext.Provider value={{ ws: socket, unreadCounts }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    return { ws: null, unreadCounts: {} };
  }
  return context;
};
