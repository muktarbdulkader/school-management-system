// material-ui
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import PropTypes from 'prop-types';

// ==============================|| PROFILE MENU - USER DEPARTMENT CARD ||============================== //

const DepartmentCard = ({ unit }) => {
  const navigate = useNavigate();
  const cardSX = {
    content: '""',
    position: 'absolute',
    width: 200,
    height: 200,
    borderColor: 'warning.main'
  };

  return (
    <Card
      sx={{
        bgcolor: 'grey.50',
        overflow: 'hidden',
        position: 'relative',
        '&:after': {
          border: '19px solid ',
          borderRadius: '50%',
          top: '65px',
          right: '-150px',
          ...cardSX
        },
        '&:before': {
          border: '3px solid ',
          borderRadius: '50%',
          top: '145px',
          right: '-70px',
          ...cardSX
        },
        borderRadius: 0
      }}
    >
      <CardContent sx={{ p: 1.6 }}>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <Typography variant="subtitle2" color={'text.primary'} sx={{ opacity: 0.6 }}>
              Your unit
            </Typography>
            {unit?.name && (
              <>
                <Typography variant="h4">{unit?.name}</Typography>
                <Typography variant="body2" color={'text.primary'} sx={{ opacity: 0.8, marginTop: 0.2 }}>
                  {unit?.unit_type?.name}
                </Typography>
              </>
            )}
          </Grid>
          <Grid item>
            <Typography variant="subtitle2" color={'text.primary'} sx={{ opacity: 0.6 }}>
              Parent unit
            </Typography>
            {unit?.parent?.name ? <Typography variant="h4">{unit?.parent?.name}</Typography> : 'No parent unit'}
          </Grid>
          {/* <Grid item>
            <DrogaButton
              title="View"
              sx={{ backgroundColor: 'grey.200', boxShadow: 'none' }}
              variant="text"
              onPress={() => navigate('/units/view', { state: unit })}
            />
          </Grid> */}
        </Grid>
      </CardContent>
    </Card>
  );
};

DepartmentCard.propTypes = {
  unit: PropTypes.object
};
export default DepartmentCard;
