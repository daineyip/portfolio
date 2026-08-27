'use client';

import { useEffect } from 'react';
import { findNode } from '@/data/tree';
import { useSearch } from '@/store/useSearch';
import { useWindowStore } from '@/store/useWindowStore';
import { useOpenNode } from './useOpenNode';

/**
 * Keyboard control of the windows.
 *
 * The native shortcuts can't be used: ⌘W closes the browser tab and ⌘M minimizes
 * the browser, and a page can intercept neither. So window management sits on
 * **⌃⌥**, the one modifier pair no browser claims — and the pair Rectangle and
 * Magnet bind by default, so the arrows already mean "tile there" to anyone who
 * tiles windows. Directions follow Windows: ↑ expands, ↓ minimizes, ←/→ take a half.
 *
 * The list of them is a document in the OS (`system-shortcuts`), not a bespoke
 * overlay: it lives in the ◆ menu, opens in a window like everything else, and its
 * text is picked up by search along with every other document. `?` opens it — so
 * this component holds the behaviour and the document holds the explanation, and
 * neither has to restate the other.
 */
const HELP_DOC = 'system-shortcuts';

/** Typing in a field is typing, not commanding. */
function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  );
}

export default function Shortcuts() {
  const openNode = useOpenNode();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      /* The palette owns the keyboard while it is up. */
      if (useSearch.getState().isOpen) return;

      if (e.key === '?') {
        e.preventDefault();
        const doc = findNode(HELP_DOC);
        if (doc) openNode(doc);
        return;
      }

      if (!e.ctrlKey || !e.altKey || e.metaKey) return;

      /*
       * `e.code`, not `e.key`. Holding Option on macOS rewrites the character the
       * key produces — ⌥W arrives as `∑` and ⌥D as `∂` — so matching on `key` works
       * for the arrows, whose names never change, and silently fails for every
       * letter. `code` is the physical key and is untouched by modifiers.
       */
      const code = e.code;
      const store = useWindowStore.getState();

      /* Front to back, so `.at(-1)` is the window on top. */
      const stack = store.windows
        .filter((w) => w.isOpen && !w.isMinimized)
        .sort((a, b) => a.zIndex - b.zIndex);
      const front = stack.at(-1);

      if (code === 'KeyD') {
        e.preventDefault();
        return store.minimizeAll();
      }

      if (code === 'Tab') {
        e.preventDefault();
        /* Raise the one directly beneath the front window, which drops the front
           one back a place — the same move focusWindow already makes. */
        const next = stack.at(-2) ?? front;
        if (next) store.focusWindow(next.id);
        return;
      }

      if (!front) return;

      switch (code) {
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault();
          store.snapWindow(front.id, code === 'ArrowLeft' ? 'left' : 'right');
          break;
        case 'ArrowUp':
          e.preventDefault();
          store.toggleMaximize(front.id);
          break;
        case 'ArrowDown':
          e.preventDefault();
          store.minimizeWindow(front.id);
          break;
        case 'KeyW':
          e.preventDefault();
          store.closeWindow(front.id);
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openNode]);

  /* Behaviour only — what it does is written down in the document. */
  return null;
}
