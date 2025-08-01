import { useState, useEffect, useCallback } from 'react';
import { votingService } from '@/services/api/votingService';
import { PreferenceCalculator, VoteRecord, UserPreferences } from '@/utils/preferences';
import { useVotingStore } from '@/store/voting.store';

export interface VotingHistoryState {
  votes: VoteRecord[];
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  streak: {
    current: number;
    longest: number;
    lastVoteDate: string | null;
  };
}

export const useVotingHistory = () => {
  const [state, setState] = useState<VotingHistoryState>({
    votes: [],
    preferences: {
      categoryBreakdown: [],
    },
    isLoading: true,
    error: null,
    streak: {
      current: 0,
      longest: 0,
      lastVoteDate: null,
    },
  });

  const { setPreferences } = useVotingStore();

  const loadHistory = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const history = await votingService.getVotingHistory(100);
      const votes: VoteRecord[] = history.votes || [];
      
      // Calculate preferences
      const preferences = PreferenceCalculator.calculatePreferences(votes);
      
      // Calculate streaks
      const streak = PreferenceCalculator.calculateStreak(votes);
      
      // Update store
      setPreferences(preferences);
      
      setState({
        votes,
        preferences,
        streak,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load voting history',
      }));
      console.error('Error loading voting history:', error);
    }
  }, [setPreferences]);

  const addVote = useCallback((vote: VoteRecord) => {
    setState(prev => {
      const newVotes = [vote, ...prev.votes];
      const preferences = PreferenceCalculator.calculatePreferences(newVotes);
      const streak = PreferenceCalculator.calculateStreak(newVotes);
      
      // Update store
      setPreferences(preferences);
      
      return {
        ...prev,
        votes: newVotes,
        preferences,
        streak,
      };
    });
  }, [setPreferences]);

  const getVotesByCategory = useCallback((category: string) => {
    return state.votes.filter(vote => 
      vote.category.toLowerCase() === category.toLowerCase()
    );
  }, [state.votes]);

  const getRecentVotes = useCallback((limit: number = 10) => {
    return state.votes.slice(0, limit);
  }, [state.votes]);

  const getVoteStats = useCallback(() => {
    const totalVotes = state.votes.length;
    const categoryCounts = new Map<string, number>();
    
    state.votes.forEach(vote => {
      const category = vote.category.toLowerCase();
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });
    
    const topCategory = state.preferences.primaryPreference;
    const votesToday = state.votes.filter(vote => {
      const voteDate = new Date(vote.timestamp);
      const today = new Date();
      return (
        voteDate.getDate() === today.getDate() &&
        voteDate.getMonth() === today.getMonth() &&
        voteDate.getFullYear() === today.getFullYear()
      );
    }).length;
    
    return {
      totalVotes,
      votesToday,
      topCategory,
      categoryCounts: Object.fromEntries(categoryCounts),
      streak: state.streak,
      preferences: state.preferences,
    };
  }, [state]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    ...state,
    loadHistory,
    addVote,
    getVotesByCategory,
    getRecentVotes,
    getVoteStats,
  };
};