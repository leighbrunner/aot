import React, { useState } from 'react'
import { 
  Box, Grid, Card, CardMedia, CardContent, CardActions, 
  Button, Typography, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Chip, FormControl, InputLabel, 
  Select, MenuItem, Checkbox, ListItemText, OutlinedInput,
  IconButton, Alert, Snackbar
} from '@mui/material'
import { Check, Close, Visibility } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/api'

const CATEGORY_OPTIONS = {
  physical: ['ass', 'tits', 'legs', 'face', 'hair', 'body'],
  demographic: ['young', 'mature', 'asian', 'latina', 'black', 'white'],
  style: ['casual', 'formal', 'athletic', 'lingerie', 'swimwear'],
}

export const PendingImages: React.FC = () => {
  const queryClient = useQueryClient()
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [characterName, setCharacterName] = useState('')
  const [metadata, setMetadata] = useState({
    ageRange: '',
    nationality: '',
    bodyType: '',
  })
  const [rejectReason, setRejectReason] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any })

  const { data: pendingImages, isLoading } = useQuery({
    queryKey: ['pending-images'],
    queryFn: () => adminApi.getPendingImages(),
  })

  const approveMutation = useMutation({
    mutationFn: ({ imageId, data }: any) => adminApi.approveImage(imageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-images'] })
      setSnackbar({ open: true, message: 'Image approved successfully', severity: 'success' })
      handleCloseDialogs()
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to approve image', severity: 'error' })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ imageId, reason }: any) => adminApi.rejectImage(imageId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-images'] })
      setSnackbar({ open: true, message: 'Image rejected', severity: 'info' })
      handleCloseDialogs()
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to reject image', severity: 'error' })
    },
  })

  const handleApproveClick = (image: any) => {
    setSelectedImage(image)
    setCharacterName(image.characterName || '')
    setCategories(image.categories || [])
    setMetadata(image.metadata || { ageRange: '', nationality: '', bodyType: '' })
    setApprovalDialogOpen(true)
  }

  const handleRejectClick = (image: any) => {
    setSelectedImage(image)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  const handleApprove = () => {
    if (!selectedImage) return

    approveMutation.mutate({
      imageId: selectedImage.imageId,
      data: {
        characterName,
        categories,
        metadata,
      },
    })
  }

  const handleReject = () => {
    if (!selectedImage || !rejectReason) return

    rejectMutation.mutate({
      imageId: selectedImage.imageId,
      reason: rejectReason,
    })
  }

  const handleCloseDialogs = () => {
    setApprovalDialogOpen(false)
    setRejectDialogOpen(false)
    setSelectedImage(null)
    setCategories([])
    setCharacterName('')
    setMetadata({ ageRange: '', nationality: '', bodyType: '' })
    setRejectReason('')
  }

  if (isLoading) {
    return <Typography>Loading pending images...</Typography>
  }

  return (
    <Box>
      {pendingImages?.items?.length === 0 ? (
        <Alert severity="info">No pending images to review</Alert>
      ) : (
        <Grid container spacing={3}>
          {pendingImages?.items?.map((image: any) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={image.imageId}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={image.thumbnailUrl || image.url}
                  alt={image.characterName}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Source: {image.source}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(image.createdAt).toLocaleString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => window.open(image.url, '_blank')}
                  >
                    <Visibility />
                  </IconButton>
                  <Button
                    size="small"
                    color="success"
                    startIcon={<Check />}
                    onClick={() => handleApproveClick(image)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Close />}
                    onClick={() => handleRejectClick(image)}
                  >
                    Reject
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Image</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Character Name"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              fullWidth
              required
            />
            
            <FormControl fullWidth required>
              <InputLabel>Categories</InputLabel>
              <Select
                multiple
                value={categories}
                onChange={(e) => setCategories(e.target.value as string[])}
                input={<OutlinedInput label="Categories" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {Object.entries(CATEGORY_OPTIONS).map(([type, options]) => [
                  <MenuItem key={type} disabled>
                    <Typography variant="caption" color="text.secondary">
                      {type.toUpperCase()}
                    </Typography>
                  </MenuItem>,
                  ...options.map((option) => (
                    <MenuItem key={option} value={option}>
                      <Checkbox checked={categories.indexOf(option) > -1} />
                      <ListItemText primary={option} />
                    </MenuItem>
                  )),
                ])}
              </Select>
            </FormControl>

            <TextField
              label="Age Range"
              value={metadata.ageRange}
              onChange={(e) => setMetadata({ ...metadata, ageRange: e.target.value })}
              placeholder="e.g., 20-25"
              fullWidth
            />

            <TextField
              label="Nationality"
              value={metadata.nationality}
              onChange={(e) => setMetadata({ ...metadata, nationality: e.target.value })}
              fullWidth
            />

            <TextField
              label="Body Type"
              value={metadata.bodyType}
              onChange={(e) => setMetadata({ ...metadata, bodyType: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={!characterName || categories.length === 0 || approveMutation.isPending}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Image</DialogTitle>
        <DialogContent>
          <TextField
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            multiline
            rows={3}
            fullWidth
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={!rejectReason || rejectMutation.isPending}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}