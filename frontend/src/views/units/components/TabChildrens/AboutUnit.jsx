import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import UnitInfo from '../UnitInfo';
import ManagerInfo from '../ManagerInfo';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import Fallbacks from 'utils/components/Fallbacks';
import { toast } from 'react-toastify';
import { AssignManager } from '../AssignManager';

const AboutUnit = ({ id }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);

  const [open, setOpen] = useState(false);

  const handleOpenDialog = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleGettingUnitInfo = async () => {
    const token = await GetToken('token');
    const Api = Backend.api + Backend.units + '/' + id;
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
          setData(response.data);
          setLoading(false);
          setError(false);
        } else {
          setLoading(false);
          setError(false);
        }
      })
      .catch((error) => {
        toast(error.message);
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    handleGettingUnitInfo();
  }, [id]);

  return (
    <>
      <Grid container>
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {loading ? (
              <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 6 }}>
                <ActivityIndicator size={22} />
              </Grid>
            ) : error ? (
              <Fallbacks severity="error" title="Server error" description="There is error fetching unit infos" />
            ) : data.length === 0 ? (
              <Fallbacks severity="unit" title="Unable to fetch unit information" description="" sx={{ paddingTop: 6 }} />
            ) : (
              <>
                <Grid item xs={12}>
                  <UnitInfo unit={data} />
                </Grid>
                <Grid item xs={12}>
                  <ManagerInfo unit={data} changeManager={() => handleOpenDialog()} />
                </Grid>
              </>
            )}
          </Grid>
        </Grid>
      </Grid>

      {id && (
        <AssignManager
          open={open}
          handleDialogClose={() => handleClose()}
          unit_id={id}
          onRefresh={() => {
            handleClose();
            handleGettingUnitInfo();
          }}
        />
      )}
    </>
  );
};

AboutUnit.propTypes = {
  id: PropTypes.string
};

export default AboutUnit;
