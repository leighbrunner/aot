import { create } from 'zustand';

interface Vote {
  id: string;
  winnerId: string;
  loserId: string;
  category: string;
  timestamp: string;
}

interface VotingState {
  currentStreak: number;
  totalVotes: number;
  lastVoteDate: string | null;
  preferences: {
    primaryPreference?: 'ass' | 'tits';
    preferenceScore?: number;
  };
  recentVotes: Vote[];
  addVote: (vote: Vote) => void;
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
  recentVotes: [],
  
  addVote: (vote) => set((state) => ({
    recentVotes: [vote, ...state.recentVotes].slice(0, 100), // Keep last 100 votes
    totalVotes: state.totalVotes + 1,
  })),
  
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