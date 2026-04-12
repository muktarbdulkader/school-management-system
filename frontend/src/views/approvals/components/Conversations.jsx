import React, { useEffect, useState } from 'react';
import { Box, Grid, TablePagination, Typography, useTheme } from '@mui/material';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import Comment from './Comment';
import Fallbacks from 'utils/components/Fallbacks';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import CommentForm from './CommentForm';

const Conversations = ({ url, taskID, status }) => {
  const theme = useTheme();

  const [remarks, setRemarks] = useState({
    loading: true,
    error: false,
    data: [],
    page: 0,
    per_page: 5,
    total: 0
  });

  const [commenting, setCommenting] = useState({
    submitting: false
  });

  const handleChangePage = (event, newPage) => {
    setRemarks((prevState) => ({ ...prevState, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setRemarks((prevState) => ({ ...prevState, per_page: event.target.value, page: 0 }));
  };

  const handleGettingRemarks = async () => {
    setRemarks((prevState) => ({ ...prevState, loading: true }));
    const token = await GetToken();
    const Api = url + `?page=${remarks.page + 1}&per_page=${remarks.per_page}`;

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    fetch(Api, {
      method: 'GET',
      headers: header
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setRemarks((prevState) => ({ ...prevState, error: false, data: response?.data?.data, total: response?.data?.total }));
        } else {
          setRemarks((prevState) => ({ ...prevState, error: false }));
          toast.warning(response.data.message);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
        setRemarks((prevState) => ({ ...prevState, error: true }));
      })
      .finally(() => {
        setRemarks((prevState) => ({ ...prevState, loading: false }));
      });
  };

  const handleAppendingNewRemark = (newRemark) => {
    const existingRemarks = remarks.data;
    const newData = [newRemark, ...existingRemarks];
    setRemarks((prevState) => ({ ...prevState, data: newData }));
  };

  const handleCommenting = async (values) => {
    setCommenting((prev) => ({ ...prev, submitting: true }));
    const token = await GetToken();
    const Api = Backend.api + Backend.commentOnApprovalTask + taskID;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {
      comment: values.remark
    };

    fetch(Api, { method: 'POST', headers: header, body: JSON.stringify(data) })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response?.data?.message);
          handleAppendingNewRemark(response?.data?.workflow);
        } else {
          toast.error(response?.data?.message);
        }
      })
      .catch((error) => {
        toast.error(error?.message);
      })
      .finally(() => {
        setCommenting((prev) => ({ ...prev, submitting: false }));
      });
  };

  useEffect(() => {
    handleGettingRemarks();
  }, [remarks.page, remarks.per_page, status, url]);

  return (
    <React.Fragment>
      <Box sx={{ paddingRight: 2, minHeight: '50dvh' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 0.4,
            borderColor: theme.palette.divider,
            paddingBottom: 1.8
          }}
        >
          <Typography variant="h4">Conversations</Typography>
        </Box>
        {remarks?.loading ? (
          <Grid container sx={{ minHeight: 400 }}>
            <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
              <ActivityIndicator size={20} />
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ paddingTop: 2 }}>
            {status && status !== 'approved' && (
              <CommentForm handleSubmission={(values) => handleCommenting(values)} submitting={commenting.submitting} />
            )}
            {remarks?.data.length === 0 ? (
              <Fallbacks severity="conversation" title={``} description={`There is no conversation yet`} sx={{ paddingTop: 6 }} size={80} />
            ) : (
              <Box>
                {remarks?.data.map((item, index) => (
                  <Comment
                    key={index}
                    name={item.employee?.user?.name || item?.created_by}
                    profile={item.employee?.profile}
                    position={item.employee?.job_position?.name}
                    from={item.status_from}
                    to={item.status_to}
                    date_time={item.created_at}
                    user_comment={item.note}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {!remarks.loading && remarks.total > remarks.per_page && (
        <TablePagination
          component="div"
          rowsPerPageOptions={[]}
          count={remarks.total}
          rowsPerPage={remarks.per_page}
          page={remarks.page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Per page"
        />
      )}
    </React.Fragment>
  );
};

Conversations.propTypes = {
  taskID: PropTypes.string,
  status: PropTypes.string
};

export default Conversations;
