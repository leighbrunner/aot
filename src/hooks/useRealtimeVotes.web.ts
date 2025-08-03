import { useState, useEffect, useCallback } from 'react';

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
    // For web, we'll mock the connection
    setIsConnected(true);
    console.log('Web realtime votes hook initialized');

    return () => {
      setIsConnected(false);
    };
  }, []);

  const subscribe = useCallback(() => {
    console.log('Subscribing to realtime votes (mock)');
  }, []);

  const unsubscribe = useCallback(() => {
    console.log('Unsubscribing from realtime votes (mock)');
  }, []);

  return {
    voteUpdates,
    isConnected,
    subscribe,
    unsubscribe,
  };
};