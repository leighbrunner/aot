import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export interface RealtimeVoteUpdate {
  imageId: string;
  voteCount: number;
  winCount: number;
  rating: number;
  timestamp: string;
}

export const useRealtimeVotes = (imageIds?: string[]) => {
  const [voteUpdates, setVoteUpdates] = useState<Map<string, RealtimeVoteUpdate>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!imageIds || imageIds.length === 0) return;

    const subscriptions = imageIds.map(imageId => {
      return client.models.Image.observeQuery({
        filter: { imageId: { eq: imageId } }
      }).subscribe({
        next: ({ items }) => {
          const image = items[0];
          if (image) {
            setVoteUpdates(prev => {
              const newMap = new Map(prev);
              newMap.set(imageId, {
                imageId: image.imageId,
                voteCount: image.voteCount || 0,
                winCount: image.winCount || 0,
                rating: image.rating || 0,
                timestamp: new Date().toISOString(),
              });
              return newMap;
            });
          }
        },
        error: (error) => {
          console.error('Realtime subscription error:', error);
          setIsConnected(false);
        },
      });
    });

    setIsConnected(true);

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
      setIsConnected(false);
    };
  }, [imageIds]);

  const getVoteUpdate = useCallback((imageId: string): RealtimeVoteUpdate | undefined => {
    return voteUpdates.get(imageId);
  }, [voteUpdates]);

  const getTotalVotes = useCallback((): number => {
    let total = 0;
    voteUpdates.forEach(update => {
      total += update.voteCount;
    });
    return total;
  }, [voteUpdates]);

  return {
    voteUpdates,
    isConnected,
    getVoteUpdate,
    getTotalVotes,
  };
};