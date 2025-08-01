export interface VoteRecord {
  winnerId: string;
  loserId: string;
  category: string;
  timestamp: string;
}

export interface PreferenceScore {
  category: string;
  wins: number;
  total: number;
  percentage: number;
}

export interface UserPreferences {
  primaryPreference?: string;
  preferenceScore?: number;
  categoryBreakdown: PreferenceScore[];
  personalityType?: string;
}

export class PreferenceCalculator {
  private static readonly MIN_VOTES_FOR_PREFERENCE = 10;
  private static readonly STRONG_PREFERENCE_THRESHOLD = 70; // 70% or higher
  private static readonly MODERATE_PREFERENCE_THRESHOLD = 55; // 55-69%

  static calculatePreferences(votes: VoteRecord[]): UserPreferences {
    if (votes.length < this.MIN_VOTES_FOR_PREFERENCE) {
      return {
        categoryBreakdown: [],
        personalityType: 'Explorer', // Still exploring preferences
      };
    }

    // Count wins by category
    const categoryWins = new Map<string, number>();
    const categoryTotal = new Map<string, number>();

    votes.forEach(vote => {
      const category = vote.category.toLowerCase();
      
      // Increment total for the category
      categoryTotal.set(category, (categoryTotal.get(category) || 0) + 1);
      
      // Increment wins (assuming winnerId represents the chosen option)
      categoryWins.set(category, (categoryWins.get(category) || 0) + 1);
    });

    // Calculate percentages
    const categoryBreakdown: PreferenceScore[] = [];
    categoryTotal.forEach((total, category) => {
      const wins = categoryWins.get(category) || 0;
      const percentage = Math.round((wins / total) * 100);
      
      categoryBreakdown.push({
        category,
        wins,
        total,
        percentage,
      });
    });

    // Sort by percentage (highest first)
    categoryBreakdown.sort((a, b) => b.percentage - a.percentage);

    // Determine primary preference
    const primaryCategory = categoryBreakdown[0];
    const primaryPreference = primaryCategory?.category;
    const preferenceScore = primaryCategory?.percentage || 0;

    // Determine personality type based on voting patterns
    const personalityType = this.determinePersonalityType(
      categoryBreakdown,
      preferenceScore
    );

    return {
      primaryPreference,
      preferenceScore,
      categoryBreakdown,
      personalityType,
    };
  }

  private static determinePersonalityType(
    breakdown: PreferenceScore[],
    primaryScore: number
  ): string {
    if (primaryScore >= this.STRONG_PREFERENCE_THRESHOLD) {
      return 'Decisive'; // Strong preference for one category
    } else if (primaryScore >= this.MODERATE_PREFERENCE_THRESHOLD) {
      return 'Leaning'; // Moderate preference
    } else if (breakdown.length > 1 && 
               Math.abs(breakdown[0].percentage - breakdown[1].percentage) < 10) {
      return 'Balanced'; // Close preferences between top categories
    } else {
      return 'Diverse'; // Varied preferences
    }
  }

  static getPreferenceInsight(preferences: UserPreferences): string {
    const { primaryPreference, preferenceScore, personalityType } = preferences;
    
    if (!primaryPreference) {
      return 'Keep voting to discover your preferences!';
    }

    switch (personalityType) {
      case 'Decisive':
        return `You're a ${primaryPreference} person through and through! (${preferenceScore}% preference)`;
      case 'Leaning':
        return `You tend to prefer ${primaryPreference} (${preferenceScore}% of the time)`;
      case 'Balanced':
        return `You appreciate both equally - a true connoisseur!`;
      case 'Diverse':
        return `You have varied tastes - variety is the spice of life!`;
      case 'Explorer':
        return `You're still exploring your preferences - keep voting!`;
      default:
        return `You prefer ${primaryPreference} (${preferenceScore}% preference)`;
    }
  }

  static calculateStreak(votes: VoteRecord[]): {
    currentStreak: number;
    longestStreak: number;
    lastVoteDate: string | null;
  } {
    if (votes.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastVoteDate: null,
      };
    }

    // Sort votes by timestamp (newest first)
    const sortedVotes = [...votes].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const lastVoteDate = sortedVotes[0].timestamp;
    const now = new Date();
    const lastVote = new Date(lastVoteDate);
    
    // Check if streak is still active (voted within last 24 hours)
    const hoursSinceLastVote = (now.getTime() - lastVote.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastVote > 24) {
      return {
        currentStreak: 0,
        longestStreak: this.calculateLongestStreak(sortedVotes),
        lastVoteDate,
      };
    }

    // Calculate current streak
    let currentStreak = 1;
    let currentDate = new Date(lastVoteDate);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < sortedVotes.length; i++) {
      const voteDate = new Date(sortedVotes[i].timestamp);
      voteDate.setHours(0, 0, 0, 0);
      
      const dayDiff = Math.floor((currentDate.getTime() - voteDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        currentStreak++;
        currentDate = voteDate;
      } else if (dayDiff > 1) {
        break;
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(currentStreak, this.calculateLongestStreak(sortedVotes)),
      lastVoteDate,
    };
  }

  private static calculateLongestStreak(sortedVotes: VoteRecord[]): number {
    if (sortedVotes.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;
    let prevDate = new Date(sortedVotes[0].timestamp);
    prevDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < sortedVotes.length; i++) {
      const currDate = new Date(sortedVotes[i].timestamp);
      currDate.setHours(0, 0, 0, 0);
      
      const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (dayDiff > 1) {
        currentStreak = 1;
      }
      
      prevDate = currDate;
    }

    return longestStreak;
  }
}