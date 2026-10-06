export function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="inline-block border-b-2 border-[#6C1EE7] pb-1 text-xl font-semibold tracking-[-0.025em] lg:text-2xl">
      {children}
    </h2>
  );
}
