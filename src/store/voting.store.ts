import { create } from 'zustand';

interface VotingState {
  currentStreak: number;
  totalVotes: number;
  lastVoteDate: string | null;
  preferences: {
    primaryPreference?: 'ass' | 'tits';
    preferenceScore?: number;
  };
  setPreferences: (preferences: VotingState['preferences']) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  incrementTotalVotes: () => void;
}

export const useVotingStore = create<VotingState>((set) => ({
  currentStreak: 0,
  totalVotes: 0,
  lastVoteDate: null,
  preferences: {},
  
  setPreferences: (preferences) => set({ preferences }),
  
  incrementStreak: () => set((state) => ({
    currentStreak: state.currentStreak + 1,
    lastVoteDate: new Date().toISOString(),
  })),
  
  resetStreak: () => set({ currentStreak: 0 }),
  
  incrementTotalVotes: () => set((state) => ({
    totalVotes: state.totalVotes + 1,
  })),
}));