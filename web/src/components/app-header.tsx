export function AppHeader({ title }: { title: string }) {
  return (
    <header className="pb-4">
      <h1 className="font-heading text-2xl font-bold text-white">
        {title}
      </h1>
    </header>
  );
}
