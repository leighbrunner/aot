import React from 'react'
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material'
import { Public } from '@mui/icons-material'

interface CountryData {
  country: string
  totalVotes: number
  categories: Array<{
    category: string
    voteCount: number
  }>
}

interface CountryMapProps {
  data?: CountryData[]
}

export const CountryMap: React.FC<CountryMapProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <Typography>No country data available</Typography>
  }

  // Sort countries by total votes
  const sortedData = [...data].sort((a, b) => b.totalVotes - a.totalVotes)

  // Get country flag emoji
  const getCountryFlag = (countryCode: string) => {
    // This is a simplified version - you'd map country names to codes
    const flags: Record<string, string> = {
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'JP': '🇯🇵',
      'BR': '🇧🇷',
      'IN': '🇮🇳',
      'unknown': '🌍',
    }
    return flags[countryCode] || '🌍'
  }

  // Get dominant preference for a country
  const getDominantPreference = (categories: CountryData['categories']) => {
    if (!categories || categories.length === 0) return null
    
    const sorted = [...categories].sort((a, b) => b.voteCount - a.voteCount)
    const dominant = sorted[0]
    const percentage = (dominant.voteCount / categories.reduce((sum, cat) => sum + cat.voteCount, 0)) * 100
    
    return {
      category: dominant.category,
      percentage: percentage.toFixed(1),
    }
  }

  return (
    <Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Country</TableCell>
              <TableCell align="right">Total Votes</TableCell>
              <TableCell>Dominant Preference</TableCell>
              <TableCell>Category Breakdown</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.slice(0, 20).map((country) => {
              const dominant = getDominantPreference(country.categories)
              
              return (
                <TableRow key={country.country}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">
                        {getCountryFlag(country.country)}
                      </Typography>
                      <Typography>
                        {country.country === 'unknown' ? 'Unknown' : country.country}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h6">
                      {country.totalVotes.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {dominant && (
                      <Chip
                        label={`${dominant.category} (${dominant.percentage}%)`}
                        color="primary"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {country.categories.map((cat) => (
                        <Chip
                          key={cat.category}
                          label={`${cat.category}: ${cat.voteCount}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {data.length > 20 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Showing top 20 countries out of {data.length} total
        </Typography>
      )}
    </Box>
  )
}