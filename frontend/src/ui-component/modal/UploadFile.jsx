import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Stack, useTheme, Typography, Box } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { IconFileCheck, IconFileUpload, IconX } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import CloseIcon from '@mui/icons-material/Close';
import LinearProgress from 'ui-component/indicators/LinearProgress';

const UploadFile = ({ open, onClose, onUpload, uploadProgress, onRemove, templateUrl }) => {
  const theme = useTheme();
  const [file, setFile] = useState(null);

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: '.xls,.xlsx,.csv',
    multiple: false
  });

  const handleRemoveFile = () => {
    setFile(null);
    onRemove();
  };

  const handleUpload = () => {
    if (file) {
      onUpload(file);
    } else {
      toast.error('There is an issue uploading the file');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="upload-dialog-title" sx={{ backdropFilter: theme.backdropFilter }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ paddingRight: 1, my: 0.5, minWidth: { xl: '500px', lg: '500px', md: 400, sm: '80%' } }}
      >
        <DialogTitle
          id="upload-dialog-title"
          variant="h3"
          color={theme.palette.text.primary}
          fontWeight={theme.typography.fontWeightMedium}
        >
          Upload File
        </DialogTitle>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <DialogContent>
        {file ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 2.4,
              border: `0.8px solid ${theme.palette.divider}`,
              textAlign: 'center',
              cursor: 'pointer',
              borderRadius: theme.shape.borderRadius,
              backgroundColor: theme.palette.primary.light
            }}
          >
            <Box {...getRootProps()} sx={{ display: 'flex', alignItems: 'center' }}>
              <input {...getInputProps()} />

              <IconFileCheck stroke={1.6} size="1.8rem" color={theme.palette.success.dark} />

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: 2.4 }}>
                <Typography variant="h4" textAlign="left" fontWeight={theme.typography.fontWeightMedium} color={theme.palette.text.primary}>
                  {file.name}
                </Typography>
              </Box>
            </Box>
            <IconButton sx={{ zIndex: 2 }} onClick={handleRemoveFile}>
              <IconX size={20} />
            </IconButton>
          </Box>
        ) : (
          <Box
            {...getRootProps()}
            sx={{
              border: `1px dashed ${theme.palette.divider}`,
              padding: 2,
              textAlign: 'center',
              cursor: 'pointer',
              borderRadius: theme.shape.borderRadius,
              backgroundColor: isDragActive ? theme.palette.primary.light : theme.palette.background.default
            }}
          >
            <input {...getInputProps()} />

            <Box sx={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', padding: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  boxShadow: 1,
                  padding: 1
                }}
              >
                <IconFileUpload stroke={1.6} size="1.4rem" color={theme.palette.success.dark} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: 2.4 }}>
                <Typography variant="h4" textAlign="left" fontWeight={theme.typography.fontWeightMedium} color={theme.palette.text.primary}>
                  Click to upload or drag & drop the excel file{' '}
                </Typography>
                <Typography variant="subtitle1" fontWeight={theme.typography.fontWeightRegular} color={theme.palette.text.disabled}>
                  Max 10 MB
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
        {file && uploadProgress > 0 && <LinearProgress value={uploadProgress} sx={{ paddingRight: 2 }} />}
        <a href={templateUrl} download style={{ marginRight: 4, paddingX: 2, textDecoration: 'none' }}>
          Download Template
        </a>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          sx={{ marginRight: 2, paddingX: 2 }}
          disabled={!file || uploadProgress > 0}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadFile;
