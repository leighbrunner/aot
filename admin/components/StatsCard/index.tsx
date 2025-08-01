import React from 'react'
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material'

interface StatsCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error'
  loading?: boolean
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, loading }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="overline">
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={100} height={40} />
            ) : (
              <Typography variant="h4" component="div" color={`${color}.main`}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              color: `${color}.main`,
              opacity: 0.3,
              '& svg': { fontSize: 48 },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}