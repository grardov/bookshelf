export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <div className="mb-10 text-center">
        <span className="font-heading text-4xl font-bold italic text-white">
          Bookshelf.
        </span>
        <p className="mt-2 text-sm text-[#525252]">
          Your Discogs collection, remixed into playlists
        </p>
      </div>

      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
