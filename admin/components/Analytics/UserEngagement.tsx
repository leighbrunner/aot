import React from 'react'
import { Box, Grid, Paper, Typography, LinearProgress } from '@mui/material'
import { Person, TrendingUp, Timer, EmojiEvents } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '@mui/material/styles'

interface UserEngagementProps {
  period: 'day' | 'week' | 'month' | 'year' | 'all'
}

export const UserEngagement: React.FC<UserEngagementProps> = ({ period }) => {
  const theme = useTheme()
  const { data: userStats, isLoading } = useQuery({
    queryKey: ['user-analytics', period],
    queryFn: () => adminApi.getUserAnalytics(),
  })

  if (isLoading) {
    return <Typography>Loading user engagement data...</Typography>
  }

  if (!userStats) {
    return <Typography>No user data available</Typography>
  }

  // Prepare data for voting distribution chart
  const votingDistribution = userStats.votingDistribution || []
  const chartData = votingDistribution.map((item: any) => ({
    range: item.range,
    users: item.userCount,
  }))

  return (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Person color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Active Users
            </Typography>
          </Box>
          <Typography variant="h4">
            {userStats.activeUsers?.toLocaleString() || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Voted in selected period
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <TrendingUp color="success" sx={{ mr: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Avg Votes/User
            </Typography>
          </Box>
          <Typography variant="h4">
            {userStats.avgVotesPerUser?.toFixed(1) || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {period === 'day' ? 'Today' : `This ${period}`}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Timer color="info" sx={{ mr: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Retention Rate
            </Typography>
          </Box>
          <Typography variant="h4">
            {userStats.retentionRate?.toFixed(1) || 0}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Returned users
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <EmojiEvents color="warning" sx={{ mr: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Streak Leaders
            </Typography>
          </Box>
          <Typography variant="h4">
            {userStats.streakLeaders || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Users with 7+ day streaks
          </Typography>
        </Paper>
      </Grid>

      {/* Voting Distribution Chart */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Voting Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="range" 
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
              <Bar dataKey="users" fill={theme.palette.primary.main} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Top Users */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Top Voters
          </Typography>
          {userStats.topUsers?.map((user: any, index: number) => (
            <Box
              key={user.userId}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
                borderBottom: index < userStats.topUsers.length - 1 ? 1 : 0,
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2">
                  #{index + 1}
                </Typography>
                <Box>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                    {user.email || `User ${user.userId.substring(0, 8)}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.preferenceType || 'No preference'}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="subtitle2">
                {user.voteCount} votes
              </Typography>
            </Box>
          ))}
        </Paper>
      </Grid>

      {/* Preference Distribution */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            User Preference Distribution
          </Typography>
          <Grid container spacing={2}>
            {userStats.preferenceDistribution?.map((pref: any) => (
              <Grid item xs={12} sm={6} md={3} key={pref.type}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{pref.type}</Typography>
                    <Typography variant="body2">{pref.percentage}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pref.percentage}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {pref.userCount.toLocaleString()} users
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  )
}