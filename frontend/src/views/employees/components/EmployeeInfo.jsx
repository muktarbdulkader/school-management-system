import React, { useState } from 'react';
import EmployeeDetail from 'views/approvals/components/EmployeeDetail';

const EmployeeInfo = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState();
  
  return <EmployeeDetail loading={false} employee={[]} />;
};

export default EmployeeInfo;
