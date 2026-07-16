import { timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import { createServer, type Server } from "node:http";
import path from "node:path";
import { WebSocket, WebSocketServer } from "ws";

const CONTENT_TYPES: Record<string, string> = {
  ".bin": "application/octet-stream",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
};

export class FaceTimeAvatarServer {
  readonly assetsPath: string;
  readonly token: string;
  readonly requestedPort: number;
  readonly maxBufferedBytes: number;
  readonly modelUrl?: string;
  #server: Server | null = null;
  #webSockets: WebSocketServer | null = null;
  #port = 0;
  #connectedClients = 0;
  #readyClients = 0;
  #sentBytes = 0;
  #droppedBytes = 0;

  constructor(params: {
    assetsPath: string;
    token: string;
    port: number;
    maxBufferedBytes: number;
    modelUrl?: string;
  }) {
    this.assetsPath = params.assetsPath;
    this.token = params.token;
    this.requestedPort = params.port;
    this.maxBufferedBytes = params.maxBufferedBytes;
    this.modelUrl = params.modelUrl;
  }

  get rendererUrl(): string {
    if (!this.#port) {
      throw new Error("Avatar renderer is not running");
    }
    return `http://127.0.0.1:${this.#port}/?token=${encodeURIComponent(this.token)}`;
  }

  async start(): Promise<void> {
    if (this.#server) {
      return;
    }
    for (const filename of [
      "index.html",
      "avatar.js",
      "headworklet.mjs",
      "model-en-mixed.bin",
      "playback-worklet.js",
    ]) {
      if (!fs.existsSync(path.join(this.assetsPath, filename))) {
        throw new Error(`Avatar asset is missing: ${filename}; run npm run build:avatar`);
      }
    }
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (url.pathname === "/health") {
        response.setHeader("content-type", "application/json; charset=utf-8");
        response.end(JSON.stringify(this.snapshot()));
        return;
      }
      const assets: Record<string, string> = {
        "/": "index.html",
        "/avatar.js": "avatar.js",
        "/headworklet.mjs": "headworklet.mjs",
        "/model-en-mixed.bin": "model-en-mixed.bin",
        "/playback-worklet.js": "playback-worklet.js",
      };
      const filename = assets[url.pathname];
      if (!filename) {
        response.statusCode = 404;
        response.end("not found");
        return;
      }
      response.setHeader(
        "content-security-policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss: https:; img-src 'self' data: blob: https:; media-src 'none'; object-src 'none'; frame-ancestors 'self'",
      );
      response.setHeader("cache-control", "no-store");
      response.setHeader("content-type", CONTENT_TYPES[path.extname(filename)] ?? "application/octet-stream");
      fs.createReadStream(path.join(this.assetsPath, filename)).pipe(response);
    });
    const webSockets = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
    server.on("upgrade", (request, socket, head) => {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (url.pathname !== "/stream" || !this.#validToken(url.searchParams.get("token"))) {
        socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
        socket.destroy();
        return;
      }
      webSockets.handleUpgrade(request, socket, head, (client) => {
        webSockets.emit("connection", client, request);
      });
    });
    webSockets.on("connection", (client) => {
      this.#connectedClients += 1;
      client.send(
        JSON.stringify({
          type: "hello",
          sampleRateHz: 24_000,
          modelUrl: this.modelUrl,
        }),
      );
      let ready = false;
      client.on("message", (data, binary) => {
        if (binary) {
          return;
        }
        try {
          const message = JSON.parse(String(data)) as { type?: string; ready?: boolean };
          if (message.type === "renderer-status" && Boolean(message.ready) !== ready) {
            ready = Boolean(message.ready);
            this.#readyClients += ready ? 1 : -1;
          }
        } catch {
          // Renderer status is advisory; malformed client data is ignored.
        }
      });
      client.on("close", () => {
        this.#connectedClients -= 1;
        if (ready) {
          this.#readyClients -= 1;
        }
      });
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(this.requestedPort, "127.0.0.1", () => {
        server.off("error", reject);
        resolve();
      });
    });
    const address = server.address();
    if (!address || typeof address === "string") {
      server.close();
      throw new Error("Avatar renderer did not bind a TCP port");
    }
    this.#server = server;
    this.#webSockets = webSockets;
    this.#port = address.port;
  }

  sendAudio(audio: Buffer): boolean {
    let delivered = false;
    let clients = 0;
    for (const client of this.#webSockets?.clients ?? []) {
      clients += 1;
      if (
        client.readyState !== WebSocket.OPEN ||
        client.bufferedAmount + audio.byteLength > this.maxBufferedBytes
      ) {
        this.#droppedBytes += audio.byteLength;
        continue;
      }
      client.send(audio, { binary: true });
      this.#sentBytes += audio.byteLength;
      delivered = true;
    }
    if (clients === 0) {
      this.#droppedBytes += audio.byteLength;
    }
    return delivered;
  }

  broadcast(message: Record<string, unknown>): void {
    const encoded = JSON.stringify(message);
    for (const client of this.#webSockets?.clients ?? []) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(encoded);
      }
    }
  }

  snapshot() {
    return {
      running: Boolean(this.#server),
      port: this.#port || null,
      connectedClients: this.#connectedClients,
      readyClients: this.#readyClients,
      sentBytes: this.#sentBytes,
      droppedBytes: this.#droppedBytes,
    };
  }

  async stop(): Promise<void> {
    const server = this.#server;
    const webSockets = this.#webSockets;
    this.#server = null;
    this.#webSockets = null;
    this.#port = 0;
    for (const client of webSockets?.clients ?? []) {
      client.close(1001, "avatar renderer stopped");
    }
    await Promise.all([
      new Promise<void>((resolve) => webSockets?.close(() => resolve()) ?? resolve()),
      new Promise<void>((resolve) => server?.close(() => resolve()) ?? resolve()),
    ]);
  }

  #validToken(value: string | null): boolean {
    if (!value) {
      return false;
    }
    const expected = Buffer.from(this.token);
    const actual = Buffer.from(value);
    return expected.byteLength === actual.byteLength && timingSafeEqual(expected, actual);
  }
}
