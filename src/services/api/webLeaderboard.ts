// Web-specific leaderboard service that doesn't use Amplify
export type Period = 'day' | 'week' | 'month' | 'year' | 'all';

export interface LeaderboardItem {
  rank: number;
  imageId: string;
  url: string;
  thumbnailUrl?: string;
  characterName: string;
  categories: string[];
  voteCount: number;
  winCount: number;
  winRate: number;
  metadata?: any;
}

export interface LeaderboardQuery {
  period: Period;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface CountryStats {
  country: string;
  countryName: string;
  preference: 'ass' | 'tits';
  score: number;
  totalVotes: number;
}

export const leaderboardAPI = {
  // Get top images for a period
  async getTopImages(query: LeaderboardQuery): Promise<LeaderboardItem[]> {
    console.log('Getting top images (mock):', query);
    
    // Return mock data for web
    const mockItems: LeaderboardItem[] = [
      {
        rank: 1,
        imageId: '1',
        url: 'https://via.placeholder.com/400x600/FF6B6B/FFFFFF?text=Top+1',
        thumbnailUrl: 'https://via.placeholder.com/150x150/FF6B6B/FFFFFF?text=1',
        characterName: 'Character 1',
        categories: ['category1'],
        voteCount: 1250,
        winCount: 900,
        winRate: 0.72,
      },
      {
        rank: 2,
        imageId: '2',
        url: 'https://via.placeholder.com/400x600/4ECDC4/FFFFFF?text=Top+2',
        thumbnailUrl: 'https://via.placeholder.com/150x150/4ECDC4/FFFFFF?text=2',
        characterName: 'Character 2',
        categories: ['category1'],
        voteCount: 1100,
        winCount: 750,
        winRate: 0.68,
      },
      {
        rank: 3,
        imageId: '3',
        url: 'https://via.placeholder.com/400x600/45B7D1/FFFFFF?text=Top+3',
        thumbnailUrl: 'https://via.placeholder.com/150x150/45B7D1/FFFFFF?text=3',
        characterName: 'Character 3',
        categories: ['category1'],
        voteCount: 980,
        winCount: 650,
        winRate: 0.66,
      },
    ];
    
    return mockItems;
  },

  // Get country preferences
  async getCountryPreferences(): Promise<CountryStats[]> {
    console.log('Getting country preferences (mock)');
    
    return [
      {
        country: 'US',
        countryName: 'United States',
        preference: 'ass',
        score: 0.65,
        totalVotes: 50000,
      },
      {
        country: 'GB',
        countryName: 'United Kingdom',
        preference: 'tits',
        score: 0.58,
        totalVotes: 25000,
      },
    ];
  },

  // Get category analytics
  async getCategoryAnalytics(period: Period): Promise<any> {
    console.log('Getting category analytics (mock):', period);
    
    return {
      categories: [
        { name: 'category1', voteCount: 15000, avgWinRate: 0.52 },
        { name: 'category2', voteCount: 12000, avgWinRate: 0.48 },
      ],
    };
  },
};