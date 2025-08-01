import React, { useState } from 'react'
import { 
  Box, Typography, Button, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, FormControl, 
  InputLabel, Select, MenuItem, IconButton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Alert, Snackbar
} from '@mui/material'
import { Add, Edit, Delete, Category } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/api'

interface CategoryForm {
  displayName: string
  type: 'physical' | 'demographic' | 'style'
  options: string[]
}

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [formData, setFormData] = useState<CategoryForm>({
    displayName: '',
    type: 'physical',
    options: [],
  })
  const [newOption, setNewOption] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any })

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: adminApi.getCategories,
  })

  const createMutation = useMutation({
    mutationFn: adminApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setSnackbar({ open: true, message: 'Category created successfully', severity: 'success' })
      handleCloseDialog()
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create category', severity: 'error' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => adminApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setSnackbar({ open: true, message: 'Category updated successfully', severity: 'success' })
      handleCloseDialog()
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update category', severity: 'error' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setSnackbar({ open: true, message: 'Category deleted successfully', severity: 'info' })
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete category', severity: 'error' })
    },
  })

  const handleOpenDialog = (category?: any) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        displayName: category.displayName,
        type: category.type,
        options: category.options || [],
      })
    } else {
      setEditingCategory(null)
      setFormData({
        displayName: '',
        type: 'physical',
        options: [],
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingCategory(null)
    setFormData({
      displayName: '',
      type: 'physical',
      options: [],
    })
    setNewOption('')
  }

  const handleAddOption = () => {
    if (newOption && !formData.options.includes(newOption)) {
      setFormData({
        ...formData,
        options: [...formData.options, newOption],
      })
      setNewOption('')
    }
  }

  const handleRemoveOption = (option: string) => {
    setFormData({
      ...formData,
      options: formData.options.filter(o => o !== option),
    })
  }

  const handleSubmit = () => {
    if (!formData.displayName || formData.options.length === 0) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'warning' })
      return
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.categoryId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteMutation.mutate(categoryId)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Category Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Category
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Options</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories?.map((category: any) => (
              <TableRow key={category.categoryId}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Category fontSize="small" />
                    {category.displayName}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={category.type} size="small" />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {category.options.map((option: string) => (
                      <Chip key={option} label={option} size="small" variant="outlined" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={category.isActive ? 'Active' : 'Inactive'}
                    color={category.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(category)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(category.categoryId)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Create New Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Display Name"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                label="Type"
              >
                <MenuItem value="physical">Physical</MenuItem>
                <MenuItem value="demographic">Demographic</MenuItem>
                <MenuItem value="style">Style</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Options
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="Add option"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                />
                <Button onClick={handleAddOption} size="small">
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {formData.options.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    onDelete={() => handleRemoveOption(option)}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editingCategory ? 'Update' : 'Create'}
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