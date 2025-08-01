import React from 'react'
import { List, ListItem, ListItemText, ListItemAvatar, Avatar, Typography, Box, Chip } from '@mui/material'
import { Image, ThumbUp, Person, Category } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'

export const RecentActivity: React.FC = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: adminApi.getRecentActivity,
    refetchInterval: 10000, // Refresh every 10 seconds
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'vote':
        return <ThumbUp />
      case 'image_approved':
        return <Image />
      case 'user_signup':
        return <Person />
      case 'category_created':
        return <Category />
      default:
        return <ThumbUp />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'vote':
        return 'primary'
      case 'image_approved':
        return 'success'
      case 'user_signup':
        return 'info'
      case 'category_created':
        return 'secondary'
      default:
        return 'default'
    }
  }

  if (isLoading) {
    return <Typography>Loading...</Typography>
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', overflow: 'auto', maxHeight: 320 }}>
      {activities?.map((activity: any, index: number) => (
        <ListItem key={activity.id || index} alignItems="flex-start">
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: `${getActivityColor(activity.type)}.main` }}>
              {getActivityIcon(activity.type)}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">{activity.description}</Typography>
                <Chip 
                  label={activity.type.replace('_', ' ')} 
                  size="small" 
                  color={getActivityColor(activity.type) as any}
                />
              </Box>
            }
            secondary={
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>
  )
}