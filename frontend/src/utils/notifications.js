
const handleGettingNotifications = async () => {
  setLoading(true);
  const token = await GetToken();
  const Api = Backend.api + Backend.getApprovalTasks + `?page=${pagination.page}&per_page=${pagination.per_page}&status=${filter.status}`;

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
        setData(response.data?.data);
        setPagination({ ...pagination, total: response.data.total });
        setError(false);
      }
    })
    .catch((error) => {
      toast.warning(error.message);
      setError(true);
    })
    .finally(() => {
      setLoading(false);
    });
};
