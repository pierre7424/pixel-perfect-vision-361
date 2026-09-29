import { useCallback, useEffect, useRef, useState } from "react";

export type MicState = "idle" | "granted" | "denied" | "unavailable";

export type Recording = { base64: string; mimeType: string; durationMs: number };

function pickMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

async function blobToBase64(blob: Blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    binary += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function useRecorder() {
  const [micState, setMicState] = useState<MicState>("idle");
  const [recording, setRecording] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const requestMic = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicState("unavailable");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      setMicState("granted");
      return true;
    } catch (err) {
      const name = (err as DOMException)?.name;
      setMicState(name === "NotFoundError" || name === "OverconstrainedError" ? "unavailable" : "denied");
      return false;
    }
  }, []);

  const start = useCallback(async () => {
    if (!streamRef.current) {
      const ok = await requestMic();
      if (!ok) return false;
    }
    const stream = streamRef.current;
    if (!stream) return false;

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start();
    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setRecording(true);
    return true;
  }, [requestMic]);

  const stop = useCallback(async (): Promise<Recording | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setRecording(false);
      return null;
    }
    const durationMs = Date.now() - startedAtRef.current;

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        resolve(new Blob(chunksRef.current, { type: type.startsWith("audio/") ? type : "audio/webm" }));
      };
      recorder.stop();
    });

    recorderRef.current = null;
    setRecording(false);
    if (durationMs < 350 || blob.size < 1500) return null;

    const rawType = blob.type.split(";")[0] || "audio/webm";
    return {
      base64: await blobToBase64(blob),
      mimeType: rawType.startsWith("audio/") ? rawType : "audio/webm",
      durationMs,
    };
  }, []);

  return { micState, setMicState, recording, requestMic, start, stop };
}
