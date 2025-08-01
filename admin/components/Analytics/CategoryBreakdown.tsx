import React from 'react'
import { Box, Typography } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useTheme } from '@mui/material/styles'

interface CategoryBreakdownProps {
  data?: Array<{
    category: string
    voteCount: number
  }>
  period: string
  detailed?: boolean
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ data, period, detailed }) => {
  const theme = useTheme()
  
  if (!data || data.length === 0) {
    return <Typography>No category data available for this period</Typography>
  }

  // Prepare data for pie chart
  const chartData = data.map(item => ({
    name: item.category,
    value: item.voteCount,
  }))

  // Define colors for categories
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.error.main,
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const total = chartData.reduce((sum, item) => sum + item.value, 0)
      const percentage = ((data.value / total) * 100).toFixed(1)
      
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle2">{data.name}</Typography>
          <Typography variant="body2">
            Votes: {data.value.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {percentage}% of total
          </Typography>
        </Box>
      )
    }
    return null
  }

  const renderLabel = (entry: any) => {
    const total = chartData.reduce((sum, item) => sum + item.value, 0)
    const percent = ((entry.value / total) * 100).toFixed(0)
    return `${percent}%`
  }

  return (
    <Box>
      <ResponsiveContainer width="100%" height={detailed ? 400 : 300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={detailed ? 120 : 80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      
      {detailed && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Detailed Breakdown
          </Typography>
          {data.map((item, index) => {
            const total = data.reduce((sum, cat) => sum + cat.voteCount, 0)
            const percentage = ((item.voteCount / total) * 100).toFixed(1)
            
            return (
              <Box
                key={item.category}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: index < data.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: COLORS[index % COLORS.length],
                      borderRadius: '50%',
                    }}
                  />
                  <Typography>{item.category}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2">
                    {item.voteCount.toLocaleString()} votes
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {percentage}%
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}