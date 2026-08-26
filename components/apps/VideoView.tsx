'use client';

import { Maximize2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { findNode } from '@/data/tree';
import { useWindowStore } from '@/store/useWindowStore';
import { useWindow } from '../WindowContext';

/** m:ss — the only format a demo reel ever needs. */
function clock(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * A video from public/ in the desktop's own chrome rather than the browser's:
 * native <video> for playback, hand-built controls so the window reads as part
 * of the OS. `controls` stays off — the point is that the transport is ours.
 */
export default function VideoView() {
  const id = useWindow();
  const contentId = useWindowStore((s) => s.windows.find((w) => w.id === id)?.contentId);
  const node = contentId ? findNode(contentId) : undefined;

  const ref = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }, []);

  /* Seek from a pointer position anywhere on the track, so click and drag share
     one path. */
  const seekTo = useCallback((clientX: number) => {
    const v = ref.current;
    const track = trackRef.current;
    if (!v || !track || !Number.isFinite(v.duration)) return;
    const { left, width } = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - left) / width));
    v.currentTime = ratio * v.duration;
    setTime(v.currentTime);
  }, []);

  const onTrackDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      seekTo(e.clientX);
    },
    [seekTo],
  );

  const onTrackMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) seekTo(e.clientX);
    },
    [seekTo],
  );

  /* Space is the universal play/pause, but only when the window isn't hosting a
     text field and the visitor isn't tabbed onto one of our own buttons. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      if (el instanceof HTMLButtonElement) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  if (node?.kind !== 'video') return null;

  const progress = duration ? (time / duration) * 100 : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f2ede3]">
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <video
          ref={ref}
          src={node.src}
          onClick={toggle}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => setPlaying(false)}
          playsInline
          className="max-h-full min-h-0 max-w-full cursor-pointer rounded-xl border-[3px] border-black
                     bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        />
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t-[3px] border-black bg-[#fffdf7] px-3 py-2">
        <button
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] border-black
                     bg-[#ffd23f] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform
                     hover:-translate-y-0.5 active:translate-y-0"
        >
          {playing ? (
            <Pause className="h-4 w-4" strokeWidth={2.5} fill="black" />
          ) : (
            /* Nudged right so the triangle reads as centred in the circle. */
            <Play className="ml-0.5 h-4 w-4" strokeWidth={2.5} fill="black" />
          )}
        </button>

        <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums">{clock(time)}</span>

        <div
          ref={trackRef}
          onPointerDown={onTrackDown}
          onPointerMove={onTrackMove}
          className="relative h-3 min-w-0 flex-1 cursor-pointer overflow-hidden rounded-full
                     border-[3px] border-black bg-[#f2ede3]"
        >
          <div className="h-full bg-[#d94f2b]" style={{ width: `${progress}%` }} />
        </div>

        <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums opacity-55">
          {clock(duration)}
        </span>

        <button
          onClick={() => {
            const v = ref.current;
            if (!v) return;
            v.muted = !v.muted;
            setMuted(v.muted);
          }}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-black
                     bg-[#fffdf7] transition-transform hover:-translate-y-0.5"
        >
          {muted ? <VolumeX className="h-4 w-4" strokeWidth={2.5} /> : <Volume2 className="h-4 w-4" strokeWidth={2.5} />}
        </button>

        <button
          onClick={() => void ref.current?.requestFullscreen?.()}
          aria-label="Fullscreen"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-black
                     bg-[#fffdf7] transition-transform hover:-translate-y-0.5"
        >
          <Maximize2 className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
