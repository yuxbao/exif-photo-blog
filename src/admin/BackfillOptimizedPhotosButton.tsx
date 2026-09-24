'use client';

import { backfillOptimizedPhotosAction } from '@/photo/actions';
import ProgressButton from '@/components/primitives/ProgressButton';
import IconBroom from '@/components/icons/IconBroom';
import { useState } from 'react';
import ErrorNote from '@/components/ErrorNote';

export default function BackfillOptimizedPhotosButton({
  photosCount,
}: {
  photosCount: number
}) {
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [created, setCreated] = useState(0);
  const [failed, setFailed] = useState(0);
  const [error, setError] = useState<Error>();

  const backfill = async () => {
    if (!window.confirm(
      `Check ${photosCount} photos and create any missing optimized files? Keep this page open until it finishes.`,
    )) { return; }

    setIsBackfilling(true);
    setProcessed(0);
    setCreated(0);
    setFailed(0);
    setError(undefined);

    try {
      let offset = 0;
      let hasMore = true;
      while (hasMore) {
        const result = await backfillOptimizedPhotosAction(offset);
        offset += result.processed;
        setProcessed(offset);
        setCreated(total => total + result.created);
        setFailed(total => total + result.failed);
        hasMore = result.hasMore;
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsBackfilling(false);
    }
  };

  return <div className="space-y-2">
    <ProgressButton
      icon={<IconBroom size={18} />}
      hideText="never"
      tooltip="Create missing optimized photo files"
      onClick={backfill}
      isLoading={isBackfilling}
      progress={isBackfilling ? processed / photosCount : undefined}
    >
      {isBackfilling
        ? `Optimizing ${processed}/${photosCount}`
        : 'Backfill optimized photos'}
    </ProgressButton>
    {(created > 0 || failed > 0 || error) && <div className="text-sm text-dim">
      {created > 0 && <div>Created optimized files for {created} photos.</div>}
      {failed > 0 && <div>Could not process {failed} photos.</div>}
      {error && <ErrorNote>{error.message}</ErrorNote>}
    </div>}
  </div>;
}
