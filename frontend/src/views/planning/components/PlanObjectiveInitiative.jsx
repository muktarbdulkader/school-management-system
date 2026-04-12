import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Collapse, IconButton, Typography, useTheme } from '@mui/material';
import { a11yProps } from 'utils/function';
import { AntTabs } from 'ui-component/tabs/AntTabs';
import { AntTab } from 'ui-component/tabs/AntTab';
import { IconPencil, IconTextWrap } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import TabPanel from 'ui-component/tabs/TabPanel';
import ReactQuill from 'react-quill';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const toolbarOptions = [
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
  ['clean'],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
];

const PlanObjectiveInitiative = ({
  plan_id,
  risk,
  initiative,
  editInitiative,
}) => {
  const theme = useTheme();
  const [expand, setExpand] = useState(true);
  const [value, setValue] = useState(0);
  const [initiatives, setInitiatives] = useState(initiative ? initiative : '');
  const [risks, setRisks] = useState(risk ? risk : '');
  const [submitting, setSubmitting] = useState(false);
  const [edit, setEdit] = useState(false);
  const [editRisk, setEditRisk] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(false);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    if (newValue === value && expand) {
      setExpand(false);
    }
    setExpand(true);
  };

  const handleInitiativeSubmission = async () => {
    setSubmitting(true);
    const token = await GetToken('token');
    const Api = Backend.api + Backend.planInitiative + plan_id;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      initiative: initiatives,
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.data.message);
          setInitiatives(initiatives);
          setEdit(false);
          setReloadTrigger((prev) => !prev); // Toggle reloadTrigger
        } else {
          toast.error(response.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };
  const handleRiskSubmission = async () => {
    setSubmitting(true);
    const token = await GetToken('token');
    const Api = `${Backend.api}${Backend.risk}/${plan_id}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      risk: risks,
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.data.message);
          setRisks(risks);
          setEditRisk(false);
          setReloadTrigger((prev) => !prev); // Toggle reloadTrigger
        } else {
          toast.error(response.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <>
      <AntTabs
        value={value}
        onChange={handleChange}
        aria-label="plan card tabs"
        theme={theme}
      >
        {['Initiative', 'Risk'].map((tab, index) => (
          <AntTab
            key={index}
            label={tab}
            iconPosition="start"
            {...a11yProps(index)}
          />
        ))}
      </AntTabs>

      <Collapse in={expand}>
        <TabPanel value={value} index={1} dir={theme.direction}>
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.6,
              }}
            >
              <Typography variant="body1" color={theme.palette.text.primary}>
                The risk to make the job done
              </Typography>

              {risk && (
                <IconButton onClick={() => setEditRisk((prev) => !prev)}>
                  {editRisk ? (
                    <IconTextWrap size="1.2rem" stroke="1.6" />
                  ) : (
                    <IconPencil size="1.2rem" stroke="1.6" />
                  )}
                </IconButton>
              )}
            </Box>

            {editRisk ? (
              <React.Fragment>
                <ReactQuill
                  theme="snow"
                  value={risks}
                  onChange={setRisks}
                  style={{ border: 'none' }}
                  modules={{
                    toolbar: toolbarOptions,
                  }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator size={18} sx={{ mt: 1.6, px: 4 }} />
                  ) : (
                    <DrogaButton
                      title={'Save'}
                      variant="text"
                      sx={{ mt: 1.6, px: 4 }}
                      onPress={() => handleRiskSubmission()}
                    />
                  )}
                </Box>
              </React.Fragment>
            ) : (
              <React.Fragment>
                {risk ? (
                  <div
                    style={{ lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ __html: risk }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      py: 4,
                    }}
                  >
                    <Typography variant="h4" mb={1}>
                      The risk is not added
                    </Typography>
                    <Typography variant="body2">
                      {' '}
                      After the risk added, it will shown here{' '}
                    </Typography>
                  </Box>
                )}
              </React.Fragment>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={value} index={0} dir={theme.direction}>
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.6,
              }}
            >
              <Typography variant="body1" color={theme.palette.text.primary}>
                The initiatives to get the job done
              </Typography>

              {editInitiative && (
                <IconButton onClick={() => setEdit((prev) => !prev)}>
                  {edit ? (
                    <IconTextWrap size="1.2rem" stroke="1.6" />
                  ) : (
                    <IconPencil size="1.2rem" stroke="1.6" />
                  )}
                </IconButton>
              )}
            </Box>

            {edit ? (
              <React.Fragment>
                <ReactQuill
                  theme="snow"
                  value={initiatives}
                  onChange={setInitiatives}
                  style={{ border: 'none' }}
                  modules={{
                    toolbar: toolbarOptions,
                  }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator size={18} sx={{ mt: 1.6, px: 4 }} />
                  ) : (
                    <DrogaButton
                      title={'Save'}
                      variant="text"
                      sx={{ mt: 1.6, px: 4 }}
                      onPress={() => handleInitiativeSubmission()}
                    />
                  )}
                </Box>
              </React.Fragment>
            ) : (
              <React.Fragment>
                {initiative ? (
                  <div
                    style={{ lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ __html: initiatives }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      py: 4,
                    }}
                  >
                    <Typography variant="h4" mb={1}>
                      The initiative is not added
                    </Typography>
                    <Typography variant="body2">
                      {' '}
                      After the initiative added, it will shown here{' '}
                    </Typography>
                  </Box>
                )}
              </React.Fragment>
            )}
          </Box>
        </TabPanel>
      </Collapse>
    </>
  );
};

PlanObjectiveInitiative.propTypes = {
  plan_id: PropTypes.string,
  risk: PropTypes.bool,
  editInitiative: PropTypes.bool,
  objective: PropTypes.any,
  initiative: PropTypes.any,
};
export default PlanObjectiveInitiative;
