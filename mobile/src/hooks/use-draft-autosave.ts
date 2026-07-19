import { useEffect, useRef } from 'react';
import { useCreateDraft, useUpdateDraft } from '@/hooks/queries/use-shopping';
import { BILL_DRAFT_VERSION } from '@/types/shopping';

const AUTOSAVE_DEBOUNCE_MS = 1200;

/**
 * Debounced autosave of in-progress bill entry state into a server-side draft.
 * Creates the draft on first meaningful input, then PUTs on subsequent changes.
 */
export function useDraftAutosave(
  entryMethod: string,
  draftData: Record<string, unknown>,
  isMeaningful: boolean,
  draftId: string | null,
  setDraftId: (id: string) => void,
) {
  const createDraft = useCreateDraft();
  const updateDraft = useUpdateDraft();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftIdRef = useRef(draftId);
  draftIdRef.current = draftId;
  // Tracks an in-flight createDraft call so a second debounce cycle that fires before it
  // resolves waits for the same draft row instead of creating a duplicate one.
  const creatingPromiseRef = useRef<Promise<string> | null>(null);

  const serialized = JSON.stringify(draftData);

  useEffect(() => {
    if (!isMeaningful) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const payload = { version: BILL_DRAFT_VERSION, ...draftData };

      if (draftIdRef.current) {
        updateDraft.mutate({ id: draftIdRef.current, data: { draft_data: payload } });
        return;
      }

      if (creatingPromiseRef.current) {
        const id = await creatingPromiseRef.current;
        updateDraft.mutate({ id, data: { draft_data: payload } });
        return;
      }

      const promise = createDraft
        .mutateAsync({ entry_method: entryMethod, draft_data: payload })
        .then((draft) => {
          draftIdRef.current = draft.id;
          setDraftId(draft.id);
          return draft.id;
        });
      creatingPromiseRef.current = promise;
      try {
        await promise;
      } finally {
        creatingPromiseRef.current = null;
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, isMeaningful]);
}
