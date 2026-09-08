export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[20px] border border-border bg-surface p-4 ${className}`}
    >
      {children}
    </div>
  );
}
