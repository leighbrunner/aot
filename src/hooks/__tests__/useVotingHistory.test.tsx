import { renderHook, act } from '@testing-library/react-hooks'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useVotingHistory } from '../useVotingHistory'

jest.mock('@react-native-async-storage/async-storage')

describe('useVotingHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)
  })

  it('should initialize with empty history', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useVotingHistory())

    await waitForNextUpdate()

    expect(result.current.votes).toEqual([])
    expect(result.current.totalVotes).toBe(0)
  })

  it('should load existing history from storage', async () => {
    const existingHistory = {
      votes: [
        {
          winnerId: '1',
          loserId: '2',
          category: 'test',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ],
      totalVotes: 1,
      lastUpdated: '2024-01-01T00:00:00Z',
    }

    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(existingHistory)
    )

    const { result, waitForNextUpdate } = renderHook(() => useVotingHistory())

    await waitForNextUpdate()

    expect(result.current.votes).toEqual(existingHistory.votes)
    expect(result.current.totalVotes).toBe(1)
  })

  it('should add new vote correctly', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useVotingHistory())

    await waitForNextUpdate()

    const newVote = {
      winnerId: 'winner1',
      loserId: 'loser1',
      category: 'test',
      timestamp: new Date().toISOString(),
    }

    await act(async () => {
      await result.current.addVote(newVote)
    })

    expect(result.current.votes).toHaveLength(1)
    expect(result.current.votes[0]).toEqual(newVote)
    expect(result.current.totalVotes).toBe(1)
    expect(AsyncStorage.setItem).toHaveBeenCalled()
  })

  it('should calculate vote stats correctly', async () => {
    const votes = [
      {
        winnerId: '1',
        loserId: '2',
        category: 'ass',
        timestamp: new Date().toISOString(),
      },
      {
        winnerId: '3',
        loserId: '4',
        category: 'ass',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      },
      {
        winnerId: '5',
        loserId: '6',
        category: 'tits',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
    ]

    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ votes, totalVotes: 3 })
    )

    const { result, waitForNextUpdate } = renderHook(() => useVotingHistory())

    await waitForNextUpdate()

    const stats = result.current.getVoteStats()

    expect(stats.today).toBe(1)
    expect(stats.thisWeek).toBe(3)
    expect(stats.thisMonth).toBe(3)
    expect(stats.total).toBe(3)
    expect(stats.streak.current).toBe(2) // Today and yesterday
    expect(stats.preferences.primaryPreference).toBe('ass')
  })

  it('should clear history correctly', async () => {
    const votes = [
      {
        winnerId: '1',
        loserId: '2',
        category: 'test',
        timestamp: new Date().toISOString(),
      },
    ]

    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ votes, totalVotes: 1 })
    )

    const { result, waitForNextUpdate } = renderHook(() => useVotingHistory())

    await waitForNextUpdate()

    expect(result.current.votes).toHaveLength(1)

    await act(async () => {
      await result.current.clearHistory()
    })

    expect(result.current.votes).toEqual([])
    expect(result.current.totalVotes).toBe(0)
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@voting_history')
  })

  it('should calculate streak correctly', async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const threeDaysAgo = new Date(today)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const votes = [
      {
        winnerId: '1',
        loserId: '2',
        category: 'test',
        timestamp: today.toISOString(),
      },
      {
        winnerId: '3',
        loserId: '4',
        category: 'test',
        timestamp: yesterday.toISOString(),
      },
      {
        winnerId: '5',
        loserId: '6',
        category: 'test',
        timestamp: threeDaysAgo.toISOString(),
      },
    ]

    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ votes, totalVotes: 3 })
    )

    const { result, waitForNextUpdate } = renderHook(() => useVotingHistory())

    await waitForNextUpdate()

    const stats = result.current.getVoteStats()

    // Streak should be 2 (today and yesterday, but not 3 days ago)
    expect(stats.streak.current).toBe(2)
  })
})