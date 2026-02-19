"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ListMusic, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaylistCard } from "@/components/playlist-card";
import { SearchResultRow } from "@/components/search-result-row";
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog";
import { listPlaylists, type Playlist } from "@/lib/api/playlists";
import { searchDiscogs, type DiscogsSearchResult } from "@/lib/api/discogs";
import { useSearchHistory } from "@/hooks/use-search-history";
import { useAuth } from "@/contexts/auth-context";
import { AppHeader } from "@/components/app-header/app-header";

export default function CreatePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { history, addSearch, removeSearch, clearHistory } = useSearchHistory();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DiscogsSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [recentPlaylists, setRecentPlaylists] = useState<Playlist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const isDiscogsConnected = !!profile?.discogs_connected_at;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch recent playlists
  const fetchRecentPlaylists = useCallback(async () => {
    setIsLoadingPlaylists(true);
    try {
      const response = await listPlaylists(1, 5);
      setRecentPlaylists(response.items);
    } catch (err) {
      console.error("Failed to fetch playlists:", err);
    } finally {
      setIsLoadingPlaylists(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentPlaylists();
  }, [fetchRecentPlaylists]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setIsDropdownOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Close dropdown immediately while waiting for new results
    setIsDropdownOpen(false);
    setHasSearched(false);

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchDiscogs(query.trim());
        setSearchResults(response.results);
        setActiveIndex(-1);
        setHasSearched(true);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error("Failed to search Discogs:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleResultClick = (result: DiscogsSearchResult) => {
    addSearch({
      id: result.id,
      title: result.title,
      year: result.year,
      cover_image: result.cover_image,
      format: result.format,
      label: result.label,
    });
    setIsDropdownOpen(false);
    router.push(`/release/${result.id}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev < searchResults.length - 1 ? prev + 1 : 0;
          scrollOptionIntoView(next);
          return next;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev > 0 ? prev - 1 : searchResults.length - 1;
          scrollOptionIntoView(next);
          return next;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < searchResults.length) {
          handleResultClick(searchResults[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsDropdownOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const scrollOptionIntoView = (index: number) => {
    const listbox = listboxRef.current;
    if (!listbox) return;
    const option = listbox.querySelector(`[data-index="${index}"]`);
    if (option) {
      option.scrollIntoView({ block: "nearest" });
    }
  };

  const handleCreateSuccess = (newPlaylist: Playlist) => {
    setRecentPlaylists((prev) => [newPlaylist, ...prev].slice(0, 5));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <main className="flex flex-1 flex-col">
      {/* Search section */}
      <section className="py-6" aria-labelledby="hero-heading">
        <AppHeader title="Find your release" />

        {/* Search bar + dropdown */}
        <div className="relative w-full" ref={searchContainerRef}>
          {isDiscogsConnected ? (
            <>
              <div className="flex items-center gap-3 rounded-full border border-[#2a2a2a] bg-[#0a0a0a] py-2 pl-5 pr-2 transition-colors focus-within:border-[#404040]">
                <Search
                  className="h-5 w-5 shrink-0 text-[#525252]"
                  aria-hidden="true"
                />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => {
                    if (hasSearched && query.trim()) setIsDropdownOpen(true);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search artists, albums, labels..."
                  className="h-auto flex-1 border-0 bg-transparent p-0 text-base text-white placeholder:text-[#525252] shadow-none focus-visible:ring-0 dark:bg-transparent"
                  role="combobox"
                  aria-label="Search Discogs"
                  aria-expanded={isDropdownOpen}
                  aria-controls="search-listbox"
                  aria-activedescendant={
                    activeIndex >= 0
                      ? `search-option-${searchResults[activeIndex]?.id}`
                      : undefined
                  }
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="mr-1 rounded-full p-1.5 text-[#525252] transition-colors hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {isSearching && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#525252]" />
                )}
              </div>

              {/* Search results dropdown */}
              {isDropdownOpen && query.trim() && (
                <div
                  ref={listboxRef}
                  id="search-listbox"
                  role="listbox"
                  aria-label="Search results"
                  className="absolute left-0 right-0 top-full z-50 mt-2 max-h-100 overflow-y-auto rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] shadow-2xl"
                >
                  {isSearching && !hasSearched ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin text-[#525252]" />
                      <span className="ml-2 text-sm text-[#525252]">
                        Searching Discogs...
                      </span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-1">
                      {searchResults.map((result, index) => (
                        <SearchResultRow
                          key={result.id}
                          id={result.id}
                          title={result.title}
                          year={result.year}
                          coverImage={result.cover_image}
                          format={result.format}
                          label={result.label}
                          active={index === activeIndex}
                          dataIndex={index}
                          onClick={() => handleResultClick(result)}
                        />
                      ))}
                    </div>
                  ) : hasSearched ? (
                    <p className="py-6 text-center text-sm text-[#525252]">
                      No results found for &quot;{query}&quot;
                    </p>
                  ) : null}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-[#2a2a2a] bg-[#141414] p-6 text-center">
              <p className="text-sm text-[#525252]">
                Connect your Discogs account to search releases.
              </p>
              <Button size="sm" className="mt-3" asChild>
                <Link href="/settings">Go to Settings</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Recent searches */}
        {isDiscogsConnected && history.length > 0 && (
          <div className="mt-8 w-full">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <h2 className="font-heading text-lg font-semibold text-white">
                  Recent searches
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#525252] hover:text-white"
                onClick={clearHistory}
              >
                Clear
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
              {history.slice(0, 10).map((item) => (
                <Link
                  key={`search-${item.id}`}
                  id={`search-${item.id}`}
                  href={`/release/${item.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#141414] transition-colors hover:border-[#404040]"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeSearch(item.id);
                    }}
                    className="absolute right-1 top-1 z-10 hidden rounded-full bg-black/70 p-1 text-[#525252] transition-colors hover:text-white group-hover:block"
                    aria-label={`Remove "${item.title}" from recent searches`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="aspect-square w-full bg-[#1a1a1a]">
                    {item.cover_image ? (
                      <img
                        src={item.cover_image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Search
                          className="h-6 w-6 text-[#333]"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 p-2">
                    <span className="truncate text-xs font-medium text-white">
                      {item.title}
                    </span>
                    <span className="truncate text-[10px] text-[#525252]">
                      {[item.format, item.year].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Recent playlists */}
      <section className="pb-12" aria-labelledby="recent-heading">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            <h2
              id="recent-heading"
              className="font-heading text-lg font-semibold text-white"
            >
              Recent playlists
            </h2>
          </div>
          {recentPlaylists.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[#525252] hover:text-white"
              asChild
            >
              <Link href="/playlists">View all</Link>
            </Button>
          )}
        </div>

        {isLoadingPlaylists ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg border border-[#2a2a2a] bg-[#141414] p-4"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : recentPlaylists.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#141414] py-12">
            <ListMusic
              className="h-10 w-10 text-[#525252]"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm text-[#525252]">No playlists yet</p>
            <Button
              size="sm"
              className="mt-4 gap-2 rounded-full"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create playlist
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                id={playlist.id}
                title={playlist.name}
                trackCount={playlist.track_count}
                duration={`${playlist.track_count} tracks`}
                genre={playlist.tags[0]}
                createdAt={formatDate(playlist.created_at)}
              />
            ))}
          </div>
        )}
      </section>

      <CreatePlaylistDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreateSuccess}
      />
    </main>
  );
}
