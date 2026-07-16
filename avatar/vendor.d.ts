declare module "@met4citizen/talkinghead" {
  export class TalkingHead {
    constructor(element: HTMLElement, options: Record<string, unknown>);
    audioCtx: AudioContext;
    audioSpeechGainNode: GainNode;
    mtAvatar: Record<string, { newvalue?: number; realtime?: number | null; needsUpdate?: boolean }>;
    opt: Record<string, unknown>;
    showAvatar(options: Record<string, unknown>): Promise<void>;
  }
}

declare module "@met4citizen/headaudio/dist/headaudio.min.mjs" {
  export class HeadAudio extends AudioWorkletNode {
    constructor(context: AudioContext, options?: Record<string, unknown>);
    loadModel(url: string, reset?: boolean): Promise<void>;
    update(deltaMs: number): void;
    resetAll(): void;
    onvalue: ((key: string, value: number) => void) | null;
  }
}
