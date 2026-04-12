import React from 'react';

export const oldCompoents = () => {
  return {
    /* <Grid container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 0.8, px: 2 }}>
        <Grid item xs={12}>
          <Grid container spacing={gridSpacing}>
            <Grid item xs={12} sm={12}>
              {!hideFilter && (
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 1.8 }}>
                  <Search value={task.search} onChange={(event) => handleSearchFieldChange(event)} />

                  <Box sx={{ marginLeft: 2 }}>
                    {task.picker ? (
                      <TextField
                        id="date"
                        name="date"
                        type="date"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              border: 'none'
                            }
                          },
                          ml: -2,
                          p: 0,
                          mt: -1
                        }}
                        value={task.date}
                        onChange={handleDateChange}
                      />
                    ) : (
                      <Typography
                        variant="body1"
                        onClick={() => handleTodayClick()}
                        sx={{ cursor: 'pointer', ':hover': { fontWeight: theme.typography.fontWeightMedium } }}
                      >
                        Today
                      </Typography>
                    )}
                  </Box>
                </Grid>
              )}
              <DrogaCard sx={{ backgroundColor: 'transparent', border: 0, p: 0 }}>
                {task.loading ? (
                  <Box sx={{ padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size={20} />
                  </Box>
                ) : task.taskList.length === 0 ? (
                  <Box sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <IconChecklist size={80} color={theme.palette.grey[400]} />
                    <Typography variant="h4" sx={{ marginTop: 1.6 }}>
                      No task planned today
                    </Typography>
                    <Typography variant="caption">The list of created task will be listed here</Typography>
                  </Box>
                ) : (
                  <Box>
                    {task.taskList?.map((item, index) => (
                      <DrogaCard
                        key={index}
                        sx={{
                          backgroundColor: theme.palette.grey[50],
                          marginTop: 1.6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 1
                        }}
                      >
                        <Box>
                          <Typography variant="body1">{item.plan?.kpi?.name}</Typography>
                          <Typography variant="h4" my={1}>
                            {item.title}
                          </Typography>

                          <Typography variant="subtitle2">{formatDate(item?.date).formattedDate}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <StatusMenu
                            name="status"
                            options={TaskStatus}
                            selected={item.status}
                            handleSelection={(event) => handleStatusChange(event, item)}
                          />
                          {task.deleting && selectedRow === item.id ? (
                            <ActivityIndicator size={16} />
                          ) : (
                            <IconButton onClick={() => handleDeleteTask(item.id)} title="remove">
                              <IconMinus size="1.2rem" stroke="1.6" color={theme.palette.error.main} />
                            </IconButton>
                          )}
                        </Box>
                      </DrogaCard>
                    ))}

                    {pagination.total > pagination.per_page && (
                      <TablePagination
                        component="div"
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        count={pagination.total}
                        rowsPerPage={pagination.per_page}
                        page={pagination.page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Tasks per page"
                      />
                    )}
                  </Box>
                )}
              </DrogaCard>
            </Grid>

            {/* {!hideChart && (
              <Grid item xs={12} sm={12} md={5} lg={4} xl={4}>
                <DrogaCard>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h4">Activities in Septemeber </Typography>

                    <Box>
                      <IconButton sx={{ marginRight: 2 }}>
                        <IconChevronLeft size="1.4rem" stroke="1.8" />
                      </IconButton>
                      <IconButton>
                        <IconChevronRight size="1.4rem" stroke="1.8" />
                      </IconButton>
                    </Box>
                  </Box>

                  <ActivityChart />
                </DrogaCard>
              </Grid>
            )}
 </Grid>
        </Grid>
      </Grid> */
  };
};
