import { PreferenceCalculator, VoteRecord } from '../preferences'

describe('PreferenceCalculator', () => {
  describe('calculatePreferences', () => {
    it('should identify ass preference correctly', () => {
      const votes: VoteRecord[] = [
        { winnerId: '1', loserId: '2', category: 'ass', timestamp: '2024-01-01T00:00:00Z' },
        { winnerId: '3', loserId: '4', category: 'ass', timestamp: '2024-01-01T01:00:00Z' },
        { winnerId: '5', loserId: '6', category: 'ass', timestamp: '2024-01-01T02:00:00Z' },
        { winnerId: '7', loserId: '8', category: 'tits', timestamp: '2024-01-01T03:00:00Z' },
      ]

      const result = PreferenceCalculator.calculatePreferences(votes)

      expect(result.primaryPreference).toBe('ass')
      expect(result.preferenceScore).toBeCloseTo(0.75, 2)
      expect(result.personalityType).toBe('connoisseur')
    })

    it('should identify tits preference correctly', () => {
      const votes: VoteRecord[] = [
        { winnerId: '1', loserId: '2', category: 'tits', timestamp: '2024-01-01T00:00:00Z' },
        { winnerId: '3', loserId: '4', category: 'tits', timestamp: '2024-01-01T01:00:00Z' },
        { winnerId: '5', loserId: '6', category: 'tits', timestamp: '2024-01-01T02:00:00Z' },
        { winnerId: '7', loserId: '8', category: 'ass', timestamp: '2024-01-01T03:00:00Z' },
      ]

      const result = PreferenceCalculator.calculatePreferences(votes)

      expect(result.primaryPreference).toBe('tits')
      expect(result.preferenceScore).toBeCloseTo(0.75, 2)
      expect(result.personalityType).toBe('enthusiast')
    })

    it('should handle no preference with equal votes', () => {
      const votes: VoteRecord[] = [
        { winnerId: '1', loserId: '2', category: 'ass', timestamp: '2024-01-01T00:00:00Z' },
        { winnerId: '3', loserId: '4', category: 'tits', timestamp: '2024-01-01T01:00:00Z' },
      ]

      const result = PreferenceCalculator.calculatePreferences(votes)

      expect(result.primaryPreference).toBeUndefined()
      expect(result.preferenceScore).toBe(0.5)
      expect(result.personalityType).toBe('balanced')
    })

    it('should handle empty votes array', () => {
      const result = PreferenceCalculator.calculatePreferences([])

      expect(result.primaryPreference).toBeUndefined()
      expect(result.preferenceScore).toBe(0)
      expect(result.personalityType).toBe('neutral')
    })

    it('should identify different personality types', () => {
      // Explorer - many diverse categories
      const explorerVotes: VoteRecord[] = [
        { winnerId: '1', loserId: '2', category: 'ass', timestamp: '2024-01-01T00:00:00Z' },
        { winnerId: '3', loserId: '4', category: 'tits', timestamp: '2024-01-01T01:00:00Z' },
        { winnerId: '5', loserId: '6', category: 'legs', timestamp: '2024-01-01T02:00:00Z' },
        { winnerId: '7', loserId: '8', category: 'face', timestamp: '2024-01-01T03:00:00Z' },
        { winnerId: '9', loserId: '10', category: 'hair', timestamp: '2024-01-01T04:00:00Z' },
      ]
      
      expect(PreferenceCalculator.calculatePreferences(explorerVotes).personalityType).toBe('explorer')

      // Appreciator - consistent voting pattern
      const appreciatorVotes: VoteRecord[] = Array(20).fill(null).map((_, i) => ({
        winnerId: `w${i}`,
        loserId: `l${i}`,
        category: i % 3 === 0 ? 'ass' : 'tits',
        timestamp: `2024-01-01T${i.toString().padStart(2, '0')}:00:00Z`,
      }))
      
      const appreciatorResult = PreferenceCalculator.calculatePreferences(appreciatorVotes)
      expect(appreciatorResult.personalityType).toBe('appreciator')
    })
  })

  describe('getPersonalityDescription', () => {
    it('should return correct descriptions for each personality type', () => {
      expect(PreferenceCalculator.getPersonalityDescription('balanced'))
        .toContain('enjoy a perfect balance')
      
      expect(PreferenceCalculator.getPersonalityDescription('connoisseur'))
        .toContain('refined taste for the finer aspects')
      
      expect(PreferenceCalculator.getPersonalityDescription('enthusiast'))
        .toContain('passionate appreciation')
      
      expect(PreferenceCalculator.getPersonalityDescription('explorer'))
        .toContain('love discovering new favorites')
      
      expect(PreferenceCalculator.getPersonalityDescription('appreciator'))
        .toContain('sophisticated eye for beauty')
      
      expect(PreferenceCalculator.getPersonalityDescription('neutral'))
        .toContain('just getting started')
      
      expect(PreferenceCalculator.getPersonalityDescription('unknown' as any))
        .toContain('unique voting style')
    })
  })

  describe('calculateCategoryStats', () => {
    it('should calculate category statistics correctly', () => {
      const votes: VoteRecord[] = [
        { winnerId: '1', loserId: '2', category: 'ass', timestamp: '2024-01-01T00:00:00Z' },
        { winnerId: '3', loserId: '4', category: 'ass', timestamp: '2024-01-01T01:00:00Z' },
        { winnerId: '5', loserId: '6', category: 'tits', timestamp: '2024-01-01T02:00:00Z' },
        { winnerId: '7', loserId: '8', category: 'legs', timestamp: '2024-01-01T03:00:00Z' },
      ]

      const stats = PreferenceCalculator.calculateCategoryStats(votes)

      expect(stats).toHaveLength(3)
      expect(stats.find(s => s.category === 'ass')).toEqual({
        category: 'ass',
        count: 2,
        percentage: 50,
      })
      expect(stats.find(s => s.category === 'tits')).toEqual({
        category: 'tits',
        count: 1,
        percentage: 25,
      })
      expect(stats.find(s => s.category === 'legs')).toEqual({
        category: 'legs',
        count: 1,
        percentage: 25,
      })
    })

    it('should sort categories by count', () => {
      const votes: VoteRecord[] = [
        { winnerId: '1', loserId: '2', category: 'legs', timestamp: '2024-01-01T00:00:00Z' },
        { winnerId: '3', loserId: '4', category: 'ass', timestamp: '2024-01-01T01:00:00Z' },
        { winnerId: '5', loserId: '6', category: 'ass', timestamp: '2024-01-01T02:00:00Z' },
        { winnerId: '7', loserId: '8', category: 'ass', timestamp: '2024-01-01T03:00:00Z' },
      ]

      const stats = PreferenceCalculator.calculateCategoryStats(votes)

      expect(stats[0].category).toBe('ass')
      expect(stats[0].count).toBe(3)
      expect(stats[1].category).toBe('legs')
      expect(stats[1].count).toBe(1)
    })
  })
})