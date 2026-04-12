import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  Box,
  Divider,
  Typography,
  Skeleton,
} from '@mui/material';

export default function TimelineCardSkeleton() {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
      <CardHeader
        title={
          <Skeleton
            variant="text"
            width={200}
            height={32}
            sx={{ borderRadius: 1 }}
          />
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 2 }}>
        <List disablePadding>
          {/* Render 3-4 skeleton items to mimic typical schedule data */}
          {[1, 2, 3, 4].map((item) => (
            <ListItem
              key={item}
              sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, px: 0 }}
            >
              {/* Timeline indicator skeleton */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mr: 2,
                }}
              >
                <Skeleton variant="circular" width={10} height={10} />
                {item !== 4 && (
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{
                      height: 90,
                      borderStyle: 'dashed',
                    }}
                  />
                )}
              </Box>

              {/* Card content skeleton */}
              <Card
                variant="outlined"
                sx={{
                  flexGrow: 1,
                  borderRadius: 2,
                  p: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: '#E0E0E0',
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    width: '100%',
                  }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    {/* Time skeleton */}
                    <Skeleton
                      variant="text"
                      width={150}
                      height={20}
                      sx={{ mb: 1 }}
                    />
                    {/* Period and subject skeleton */}
                    <Skeleton
                      variant="text"
                      width="80%"
                      height={24}
                      sx={{ mb: 0.5 }}
                    />
                    {/* Location skeleton */}
                    <Skeleton variant="text" width={120} height={20} />
                  </Box>
                  {/* Status chip skeleton */}
                  <Skeleton
                    variant="rounded"
                    width={80}
                    height={24}
                    sx={{ ml: 1, borderRadius: 12 }}
                  />
                </Box>

                {/* Buttons skeleton */}
                <Box
                  sx={{
                    p: 2,
                    pt: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* View Details button skeleton */}
                    <Skeleton
                      variant="rounded"
                      width={100}
                      height={32}
                      sx={{ borderRadius: 1 }}
                    />
                    {/* View Class Unit button skeleton */}
                    <Skeleton
                      variant="rounded"
                      width={120}
                      height={32}
                      sx={{ borderRadius: 1 }}
                    />
                  </Box>
                  {/* Main action button skeleton */}
                  <Skeleton
                    variant="rounded"
                    width={140}
                    height={32}
                    sx={{ borderRadius: 1 }}
                  />
                </Box>
              </Card>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
