"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toggleSaved } from "@/app/actions/engagement";
import { getJson } from "@/lib/realtime";
import type { SavedState } from "@/app/api/me/saved/route";

const KEY = ["saved"] as const;

/**
 * Saved-homes state shared by every heart on the page. Toggles are optimistic: the heart fills
 * immediately and rolls back with a toast if the server refuses.
 */
export function useSaved() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: KEY, queryFn: () => getJson<SavedState>("/api/me/saved"), staleTime: 60_000 });

  const mutation = useMutation({
    mutationFn: async ({ listingId, collectionId }: { listingId: string; collectionId?: string }) => {
      const res = await toggleSaved(listingId, collectionId);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onMutate: async ({ listingId, collectionId }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<SavedState>(KEY);
      if (previous && !collectionId) {
        const saved = previous.listingIds.includes(listingId);
        qc.setQueryData<SavedState>(KEY, {
          ...previous,
          listingIds: saved ? previous.listingIds.filter((id) => id !== listingId) : [...previous.listingIds, listingId],
        });
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
      toast.error(err.message);
    },
    onSuccess: ({ saved }) => toast.success(saved ? "Saved to your shortlist" : "Removed from saved homes"),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return {
    state: query.data,
    isSaved: (listingId: string) => query.data?.listingIds.includes(listingId) ?? false,
    toggle: (listingId: string, collectionId?: string) => mutation.mutate({ listingId, collectionId }),
  };
}
