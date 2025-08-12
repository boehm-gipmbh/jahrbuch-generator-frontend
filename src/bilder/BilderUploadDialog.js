import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
  Typography
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import { api as bilderApi } from './api';

// In der Bilder-Komponente einbauen
export const BilderUploadDialog = () => {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [uploadBild] = bilderApi.endpoints.uploadBild.useMutation();

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title);
    formData.append('description', description);

    try {
      await uploadBild(formData).unwrap();
      setOpen(false);
      setSelectedFile(null);
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Upload fehlgeschlagen:', error);
    }
  };

  return (
    <>
      <Button startIcon={<UploadIcon />} onClick={() => setOpen(true)}>
        Bild hochladen
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bild hochladen</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Button
              variant="outlined"
              component="label"
            >
              Datei auswählen
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </Button>

            {selectedFile && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Ausgewählt: {selectedFile.name}
                </Typography>
                {selectedFile.type.startsWith('image/') && (
                  <Box sx={{ mt: 1 }}>
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Vorschau"
                      style={{ maxWidth: '100%', maxHeight: 200 }}
                    />
                  </Box>
                )}
              </Box>
            )}

            <TextField
              label="Titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
            />

            <TextField
              label="Beschreibung"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile}
          >
            Hochladen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};