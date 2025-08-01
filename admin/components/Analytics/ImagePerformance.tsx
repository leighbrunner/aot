import React from 'react'
import { Box, Typography, Grid, Card, CardMedia, CardContent, Chip, LinearProgress } from '@mui/material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/api'

interface ImagePerformanceProps {
  period: 'day' | 'week' | 'month' | 'year' | 'all'
  detailed?: boolean
}

export const ImagePerformance: React.FC<ImagePerformanceProps> = ({ period, detailed }) => {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['image-performance', period],
    queryFn: () => adminApi.getLeaderboard(period),
  })

  if (isLoading) {
    return <Typography>Loading image performance...</Typography>
  }

  if (!leaderboard || leaderboard.length === 0) {
    return <Typography>No image data available for this period</Typography>
  }

  const topImages = detailed ? leaderboard : leaderboard.slice(0, 5)

  return (
    <Grid container spacing={2}>
      {topImages.map((item: any, index: number) => (
        <Grid item xs={12} md={detailed ? 4 : 12} key={item.imageId}>
          <Card sx={{ display: 'flex', height: '100%' }}>
            <CardMedia
              component="img"
              sx={{ width: 120, objectFit: 'cover' }}
              image={item.image.thumbnailUrl || item.image.url}
              alt={item.image.characterName}
            />
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">
                  #{index + 1}
                </Typography>
                <Chip
                  label={`${(item.stats.winRate * 100).toFixed(1)}% Win Rate`}
                  color={item.stats.winRate >= 0.5 ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              
              <Typography variant="subtitle2" noWrap>
                {item.image.characterName}
              </Typography>
              
              <Box sx={{ mt: 1, mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={item.stats.winRate * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                {item.image.categories.slice(0, 2).map((cat: string) => (
                  <Chip key={cat} label={cat} size="small" variant="outlined" />
                ))}
              </Box>
              
              <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  {item.stats.voteCount.toLocaleString()} votes
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.stats.winCount.toLocaleString()} wins
                </Typography>
              </Box>
              
              {detailed && item.stats.trend && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {item.stats.trend > 0 ? (
                    <TrendingUp color="success" fontSize="small" />
                  ) : (
                    <TrendingDown color="error" fontSize="small" />
                  )}
                  <Typography variant="caption" color={item.stats.trend > 0 ? 'success.main' : 'error.main'}>
                    {Math.abs(item.stats.trend)}% vs last period
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}