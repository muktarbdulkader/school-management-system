import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  Typography,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Button,
  TextField,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Edit, Delete, Add, Search } from '@mui/icons-material';
import Backend from 'services/backend';

/**
 * UserList.jsx
 * - MUI DataGrid with server-side role filtering, search (debounced) and server-side pagination.
 * - Expects Backend.api (axios instance) and branch_id available in localStorage (or adapt to context).
 *
 * Notes about API responses handled here:
 * - If `/api/users/` returns paginated shape { results: [...], count: <total> }, the component will use that.
 * - If it returns an array directly, the component will treat it as non-paginated (total = array.length).
 */
export default function UserList() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Filters & controls
  const [roleFilter, setRoleFilter] = useState('all');
  const [roles, setRoles] = useState([]);
  const [searchText, setSearchText] = useState('');

  // Pagination (DataGrid uses zero-based page index)
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const debounceRef = useRef(null);
  const branchId = localStorage.getItem('branch_id');

  const buildQuery = ({ pageIndex = page, pageSizeValue = pageSize, role = roleFilter, search = searchText } = {}) => {
    const params = new URLSearchParams();
    if (branchId) params.set('branch_id', branchId);
    if (role && role !== 'all') params.set('role_name', role);
    if (search && search.trim()) params.set('search', search.trim());

    // API pagination: send 1-based page index to backend if it expects page param
    if (pageSizeValue) params.set('page_size', pageSizeValue);
    // Many APIs expect `page` starting at 1. We send pageIndex + 1 to be safe.
    params.set('page', (pageIndex + 1).toString());

    return params.toString();
  };

  const fetchBranch = async () => {
    try {
      const branchRes = await Backend.api.get(`/api/branches/?branch_id=${branchId}`);
      const branchData = Array.isArray(branchRes.data) ? branchRes.data[0] : branchRes.data;
      setBranch(branchData || null);
    } catch (err) {
      console.error('fetchBranch error', err);
      // Not fatal — continue to users fetch
    }
  };

  const fetchUsers = async ({ pageIndex = page, pageSizeValue = pageSize, role = roleFilter, search = searchText } = {}) => {
    setLoading(true);
    setError('');
    try {
      const q = buildQuery({ pageIndex, pageSizeValue, role, search });
      const res = await Backend.api.get(`/api/users/?${q}`);

      // handle paginated or array response
      if (res?.data && typeof res.data === 'object') {
        if (Array.isArray(res.data)) {
          setUsers(res.data);
          setTotal(res.data.length);
        } else if (Array.isArray(res.data.results)) {
          setUsers(res.data.results);
          setTotal(res.data.count ?? res.data.results.length);
        } else if (Array.isArray(res.data.data)) {
          // some APIs use { data: [...] }
          setUsers(res.data.data);
          setTotal(res.data.total ?? res.data.data.length);
        } else {
          // fallback: try to treat response as a single-object array
          setUsers(res.data ? [res.data] : []);
          setTotal(res.data ? 1 : 0);
        }
      } else {
        setUsers([]);
        setTotal(0);
      }

      // derive roles from fetched data (union existing + newly fetched)
      const rolesSet = new Set(roles);
      (Array.isArray(res?.data?.results) ? res.data.results : Array.isArray(res?.data) ? res.data : []).forEach((u) => {
        if (u && u.role_name) rolesSet.add(u.role_name);
      });
      setRoles(Array.from(rolesSet).sort());
    } catch (err) {
      console.error('fetchUsers error', err);
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    (async () => {
      await fetchBranch();
      await fetchUsers({ pageIndex: 0, pageSizeValue: pageSize, role: 'all', search: '' });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when roleFilter changes, reset page and fetch
  useEffect(() => {
    setPage(0);
    fetchUsers({ pageIndex: 0, pageSizeValue: pageSize, role: roleFilter, search: searchText });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  // debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      fetchUsers({ pageIndex: 0, pageSizeValue: pageSize, role: roleFilter, search: searchText });
    }, 450);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  // Handle DataGrid server-side pagination changes
  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchUsers({ pageIndex: newPage, pageSizeValue: pageSize, role: roleFilter, search: searchText });
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(0);
    fetchUsers({ pageIndex: 0, pageSizeValue: newSize, role: roleFilter, search: searchText });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await Backend.api.delete(`/api/users/${id}/`);
      // refetch current page
      fetchUsers({ pageIndex: page, pageSizeValue: pageSize, role: roleFilter, search: searchText });
      setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Failed to delete user', severity: 'error' });
    }
  };

  const handleEdit = (row) => {
    // TODO: open edit dialog or route to edit page
    console.log('Edit user', row);
  };

  const handleCreate = () => {
    // TODO: open create dialog or route to create page
    console.log('Create new user');
  };

  const columns = useMemo(() => [
    { field: 'full_name', headerName: 'Full Name', flex: 1, minWidth: 180 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    { field: 'role_name', headerName: 'Role', width: 140 },
    {
      field: 'branch',
      headerName: 'Branch',
      flex: 1,
      minWidth: 150,
      valueGetter: () => branch?.name || branch?.branch_name || branchId,
    },
    { field: 'created_at', headerName: 'Created At', flex: 1, minWidth: 160 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton color="primary" size="small" onClick={() => handleEdit(params.row)}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton color="error" size="small" onClick={() => handleDelete(params.row.id)}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ], [branch, branchId]);

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Typography color="error" sx={{ textAlign: 'center', mt: 3 }}>
        {error}
      </Typography>
    );

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Users List {branch ? `— ${branch.name || branch.branch_name}` : ''}</Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by name or email..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
            sx={{ minWidth: 260 }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="role-filter-label">Role</InputLabel>
            <Select
              labelId="role-filter-label"
              value={roleFilter}
              label="Role"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {roles.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="contained" size="small" startIcon={<Add />} onClick={handleCreate}>
            New User
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ height: 640, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row.id}
          paginationMode="server"
          page={page}
          pageSize={pageSize}
          rowsPerPageOptions={[5, 10, 25, 50]}
          rowCount={total}
          onPageChange={(newPage) => handlePageChange(newPage)}
          onPageSizeChange={(newSize) => handlePageSizeChange(newSize)}
          disableRowSelectionOnClick
        />
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
      />
    </Box>
  );
}
