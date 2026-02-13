"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncCollection, type SyncSummary } from "@/lib/api/collection";

interface SyncButtonProps {
  onSyncComplete?: (summary: SyncSummary) => void;
  onSyncError?: (error: string) => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showLabel?: boolean;
}

export function SyncButton({
  onSyncComplete,
  onSyncError,
  variant = "outline",
  size = "sm",
  showLabel = true,
}: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      const summary = await syncCollection();
      onSyncComplete?.(summary);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to sync collection";
      onSyncError?.(message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isSyncing}
      className="gap-2"
    >
      <RefreshCw
        className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
      {showLabel && (isSyncing ? "Syncing..." : "Sync Collection")}
    </Button>
  );
}
