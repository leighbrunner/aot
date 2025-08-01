import React, { useState } from 'react'
import { 
  Box, Typography, Grid, Paper, Tabs, Tab,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { CountryMap } from '@/components/Analytics/CountryMap'
import { CategoryBreakdown } from '@/components/Analytics/CategoryBreakdown'
import { ImagePerformance } from '@/components/Analytics/ImagePerformance'
import { UserEngagement } from '@/components/Analytics/UserEngagement'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

type Period = 'day' | 'week' | 'month' | 'year' | 'all'

export default function AnalyticsPage() {
  const [tabValue, setTabValue] = useState(0)
  const [period, setPeriod] = useState<Period>('week')

  const { data: categoryStats } = useQuery({
    queryKey: ['category-analytics', period],
    queryFn: () => adminApi.getCategoryAnalytics(period),
  })

  const { data: countryStats } = useQuery({
    queryKey: ['country-analytics'],
    queryFn: adminApi.getCountryAnalytics,
  })

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Analytics
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            label="Period"
          >
            <MenuItem value="day">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="analytics tabs">
          <Tab label="Overview" />
          <Tab label="Geography" />
          <Tab label="Categories" />
          <Tab label="Images" />
          <Tab label="Users" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Category Performance
              </Typography>
              <CategoryBreakdown data={categoryStats} period={period} />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Performing Images
              </Typography>
              <ImagePerformance period={period} />
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Voting Patterns by Country
          </Typography>
          <CountryMap data={countryStats} />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Category Deep Dive
          </Typography>
          <CategoryBreakdown data={categoryStats} period={period} detailed />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Image Performance Analysis
          </Typography>
          <ImagePerformance period={period} detailed />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            User Engagement Metrics
          </Typography>
          <UserEngagement period={period} />
        </Paper>
      </TabPanel>
    </Box>
  )
}