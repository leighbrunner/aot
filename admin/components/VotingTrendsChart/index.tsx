import React from 'react'
import { useTheme } from '@mui/material/styles'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/api'

export const VotingTrendsChart: React.FC = () => {
  const theme = useTheme()
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['voting-trends'],
    queryFn: adminApi.getVotingTrends,
  })

  if (isLoading || !chartData) {
    return <div>Loading chart...</div>
  }

  return (
    <ResponsiveContainer width="100%" height="90%">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="date" 
          stroke={theme.palette.text.secondary}
          style={{ fontSize: '0.75rem' }}
        />
        <YAxis 
          stroke={theme.palette.text.secondary}
          style={{ fontSize: '0.75rem' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="totalVotes" 
          stroke={theme.palette.primary.main} 
          strokeWidth={2}
          name="Total Votes"
        />
        <Line 
          type="monotone" 
          dataKey="uniqueUsers" 
          stroke={theme.palette.secondary.main} 
          strokeWidth={2}
          name="Unique Users"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}