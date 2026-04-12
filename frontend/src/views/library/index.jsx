import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material';
import { IconSearch, IconPlus, IconRefresh, IconBook } from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import BookBorrowForm from './components/BookBorrowForm';
import BookCreateForm from './components/BookCreateForm';
import { useSelector } from 'react-redux';

const LibraryPage = () => {
  const [books, setBooks] = useState([]);
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);

  // Check if current user is a student
  const userRoles = useSelector((state) => state.user?.user?.roles || []);
  const isStudent = userRoles.some(role => typeof role === 'string' ? role.toLowerCase() === 'student' : role.name?.toLowerCase() === 'student');

  useEffect(() => {
    fetchBooks();
    fetchBorrowings();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.libraryBooks}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBooks(data.data || []);
          toast.success('Books loaded successfully');
        }
      } else {
        toast.error('Failed to load books');
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const fetchBorrowings = async () => {
    try {
      const token = await GetToken();
      const endpoint = isStudent ? Backend.libraryMyBorrowings : Backend.libraryBorrowings;
      const response = await fetch(`${Backend.api}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBorrowings(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching borrowings:', error);
    }
  };

  const handleReturnBook = async (borrowId) => {
    try {
      const token = await GetToken();
      const url = Backend.libraryReturnBook.replace('{id}', borrowId);
      const response = await fetch(`${Backend.api}${url}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Book returned successfully');
        fetchBorrowings();
        fetchBooks();
      } else {
        toast.error(data.message || 'Failed to return book');
      }
    } catch (error) {
      console.error('Error returning book:', error);
      toast.error('Failed to return book');
    }
  };

  const filteredBooks = books.filter(book =>
    book?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book?.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book?.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBorrowings = borrowings.filter(borrow =>
    borrow?.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    borrow?.borrower_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer title="Library Management">
      <DrogaCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h3">Library</Typography>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<IconRefresh />}
              onClick={() => {
                fetchBooks();
                fetchBorrowings();
              }}
              disabled={loading}
            >
              Refresh
            </Button>
            {!isStudent && (
              <Button
                variant="contained"
                startIcon={<IconPlus />}
                onClick={() => setCreateFormOpen(true)}
                color="secondary"
              >
                Add Book
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<IconPlus />}
              onClick={() => setFormOpen(true)}
            >
              Borrow Book
            </Button>
          </Stack>
        </Stack>

        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label="Available Books" />
          <Tab label="Borrowed Books" />
        </Tabs>

        <TextField
          fullWidth
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconSearch size={20} />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <ActivityIndicator size={32} />
          </Box>
        ) : tabValue === 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>ISBN</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Available</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBooks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No books found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.isbn}</TableCell>
                      <TableCell>{book.category}</TableCell>
                      <TableCell>
                        <Chip 
                          label={book.available_copies > 0 ? `${book.available_copies} copies` : 'Out of stock'} 
                          color={book.available_copies > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" disabled={book.available_copies === 0}>
                          Borrow
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Book</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Borrowed Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Fine (Br)</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBorrowings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No borrowings found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBorrowings.map((borrow) => (
                    <TableRow key={borrow.id}>
                      <TableCell>{borrow.book_title}</TableCell>
                      <TableCell>{borrow.borrower_name}</TableCell>
                      <TableCell>{dayjs(borrow.borrowed_date).format('MMM DD, YYYY')}</TableCell>
                      <TableCell>{dayjs(borrow.due_date).format('MMM DD, YYYY')}</TableCell>
                      <TableCell>
                        <Chip 
                          label={borrow.is_overdue && borrow.status === 'borrowed' ? 'overdue' : borrow.status} 
                          color={
                            borrow.status === 'returned' ? 'default' :
                            (borrow.status === 'overdue' || borrow.is_overdue) ? 'error' :
                            'primary'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {parseFloat(borrow.calculated_fine || borrow.fine_amount) > 0 ? (
                          <Typography color="error.main" fontWeight="bold">
                            Br {parseFloat(borrow.calculated_fine || borrow.fine_amount).toFixed(2)}
                          </Typography>
                        ) : (
                          <Typography color="text.secondary">
                            Br 0.00
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {borrow.status === 'borrowed' && !isStudent && (
                          <Button 
                            size="small" 
                            variant="outlined" 
                            onClick={() => handleReturnBook(borrow.id)}
                          >
                            Return
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DrogaCard>

      <BookBorrowForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchBorrowings}
        books={books}
      />
      <BookCreateForm
        open={createFormOpen}
        onClose={() => setCreateFormOpen(false)}
        onSuccess={fetchBooks}
      />
    </PageContainer>
  );
};

export default LibraryPage;
