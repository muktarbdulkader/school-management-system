import React, { useEffect, useState } from 'react';
import { Box, Chip } from '@mui/material';

// export const PeriodTabs = ({ periodOptions, onTabChange }) => {
//   const [activeTab, setActiveTab] = useState(periodOptions[0].value);

//   const handleTabChange = (tabValue) => {
//     setActiveTab(tabValue);
//     onTabChange(tabValue);
//   };

//   return (
//     <Box display="flex" gap={1}>
//       {periodOptions.map((period) => (
//         <Chip
//           key={period.value}
//           label={period.name}
//           onClick={() => handleTabChange(period.value)}
//           color={activeTab === period.value ? 'primary' : 'default'}
//           variant={activeTab === period.value ? 'filled' : 'outlined'}
//         />
//       ))}
//     </Box>
//   );
// };

export const PeriodTabs = ({
  periodOptions,
  onTabChange,
  initialValue = 0,
}) => {
  const [selectedValue, setSelectedValue] = useState(initialValue);

  useEffect(() => {
    setSelectedValue(initialValue);
  }, [initialValue]);

  const handleClick = (newValue) => {
    setSelectedValue(newValue);
    onTabChange(newValue);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {periodOptions?.map((option, index) => (
        <Chip
          key={index}
          label={option.name}
          onClick={() => handleClick(option.value)}
          color={selectedValue === option.value ? 'primary' : 'default'}
          variant={selectedValue === option.value ? 'filled' : 'outlined'}
        />
      ))}
    </Box>
  );
};
