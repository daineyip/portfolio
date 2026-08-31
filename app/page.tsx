import Home from '@/components/boring/Home';

/**
 * The desktop shell is rendered by app/layout.tsx and covers every route, so a
 * page's job here is only the narrow-screen half: Boring Mode, hidden at `md` and
 * up where the OS takes over.
 */
export default function Page() {
  return (
    <div className="wallpaper min-h-screen md:hidden">
      <Home />
    </div>
  );
}
