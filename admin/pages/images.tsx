import React, { useState } from 'react'
import { Box, Typography, Tabs, Tab } from '@mui/material'
import { PendingImages } from '@/components/ImageApproval/PendingImages'
import { ApprovedImages } from '@/components/ImageApproval/ApprovedImages'
import { RejectedImages } from '@/components/ImageApproval/RejectedImages'

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
      id={`images-tabpanel-${index}`}
      aria-labelledby={`images-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ImagesPage() {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Image Management
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="image tabs">
          <Tab label="Pending Approval" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <PendingImages />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <ApprovedImages />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <RejectedImages />
      </TabPanel>
    </Box>
  )
}