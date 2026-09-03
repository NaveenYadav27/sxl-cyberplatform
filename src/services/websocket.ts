import { WS_HOST } from '../utils/config';

type MessageHandler = (type: string, data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectInterval = 3000;
  private shouldReconnect = true;
  private pendingCalls: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();

  constructor() {
    // If accessing local backend from remote HTTPS page, force unencrypted ws: protocol
    // because browsers treat localhost as a secure context and allow mixed content.
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const wsProto = isLocal ? "ws:" : (window.location.protocol === "https:" ? "wss:" : "ws:");
    this.url = `${wsProto}//${WS_HOST}/ws/events`;
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("[ApplianceWS] Connected to live cyber-range event bus.");
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === "RPC_RESPONSE") {
            const call = this.pendingCalls.get(payload.call_id);
            if (call) {
              this.pendingCalls.delete(payload.call_id);
              if (payload.status_code >= 200 && payload.status_code < 300) {
                call.resolve(payload.body);
              } else {
                call.reject(new Error(payload.body?.detail || `RPC Error ${payload.status_code}`));
              }
            }
            return;
          }
          
          this.handlers.forEach((h) => h(payload.type, payload.data));
        } catch (e) {
          console.warn("[ApplianceWS] Unparseable message:", event.data);
        }
      };

      this.ws.onclose = () => {
        console.log("[ApplianceWS] Disconnected. Retrying in 3s...");
        if (this.shouldReconnect) {
          setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("[ApplianceWS] WebSocket error:", err);
        this.ws?.close();
      };
    } catch (e) {
      console.warn("[ApplianceWS] Connection attempt failed:", e);
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    }
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === "string" ? data : JSON.stringify(data));
    }
  }

  sendRpc(method: string, path: string, body?: any, headers?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const call_id = Math.random().toString(36).substring(2, 15);
      this.pendingCalls.set(call_id, { resolve, reject });
      
      const payload = {
        type: "RPC_REQUEST",
        call_id,
        method,
        path,
        body,
        headers
      };

      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
          this.connect();
        }
        setTimeout(() => {
          if (this.pendingCalls.has(call_id)) {
            this.pendingCalls.delete(call_id);
            reject(new Error("Local backend connection timeout. Make sure start-shadowxlab.bat is running."));
          }
        }, 5000);
        return;
      }
      
      this.ws.send(JSON.stringify(payload));
    });
  }

  disconnect() {
    this.shouldReconnect = false;
    this.ws?.close();
  }
}

export const wsClient = new WebSocketClient();
