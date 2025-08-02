import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Vote {
  id: string;
  winnerId: string;
  loserId: string;
  category: string;
  timestamp: string;
  pending?: boolean;
  error?: string;
}

interface DailyGoal {
  date: string;
  target: number;
  current: number;
  completed: boolean;
}

interface VotingState {
  currentStreak: number;
  longestStreak: number;
  totalVotes: number;
  lastVoteDate: string | null;
  preferences: {
    primaryPreference?: 'ass' | 'tits';
    preferenceScore?: number;
  };
  recentVotes: Vote[];
  pendingVotes: Vote[];
  dailyGoal: DailyGoal | null;
  queueSize: number;
  
  // Actions
  addVote: (vote: Vote) => void;
  addPendingVote: (vote: Vote) => void;
  resolvePendingVote: (tempId: string, actualId: string) => void;
  removePendingVote: (tempId: string, error?: string) => void;
  setPreferences: (preferences: VotingState['preferences']) => void;
  updateStreak: (current: number, longest: number) => void;
  resetStreak: () => void;
  incrementTotalVotes: () => void;
  setDailyGoal: (goal: DailyGoal) => void;
  updateDailyProgress: () => void;
  setQueueSize: (size: number) => void;
}

export const useVotingStore = create<VotingState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      longestStreak: 0,
      totalVotes: 0,
      lastVoteDate: null,
      preferences: {},
      recentVotes: [],
      pendingVotes: [],
      dailyGoal: null,
      queueSize: 0,
      
      addVote: (vote) => set((state) => ({
        recentVotes: [vote, ...state.recentVotes].slice(0, 100), // Keep last 100 votes
        totalVotes: state.totalVotes + 1,
        lastVoteDate: new Date().toISOString(),
      })),
      
      addPendingVote: (vote) => set((state) => ({
        pendingVotes: [...state.pendingVotes, { ...vote, pending: true }],
        recentVotes: [{ ...vote, pending: true }, ...state.recentVotes].slice(0, 100),
      })),
      
      resolvePendingVote: (tempId, actualId) => set((state) => ({
        pendingVotes: state.pendingVotes.filter(v => v.id !== tempId),
        recentVotes: state.recentVotes.map(v => 
          v.id === tempId ? { ...v, id: actualId, pending: false } : v
        ),
      })),
      
      removePendingVote: (tempId, error) => set((state) => ({
        pendingVotes: state.pendingVotes.filter(v => v.id !== tempId),
        recentVotes: state.recentVotes.map(v => 
          v.id === tempId ? { ...v, pending: false, error } : v
        ),
      })),
      
      setPreferences: (preferences) => set({ preferences }),
      
      updateStreak: (current, longest) => set({
        currentStreak: current,
        longestStreak: longest,
      }),
      
      resetStreak: () => set({ currentStreak: 0 }),
      
      incrementTotalVotes: () => set((state) => ({
        totalVotes: state.totalVotes + 1,
      })),
      
      setDailyGoal: (goal) => set({ dailyGoal: goal }),
      
      updateDailyProgress: () => set((state) => {
        if (!state.dailyGoal) return {};
        
        const today = new Date().toISOString().split('T')[0];
        if (state.dailyGoal.date !== today) {
          // Create new daily goal
          return {
            dailyGoal: {
              date: today,
              target: 10, // Default target
              current: 1,
              completed: false,
            },
          };
        }
        
        const newCurrent = state.dailyGoal.current + 1;
        const completed = newCurrent >= state.dailyGoal.target;
        
        return {
          dailyGoal: {
            ...state.dailyGoal,
            current: newCurrent,
            completed,
          },
        };
      }),
      
      setQueueSize: (size) => set({ queueSize: size }),
    }),
    {
      name: 'voting-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        totalVotes: state.totalVotes,
        lastVoteDate: state.lastVoteDate,
        preferences: state.preferences,
        dailyGoal: state.dailyGoal,
      }),
    }
  )
);