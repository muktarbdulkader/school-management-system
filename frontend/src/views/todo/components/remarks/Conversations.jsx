import React, { useEffect, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import Comment from './Comment';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import CommentForm from './CommentForm';

const Conversations = ({ task }) => {
  const [remarks, setRemarks] = useState({
    loading: false,
    error: false,
    data: [],
  });

  const [commenting, setCommenting] = useState(false);

  const handleAppendingNewRemark = (newRemark) => {
    const existingRemarks = remarks.data;
    const newData = [newRemark, ...existingRemarks];
    setRemarks((prevState) => ({ ...prevState, data: newData }));
  };

  const handleCommenting = async (values) => {
    setCommenting(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.employeeTaskRemark + task?.id;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      remark: values.remark,
    };

    fetch(Api, { method: 'POST', headers: header, body: JSON.stringify(data) })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response?.data?.message);
          handleAppendingNewRemark(response?.data?.remark);
        } else {
          toast.error(response?.data?.message);
        }
      })
      .catch((error) => {
        toast.error(error?.message);
      })
      .finally(() => {
        setCommenting(false);
      });
  };

  useEffect(() => {
    setRemarks((prevState) => ({ ...prevState, data: task?.remarks }));
  }, [task?.remarks]);

  return (
    <React.Fragment>
      <Box>
        {remarks?.loading ? (
          <Grid container sx={{ minHeight: 400 }}>
            <Grid
              item
              xs={12}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
              }}
            >
              <ActivityIndicator size={20} />
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ paddingTop: 2 }}>
            <CommentForm
              handleSubmission={(values) => handleCommenting(values)}
              submitting={commenting}
            />

            {remarks?.data.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {remarks?.data.map((item, index) => (
                  <Comment
                    key={index}
                    name={item.employee?.user?.name}
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
    </React.Fragment>
  );
};

Conversations.propTypes = {
  taskID: PropTypes.string,
  task: PropTypes.shape({
    remarks: PropTypes.array,
    id: PropTypes.string,
  }),
};

export default Conversations;
