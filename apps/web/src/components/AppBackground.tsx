/**
 * Ambient animated background: a layered radial mesh plus two slow-floating glow
 * blobs (gold + forest). Purely decorative, sits behind all content.
 */
export function AppBackground() {
  return (
    <div className="app-bg" aria-hidden>
      {/* slow-floating gold glow, top-left */}
      <div className="absolute -left-32 -top-32 h-[42rem] w-[42rem] animate-float rounded-full bg-gold-500/10 blur-3xl" />
      {/* slow-floating forest glow, bottom-right */}
      <div className="absolute -bottom-40 -right-32 h-[46rem] w-[46rem] animate-float-slow rounded-full bg-forest-500/20 blur-3xl" />
      {/* subtle grid texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,241,230,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,241,230,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(circle at 50% 30%, black, transparent 80%)",
        }}
      />
    </div>
  );
}
