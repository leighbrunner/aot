import { ScheduledHandler } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { 
  DynamoDBDocumentClient, 
  QueryCommand, 
  BatchWriteCommand, 
  UpdateCommand 
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

const VOTES_TABLE = process.env.VOTES_TABLE_NAME!
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE_NAME!
const IMAGES_TABLE = process.env.IMAGES_TABLE_NAME!

interface AggregationPeriod {
  period: 'day' | 'week' | 'month' | 'year' | 'all'
  dateKey: string
}

export const handler: ScheduledHandler = async (event) => {
  console.log('Analytics aggregation started:', event)
  
  const now = new Date()
  const periods = getPeriods(now)
  
  try {
    // Aggregate for each period
    for (const period of periods) {
      console.log(`Aggregating for ${period.period}: ${period.dateKey}`)
      
      // Aggregate image stats
      await aggregateImageStats(period)
      
      // Aggregate category stats
      await aggregateCategoryStats(period)
      
      // Aggregate user stats
      await aggregateUserStats(period)
      
      // Aggregate country stats
      await aggregateCountryStats(period)
    }
    
    console.log('Analytics aggregation completed successfully')
  } catch (error) {
    console.error('Analytics aggregation failed:', error)
    throw error
  }
}

function getPeriods(date: Date): AggregationPeriod[] {
  return [
    {
      period: 'day',
      dateKey: date.toISOString().split('T')[0],
    },
    {
      period: 'week',
      dateKey: getWeekStart(date),
    },
    {
      period: 'month',
      dateKey: date.toISOString().substring(0, 7),
    },
    {
      period: 'year',
      dateKey: date.getFullYear().toString(),
    },
    {
      period: 'all',
      dateKey: 'all-time',
    },
  ]
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

async function aggregateImageStats(period: AggregationPeriod) {
  // Get all votes for the period
  const votes = await getVotesForPeriod(period)
  
  // Aggregate votes by image
  const imageStats = new Map<string, { winCount: number; voteCount: number }>()
  
  for (const vote of votes) {
    const winnerId = vote.winnerId
    const loserId = vote.loserId
    
    // Update winner stats
    if (!imageStats.has(winnerId)) {
      imageStats.set(winnerId, { winCount: 0, voteCount: 0 })
    }
    const winnerStats = imageStats.get(winnerId)!
    winnerStats.winCount++
    winnerStats.voteCount++
    
    // Update loser stats
    if (!imageStats.has(loserId)) {
      imageStats.set(loserId, { winCount: 0, voteCount: 0 })
    }
    const loserStats = imageStats.get(loserId)!
    loserStats.voteCount++
  }
  
  // Write aggregated stats to analytics table
  const batchWrites = []
  for (const [imageId, stats] of imageStats) {
    const winRate = stats.voteCount > 0 ? stats.winCount / stats.voteCount : 0
    
    batchWrites.push({
      PutRequest: {
        Item: {
          PK: `ANALYTICS#image#${period.period}`,
          SK: `ITEM#${imageId}`,
          type: 'image',
          period: `${period.period}#${period.dateKey}`,
          date: period.dateKey,
          itemId: imageId,
          voteCount: stats.voteCount,
          winCount: stats.winCount,
          winRate,
          lastUpdated: new Date().toISOString(),
        }
      }
    })
  }
  
  // Write in batches of 25
  while (batchWrites.length > 0) {
    const batch = batchWrites.splice(0, 25)
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [ANALYTICS_TABLE]: batch
      }
    }))
  }
}

async function aggregateCategoryStats(period: AggregationPeriod) {
  const votes = await getVotesForPeriod(period)
  
  // Aggregate votes by category
  const categoryStats = new Map<string, number>()
  
  for (const vote of votes) {
    const category = vote.category || 'general'
    categoryStats.set(category, (categoryStats.get(category) || 0) + 1)
  }
  
  // Write aggregated stats
  for (const [category, voteCount] of categoryStats) {
    await docClient.send(new UpdateCommand({
      TableName: ANALYTICS_TABLE,
      Key: {
        PK: `ANALYTICS#category#${period.period}`,
        SK: `ITEM#${category}`,
      },
      UpdateExpression: `
        SET #type = :type,
            period = :period,
            #date = :date,
            itemId = :itemId,
            voteCount = :voteCount,
            lastUpdated = :now
      `,
      ExpressionAttributeNames: {
        '#type': 'type',
        '#date': 'date',
      },
      ExpressionAttributeValues: {
        ':type': 'category',
        ':period': `${period.period}#${period.dateKey}`,
        ':date': period.dateKey,
        ':itemId': category,
        ':voteCount': voteCount,
        ':now': new Date().toISOString(),
      },
    }))
  }
}

async function aggregateUserStats(period: AggregationPeriod) {
  const votes = await getVotesForPeriod(period)
  
  // Get unique users and their vote counts
  const userVotes = new Map<string, number>()
  
  for (const vote of votes) {
    const userId = vote.userId
    userVotes.set(userId, (userVotes.get(userId) || 0) + 1)
  }
  
  // Update analytics with user metrics
  await docClient.send(new UpdateCommand({
    TableName: ANALYTICS_TABLE,
    Key: {
      PK: `ANALYTICS#users#${period.period}`,
      SK: `SUMMARY#${period.dateKey}`,
    },
    UpdateExpression: `
      SET #type = :type,
          period = :period,
          #date = :date,
          totalVotes = :totalVotes,
          uniqueUsers = :uniqueUsers,
          averageVotesPerUser = :avgVotes,
          lastUpdated = :now
    `,
    ExpressionAttributeNames: {
      '#type': 'type',
      '#date': 'date',
    },
    ExpressionAttributeValues: {
      ':type': 'user_summary',
      ':period': `${period.period}#${period.dateKey}`,
      ':date': period.dateKey,
      ':totalVotes': votes.length,
      ':uniqueUsers': userVotes.size,
      ':avgVotes': votes.length / Math.max(userVotes.size, 1),
      ':now': new Date().toISOString(),
    },
  }))
}

async function aggregateCountryStats(period: AggregationPeriod) {
  const votes = await getVotesForPeriod(period)
  
  // Aggregate votes by country and category
  const countryStats = new Map<string, Map<string, number>>()
  
  for (const vote of votes) {
    const country = vote.country || 'unknown'
    const category = vote.category || 'general'
    
    if (!countryStats.has(country)) {
      countryStats.set(country, new Map())
    }
    
    const categoryMap = countryStats.get(country)!
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
  }
  
  // Write country stats
  for (const [country, categoryMap] of countryStats) {
    const categories = Array.from(categoryMap.entries()).map(([cat, count]) => ({
      category: cat,
      voteCount: count,
    }))
    
    const totalVotes = categories.reduce((sum, cat) => sum + cat.voteCount, 0)
    
    await docClient.send(new UpdateCommand({
      TableName: ANALYTICS_TABLE,
      Key: {
        PK: `ANALYTICS#country#${period.period}`,
        SK: `ITEM#${country}`,
      },
      UpdateExpression: `
        SET #type = :type,
            period = :period,
            #date = :date,
            itemId = :itemId,
            totalVotes = :totalVotes,
            categories = :categories,
            lastUpdated = :now
      `,
      ExpressionAttributeNames: {
        '#type': 'type',
        '#date': 'date',
      },
      ExpressionAttributeValues: {
        ':type': 'country',
        ':period': `${period.period}#${period.dateKey}`,
        ':date': period.dateKey,
        ':itemId': country,
        ':totalVotes': totalVotes,
        ':categories': categories,
        ':now': new Date().toISOString(),
      },
    }))
  }
}

async function getVotesForPeriod(period: AggregationPeriod): Promise<any[]> {
  const votes: any[] = []
  let lastEvaluatedKey: any = undefined
  
  // For 'all' period, we need to scan the entire table
  // For other periods, we query by date
  const startDate = getStartDate(period)
  const endDate = getEndDate(period)
  
  do {
    const queryResponse = await docClient.send(new QueryCommand({
      TableName: VOTES_TABLE,
      IndexName: 'GSI2', // DATE index
      KeyConditionExpression: '#pk = :pk AND #sk BETWEEN :start AND :end',
      ExpressionAttributeNames: {
        '#pk': 'GSI2PK',
        '#sk': 'GSI2SK',
      },
      ExpressionAttributeValues: {
        ':pk': `DATE#${period.dateKey.substring(0, 10)}`, // Use date prefix
        ':start': `VOTE#${startDate}`,
        ':end': `VOTE#${endDate}`,
      },
      ExclusiveStartKey: lastEvaluatedKey,
    }))
    
    if (queryResponse.Items) {
      votes.push(...queryResponse.Items)
    }
    
    lastEvaluatedKey = queryResponse.LastEvaluatedKey
  } while (lastEvaluatedKey)
  
  return votes
}

function getStartDate(period: AggregationPeriod): string {
  const now = new Date()
  
  switch (period.period) {
    case 'day':
      return `${period.dateKey}T00:00:00.000Z`
    case 'week':
      return `${period.dateKey}T00:00:00.000Z`
    case 'month':
      return `${period.dateKey}-01T00:00:00.000Z`
    case 'year':
      return `${period.dateKey}-01-01T00:00:00.000Z`
    case 'all':
      return '2020-01-01T00:00:00.000Z' // Arbitrary old date
  }
}

function getEndDate(period: AggregationPeriod): string {
  const now = new Date()
  
  switch (period.period) {
    case 'day':
      return `${period.dateKey}T23:59:59.999Z`
    case 'week':
      const weekEnd = new Date(period.dateKey)
      weekEnd.setDate(weekEnd.getDate() + 6)
      return `${weekEnd.toISOString()}`
    case 'month':
      const nextMonth = new Date(period.dateKey + '-01')
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      nextMonth.setMilliseconds(-1)
      return nextMonth.toISOString()
    case 'year':
      return `${period.dateKey}-12-31T23:59:59.999Z`
    case 'all':
      return new Date().toISOString()
  }
}