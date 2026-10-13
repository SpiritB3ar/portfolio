/**
 * SiteAtmosphere — the shared cinematic canvas for every public page.
 *
 * Rendered once in MainLayout, fixed behind all content (z-0); page content is
 * `relative z-10`. Pure CSS animation — no client JS. Dark = near-black teal
 * with luminous mint spotlights, a rotating aurora, vignette and film grain;
 * light = a calmer cream variant. The giant drifting wordmark only shows on the
 * home route (`withWordmark`).
 */
const SiteAtmosphere = ({
  withWordmark = false,
  word = "dranzr",
}: {
  withWordmark?: boolean;
  word?: string;
}) => {
  return (
    <div
      aria-hidden
      className="grain pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Base canvas */}
      <div className="absolute inset-0 bg-background transition-colors duration-700" />

      {/* Rotating conic aurora — subtle brand wash */}
      <div className="absolute left-1/2 top-0 h-[120vmax] w-[120vmax] opacity-[0.05] dark:opacity-[0.10]">
        <div
          className="animate-aurora absolute left-1/2 top-1/2 h-full w-full rounded-full blur-[100px]"
          style={{
            backgroundImage:
              "conic-gradient(from 0deg, transparent 0deg, hsl(177 94% 21%) 70deg, hsl(177 70% 50%) 150deg, transparent 220deg, hsl(177 94% 14%) 300deg, transparent 360deg)",
          }}
        />
      </div>

      {/* Mint spotlight — top right */}
      <div className="animate-drift-slow absolute -top-[20%] right-[-12%] h-[60vw] w-[60vw] rounded-full bg-brand-green/12 blur-[120px] dark:bg-brand-green/20" />

      {/* Teal spotlight — bottom left */}
      <div className="animate-float absolute -bottom-[25%] left-[-15%] h-[55vw] w-[55vw] rounded-full bg-brand-medium/10 blur-[120px] dark:bg-brand-medium/18" />

      {/* Giant ghost wordmark — home only */}
      {withWordmark && (
        <div className="animate-drift-slow absolute inset-x-0 top-[14%] flex select-none justify-center">
          <span className="whitespace-nowrap font-poiret text-[26vw] font-bold uppercase leading-none tracking-tighter text-brand-dark/[0.045] dark:text-brand-green/[0.06]">
            {word}
          </span>
        </div>
      )}

      {/* Vignette to pull focus toward the center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(2,11,10,0.04)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(1,7,6,0.82)_100%)]" />
    </div>
  );
};

export default SiteAtmosphere;
