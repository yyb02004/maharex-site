"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import styles from "./music.module.css";

export default function BackgroundMusic() {
  const audioId = useId();
  const audioRef = useRef<HTMLAudioElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const attemptedAutoplayRef = useRef(false);
  const allowAutomaticPlaybackRef = useRef(true);
  const gestureRetryRef = useRef(false);
  const wantsPlaybackRef = useRef(false);
  const requestRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const startPlayback = useCallback(async (automatic = false) => {
    const audio = audioRef.current;
    if (!audio || !mountedRef.current) return;
    if (automatic && !allowAutomaticPlaybackRef.current) return;
    const request = ++requestRef.current;
    gestureRetryRef.current = false;
    wantsPlaybackRef.current = true;
    setPending(true);
    setMessage("");

    try {
      // A deliberate tap can retry a failed download without reloading the page.
      if (audio.error) audio.load();
      await audio.play();
    } catch (error) {
      if (!mountedRef.current || request !== requestRef.current) return;
      wantsPlaybackRef.current = false;
      const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
      if (name === "NotAllowedError") {
        if (automatic && allowAutomaticPlaybackRef.current) gestureRetryRef.current = true;
        else if (!automatic) setMessage("재생 버튼을 다시 눌러 주세요.");
      } else if (name !== "AbortError") {
        setMessage("음악을 불러오지 못했어요. 다시 눌러 주세요.");
      }
    } finally {
      if (mountedRef.current && request === requestRef.current) setPending(false);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let disposed = false;
    mountedRef.current = true;
    audio.volume = 0.35;

    function retryFromGesture(event: Event) {
      if (!gestureRetryRef.current || !allowAutomaticPlaybackRef.current) return;
      if (event.target instanceof Node && controlRef.current?.contains(event.target)) return;
      // Touch activation is granted on release; pointerdown activates only a mouse.
      if (event instanceof PointerEvent && event.type === "pointerdown" && event.pointerType !== "mouse") return;
      if (event instanceof KeyboardEvent && (event.repeat || ["Shift", "Control", "Alt", "Meta", "Escape"].includes(event.key))) return;
      void startPlayback(true);
    }

    document.addEventListener("pointerdown", retryFromGesture, { passive: true });
    document.addEventListener("pointerup", retryFromGesture, { passive: true });
    document.addEventListener("touchend", retryFromGesture, { passive: true });
    document.addEventListener("keydown", retryFromGesture, { passive: true });

    // Deferring prevents React's development effect replay from trying twice.
    queueMicrotask(() => {
      if (disposed || attemptedAutoplayRef.current) return;
      attemptedAutoplayRef.current = true;
      void startPlayback(true);
    });

    return () => {
      disposed = true;
      mountedRef.current = false;
      wantsPlaybackRef.current = false;
      gestureRetryRef.current = false;
      requestRef.current += 1;
      document.removeEventListener("pointerdown", retryFromGesture);
      document.removeEventListener("pointerup", retryFromGesture);
      document.removeEventListener("touchend", retryFromGesture);
      document.removeEventListener("keydown", retryFromGesture);
      audio.pause();
    };
  }, [startPlayback]);

  function syncPlayback() {
    const audio = audioRef.current;
    if (!audio || !mountedRef.current) return;
    if (audio.paused || audio.ended) {
      wantsPlaybackRef.current = false;
      setPlaying(false);
      setPending(false);
      return;
    }
    if (!wantsPlaybackRef.current) {
      audio.pause();
      return;
    }
    setPlaying(true);
    setMessage("");
  }

  function handleToggle() {
    const audio = audioRef.current;
    if (!audio) return;
    gestureRetryRef.current = false;
    if (wantsPlaybackRef.current || !audio.paused) {
      allowAutomaticPlaybackRef.current = false;
      requestRef.current += 1;
      wantsPlaybackRef.current = false;
      setPending(false);
      setMessage("");
      audio.pause();
      return;
    }
    void startPlayback();
  }

  function handleAudioError() {
    if (!mountedRef.current) return;
    requestRef.current += 1;
    wantsPlaybackRef.current = false;
    gestureRetryRef.current = false;
    audioRef.current?.pause();
    setPlaying(false);
    setPending(false);
    setMessage("음악을 불러오지 못했어요. 다시 눌러 주세요.");
  }

  return (
    <div ref={controlRef} className={styles.music}>
      <audio
        ref={audioRef}
        id={audioId}
        src="/love/music/antifreeze.mp3"
        preload="none"
        loop
        onPlay={syncPlayback}
        onPlaying={syncPlayback}
        onPause={syncPlayback}
        onEnded={syncPlayback}
        onError={handleAudioError}
      />
      <button
        className={styles.button}
        type="button"
        title="Antifreeze · 백예린"
        aria-label={playing ? "배경음악 정지" : pending ? "배경음악 재생 취소" : "배경음악 재생"}
        aria-pressed={playing}
        aria-controls={audioId}
        aria-busy={pending}
        onClick={handleToggle}
      >
        {playing ? (
          <span className={styles.equalizer} aria-hidden="true"><i /><i /><i /></span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 17V5l11-2v12M9 9l11-2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx="6" cy="17.5" rx="3" ry="2.5" stroke="currentColor" strokeWidth="1.35" />
            <ellipse cx="17" cy="15.5" rx="3" ry="2.5" stroke="currentColor" strokeWidth="1.35" />
          </svg>
        )}
      </button>
      <span className={styles.message} role="status" aria-live="polite" aria-atomic="true">{message}</span>
    </div>
  );
}
