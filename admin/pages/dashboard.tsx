import React from 'react'
import { Grid, Paper, Typography, Box } from '@mui/material'
import { People, Image, ThumbUp, TrendingUp } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { StatsCard } from '@/components/StatsCard'
import { RecentActivity } from '@/components/RecentActivity'
import { VotingTrendsChart } from '@/components/VotingTrendsChart'

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminApi.getDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={<People />}
            color="primary"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Images"
            value={stats?.totalImages || 0}
            icon={<Image />}
            color="secondary"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Votes"
            value={stats?.totalVotes || 0}
            icon={<ThumbUp />}
            color="success"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Votes Today"
            value={stats?.votesToday || 0}
            icon={<TrendingUp />}
            color="info"
            loading={isLoading}
          />
        </Grid>

        {/* Voting Trends Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Voting Trends (Last 7 Days)
            </Typography>
            <VotingTrendsChart />
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <RecentActivity />
          </Paper>
        </Grid>

        {/* Category Performance */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Category Performance
            </Typography>
            <Grid container spacing={2}>
              {stats?.categoryStats?.map((category: any) => (
                <Grid item xs={12} sm={6} md={3} key={category.name}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="primary">
                      {category.voteCount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {((category.voteCount / stats.totalVotes) * 100).toFixed(1)}% of total
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}