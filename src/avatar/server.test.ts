import path from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FaceTimeAvatarServer } from "./server.js";

const assetsPath = fileURLToPath(new URL("../../dist/avatar/", import.meta.url));
const servers: FaceTimeAvatarServer[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.stop()));
});

function create(maxBufferedBytes = 1_048_576): FaceTimeAvatarServer {
  const server = new FaceTimeAvatarServer({
    assetsPath: path.resolve(assetsPath),
    token: "test-token",
    port: 0,
    maxBufferedBytes,
  });
  servers.push(server);
  return server;
}

function connect(url: string): Promise<{ client: WebSocket; firstMessage: Promise<{ data: Buffer; binary: boolean }> }> {
  return new Promise((resolve, reject) => {
    const client = new WebSocket(url);
    const firstMessage = nextMessage(client);
    client.once("open", () => resolve({ client, firstMessage }));
    client.once("error", reject);
  });
}

function nextMessage(client: WebSocket): Promise<{ data: Buffer; binary: boolean }> {
  return new Promise((resolve) => {
    client.once("message", (data, binary) => resolve({ data: Buffer.from(data as ArrayBuffer), binary }));
  });
}

describe("FaceTime avatar server", () => {
  it("serves loopback health and authenticates the renderer WebSocket", async () => {
    const server = create();
    await server.start();
    const renderer = new URL(server.rendererUrl);
    expect(renderer.hostname).toBe("127.0.0.1");
    const health = await fetch(`http://127.0.0.1:${renderer.port}/health`).then((response) => response.json());
    expect(health).toMatchObject({ running: true, connectedClients: 0, sentBytes: 0 });
    await expect(connect(`ws://127.0.0.1:${renderer.port}/stream?token=wrong`)).rejects.toThrow();

    const { client, firstMessage } = await connect(
      `ws://127.0.0.1:${renderer.port}/stream?token=test-token`,
    );
    const hello = JSON.parse((await firstMessage).data.toString("utf8"));
    expect(hello).toMatchObject({ type: "hello", sampleRateHz: 24_000 });
    client.send(JSON.stringify({ type: "renderer-status", ready: true }));
    await vi.waitFor(() => expect(server.snapshot().readyClients).toBe(1));

    const audioMessage = nextMessage(client);
    expect(server.sendAudio(Buffer.from([1, 2, 3, 4]))).toBe(true);
    expect(await audioMessage).toEqual({ data: Buffer.from([1, 2, 3, 4]), binary: true });
    const clearMessage = nextMessage(client);
    server.broadcast({ type: "clear", callId: "call-1" });
    expect(JSON.parse((await clearMessage).data.toString("utf8"))).toEqual({
      type: "clear",
      callId: "call-1",
    });
    client.close();
  });

  it("drops PCM before WebSocket buffers exceed the configured bound", async () => {
    const server = create(1);
    await server.start();
    const renderer = new URL(server.rendererUrl);
    const { client, firstMessage } = await connect(
      `ws://127.0.0.1:${renderer.port}/stream?token=test-token`,
    );
    await firstMessage;
    expect(server.sendAudio(Buffer.from([1, 2]))).toBe(false);
    expect(server.snapshot()).toMatchObject({ sentBytes: 0, droppedBytes: 2 });
    client.close();
  });

  it("counts PCM as dropped when no renderer is connected", async () => {
    const server = create();
    await server.start();
    expect(server.sendAudio(Buffer.from([1, 2, 3]))).toBe(false);
    expect(server.snapshot().droppedBytes).toBe(3);
  });

  it("fails clearly when its loopback port is occupied", async () => {
    const occupied = createServer();
    await new Promise<void>((resolve) => occupied.listen(0, "127.0.0.1", resolve));
    const address = occupied.address();
    if (!address || typeof address === "string") throw new Error("test port did not bind");
    const server = new FaceTimeAvatarServer({
      assetsPath: path.resolve(assetsPath),
      token: "test-token",
      port: address.port,
      maxBufferedBytes: 1_048_576,
    });
    servers.push(server);
    await expect(server.start()).rejects.toThrow(/EADDRINUSE/);
    await new Promise<void>((resolve) => occupied.close(() => resolve()));
  });
});
