export function Section({
  title,
  badge,
  children
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b-8 border-night-2 bg-night">
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-sun1">{title}</span>
          {badge && <span className="font-mono text-[12.5px] text-text-dim">{badge}</span>}
        </div>
        {children}
      </div>
    </div>
  );
}
