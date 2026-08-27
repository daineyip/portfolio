'use client';

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import {
  ArrowUpRight,
  Move,
  MoveDiagonal,
  MoveDiagonal2,
  MoveHorizontal,
  MoveVertical,
  Plus,
} from 'lucide-react';
import { useEffect, useRef, useState, type ElementType } from 'react';

/**
 * The pointer, replaced by a circle that reads what it is over: it takes a small
 * mark on things that open, a caret on things you type into, a hollow ring on
 * anything else you can press, and the resize arrows on a window edge. Every shape is black ringed in paper, so it reads on
 * the pale desktop and on black chrome alike.
 *
 * What it becomes is decided by the element under the pointer, in two passes.
 * `data-cursor` wins where a component knows something the DOM can't say — a
 * desktop icon knows whether its node is a folder or an outbound link, a title bar
 * knows it is a drag handle. Everything else falls back to what the element *is*
 * (input, anchor, button), so an ordinary button gets sensible feedback without
 * anyone having to annotate it.
 */
type Kind = 'default' | 'press' | 'text' | 'open' | 'link' | 'drag' | 'ew' | 'ns' | 'nwse' | 'nesw';

interface Shape {
  w: number;
  h: number;
  fill: string;
  ink: string;
  border: number;
  /* A small mark inside the circle. It says what the click does without the
     cursor having to grow into something that covers what you are aiming at. */
  Glyph?: ElementType;
  /* The hard drop shadow the rest of the OS wears. Off where the shape is
     transparent, since the shadow would show straight through it. */
  lift?: boolean;
}

/*
 * Fixed sizes, deliberately: the shape animates its own width and height as
 * numbers, so no layout measuring and no transform scaling is involved and the
 * `rounded-full` ends stay perfectly round at every size in between.
 *
 * Nothing here grows much past the pointer. A cursor that swells into a label is
 * a cursor that hides the thing you are pointing at, and with the native pointer
 * gone there is no arrow tip left to aim with — so the circle stays small, the
 * centre stays the hotspot, and the *glyph* carries the meaning. Where a target is
 * too small to aim at, the target grows (see the traffic lights in AppWindow),
 * which is a fix the cursor cannot make from out here.
 */
const SHAPE: Record<Kind, Shape> = {
  default: { w: 20, h: 20, fill: 'transparent', ink: '#000', border: 3 },
  press: { w: 30, h: 30, fill: 'transparent', ink: '#000', border: 3 },
  /* A caret: the circle narrows to a bar rather than sitting over the text. */
  text: { w: 4, h: 26, fill: '#000', ink: '#000', border: 0 },
  open: { w: 30, h: 30, fill: '#ffd23f', ink: '#000', border: 3, Glyph: Plus, lift: true },
  link: { w: 30, h: 30, fill: '#d94f2b', ink: '#fffdf7', border: 3, Glyph: ArrowUpRight, lift: true },
  drag: { w: 30, h: 30, fill: '#000', ink: '#fffdf7', border: 3, Glyph: Move, lift: true },

  /*
   * Resize handles. The native `cursor: ew-resize` and friends are exactly what a
   * window edge needs and exactly what this component has taken away — the page
   * hides the system cursor — so the arrows have to be drawn back by hand, one kind
   * per axis the edge actually moves along.
   */
  ew: { w: 30, h: 30, fill: '#fffdf7', ink: '#000', border: 3, Glyph: MoveHorizontal, lift: true },
  ns: { w: 30, h: 30, fill: '#fffdf7', ink: '#000', border: 3, Glyph: MoveVertical, lift: true },
  /* Lucide's names are not the axes: MoveDiagonal draws (19,5)->(5,19), the NE-SW
     axis, and MoveDiagonal2 draws (5,5)->(19,19), the NW-SE one. Read the paths,
     not the names — the arrow must lie along the direction the corner travels. */
  nwse: { w: 30, h: 30, fill: '#fffdf7', ink: '#000', border: 3, Glyph: MoveDiagonal2, lift: true },
  nesw: { w: 30, h: 30, fill: '#fffdf7', ink: '#000', border: 3, Glyph: MoveDiagonal, lift: true },
};

/*
 * A paper ring just outside the black one, so the cursor never disappears into a
 * black title bar or the taskbar. It costs nothing on the pale desktop, where the
 * black border is doing the work and the halo is the same colour as the paper it
 * sits on; over black the border vanishes instead and the halo carries the shape.
 *
 * Both ends of the animation carry the same number of shadows so Framer can
 * interpolate between them; dropping to 'none' would snap.
 */
const HALO = '0px 0px 0px 2px #fffdf7';
const LIFTED = `${HALO}, 3px 3px 0px 0px rgba(0,0,0,1)`;
const FLAT = `${HALO}, 0px 0px 0px 0px rgba(0,0,0,0)`;

const SELECTOR = '[data-cursor],a[href],button,input,textarea,select,[role="button"]';

/* A cross-document iframe — the PDF viewer — reports no pointer events of its own,
   so ours would freeze at its edge while the real cursor moves inside it. Hand the
   pointer back to the browser for as long as it's in there. */
const isIframe = (target: EventTarget | null) =>
  target instanceof Element && target.tagName === 'IFRAME';

function kindFor(target: EventTarget | null): Kind {
  const el = target instanceof Element ? target.closest(SELECTOR) : null;
  /* A disabled control isn't a target, whatever it looks like. */
  if (!el || el.matches(':disabled')) return 'default';

  const named = (el as HTMLElement).dataset?.cursor;
  if (named && named in SHAPE) return named as Kind;

  if (el.matches('input,textarea,select')) return 'text';
  if (el.matches('a[href]')) return 'link';
  return 'press';
}

export default function Cursor() {
  /* Off until proven otherwise: a coarse pointer keeps the system cursor, and a
     visitor with no JS must never be left with no cursor at all. */
  const [active, setActive] = useState(false);
  const [kind, setKind] = useState<Kind>('default');
  const [shown, setShown] = useState(false);
  const [pressed, setPressed] = useState(false);
  const placed = useRef(false);

  const still = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  /* Trails the pointer by a hair, which is what makes it read as an object rather
     than a repainted cursor. Reduced motion binds the raw values instead. */
  const springX = useSpring(x, { stiffness: 900, damping: 46, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 900, damping: 46, mass: 0.5 });

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    setActive(true);
    document.documentElement.classList.add('no-native-cursor');
    return () => document.documentElement.classList.remove('no-native-cursor');
  }, []);

  useEffect(() => {
    if (!active) return;

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      /* First sighting: drop it where the pointer already is, or the spring
         sweeps across the screen from the origin. */
      if (!placed.current) {
        springX.jump(e.clientX);
        springY.jump(e.clientY);
        placed.current = true;
      }
      setShown(!isIframe(e.target));
      setKind(kindFor(e.target));
    };
    /* Also on `over`, so opening a window under a still pointer updates the shape. */
    const over = (e: PointerEvent) => {
      if (isIframe(e.target)) return setShown(false);
      setKind(kindFor(e.target));
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    const leave = () => setShown(false);

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerover', over);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    document.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.removeEventListener('pointerleave', leave);
    };
  }, [active, x, y, springX, springY]);

  if (!active) return null;

  const shape = SHAPE[kind];

  return (
    /* Above the menu bar and taskbar, and never a pointer target itself. */
    <motion.div
      aria-hidden
      style={{ x: still ? x : springX, y: still ? y : springY }}
      className="pointer-events-none fixed left-0 top-0 z-50"
    >
      {/* Centring lives on its own element: Framer owns the transform on the one
          above (position) and the one below (scale), and they would overwrite it. */}
      <div className="w-fit -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={{
            width: shape.w,
            height: shape.h,
            backgroundColor: shape.fill,
            borderWidth: shape.border,
            boxShadow: shape.lift ? LIFTED : FLAT,
            opacity: shown ? 1 : 0,
            scale: pressed ? 0.85 : 1,
          }}
          transition={{ duration: still ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center overflow-hidden rounded-full border-solid border-black"
        >
          <AnimatePresence mode="wait">
            {shape.Glyph && (
              <motion.span
                key={kind}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: still ? 0 : 0.14 }}
                className="flex items-center justify-center"
              >
                <shape.Glyph size={15} strokeWidth={3} color={shape.ink} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

    </motion.div>
  );
}
