import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import { Box, Typography, useTheme, Card, CardContent, IconButton, Stack, Button, CircularProgress } from '@mui/material';
import {
  IconBook, IconUsers, IconAlertCircle, IconBookmarks, IconPlus, IconArrowRight
} from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import { gridSpacing } from 'store/constant';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import { toast } from 'react-toastify';

const LibrarianDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [borrowings, setBorrowings] = useState([]);
  
  const [stats, setStats] = useState({
    total_books: 0,
    active_borrowings: 0,
    overdue_books: 0,
    unique_borrowers: 0
  });

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const fetchLibraryData = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      
      // Fetch Books
      const booksRes = await fetch(`${Backend.api}${Backend.libraryBooks}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const booksData = await booksRes.json();
      const allBooks = booksData.data || [];
      
      // Fetch Borrowings
      const borrowsRes = await fetch(`${Backend.api}${Backend.libraryBorrowings}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const borrowsData = await borrowsRes.json();
      const allBorrowings = borrowsData.data || [];

      setBooks(allBooks);
      setBorrowings(allBorrowings);
      
      const activeB = allBorrowings.filter(b => b.status === "borrowed");
      const overdueB = activeB.filter(b => new Date(b.due_date) < new Date());
      const uniqueUsers = new Set(activeB.map(b => b.borrower)).size;

      setStats({
        total_books: allBooks.length,
        active_borrowings: activeB.length,
        overdue_books: overdueB.length,
        unique_borrowers: uniqueUsers,
      });

    } catch (error) {
      console.error('Error fetching library data:', error);
      toast.error('Failed to load library dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <DrogaCard>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <ActivityIndicator size={20} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              sx={{
                backgroundColor: color,
                padding: 1,
                ':hover': { backgroundColor: color },
              }}
            >
              <Icon size="1.4rem" stroke="1.8" color="white" />
            </IconButton>
            <Box sx={{ marginLeft: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h3" color={color}>
                  {value}
                </Typography>
              </Box>
              <Typography variant="subtitle1" color={theme.palette.text.primary}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </DrogaCard>
  );

  return (
    <PageContainer title="Librarian Dashboard">
      <Grid container spacing={gridSpacing} mt={1}>
        {/* Welcome Message */}
        <Grid item xs={12}>
          <DrogaCard>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h3" gutterBottom color={theme.palette.primary.main}>
                Library Management Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Command Center for Library Monitoring, Cataloging, and Transactions
              </Typography>
            </Box>
          </DrogaCard>
        </Grid>

        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Catalog"
            value={stats.total_books}
            icon={IconBook}
            color={theme.palette.primary.main}
            subtitle="Unique Books Registered"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Borrowers"
            value={stats.unique_borrowers}
            icon={IconUsers}
            color={theme.palette.success.main}
            subtitle="Students Currently Renting"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Checked Out Books"
            value={stats.active_borrowings}
            icon={IconBookmarks}
            color={theme.palette.warning.main}
            subtitle="Books Currently Borrowed"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Returns"
            value={stats.overdue_books}
            icon={IconAlertCircle}
            color={theme.palette.error.main}
            subtitle="Past Deadline Returns"
          />
        </Grid>

        {/* Active Transactions */}
        <Grid item xs={12} md={6}>
          <DrogaCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4">Latest Checkout Transactions</Typography>
              <IconButton onClick={() => navigate('/library')}>
                <IconArrowRight />
              </IconButton>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <ActivityIndicator size={24} />
              </Box>
            ) : borrowings.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No active borrowings
              </Typography>
            ) : (
              <Box>
                {borrowings.slice(0, 5).map((borrow, index) => (
                  <Card key={index} sx={{ mb: 1, bgcolor: theme.palette.background.default }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {borrow.book_title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Issued to: {borrow.borrower_name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color={borrow.status === 'borrowed' ? 'warning.main' : 'success.main'} sx={{ fontWeight: 'bold' }}>
                          {borrow.status.toUpperCase()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </DrogaCard>
        </Grid>

        {/* Recently Added Books */}
        <Grid item xs={12} md={6}>
          <DrogaCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4">Newest Catalog Additions</Typography>
              <IconButton onClick={() => navigate('/library')}>
                <IconPlus />
              </IconButton>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <ActivityIndicator size={24} />
              </Box>
            ) : books.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No books added yet
              </Typography>
            ) : (
              <Box>
                {books.slice(0, 5).map((book, index) => (
                  <Card key={index} sx={{ mb: 1, bgcolor: theme.palette.background.default }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {book.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Author: {book.author} | Copies: {book.available_copies} / {book.total_copies}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </DrogaCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default LibrarianDashboard;
