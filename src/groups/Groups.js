import React, {useState} from 'react';
import {
  Box, Button, Container, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, Typography
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import {Layout} from '../layout';
import {api} from './api';
import {FotoboxTokenDialog} from './FotoboxTokenDialog';

export const Groups = () => {
  const {data: groups} = api.endpoints.getGroups.useQuery();
  const [tokenDialogGruppe, setTokenDialogGruppe] = useState(null);

  return (
    <Layout>
      <Container sx={{mt: 2}}>
        <Paper sx={{p: 2}}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Gruppen
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Erstellt</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups && groups.map(gruppe => (
                <TableRow key={gruppe.id}>
                  <TableCell>{gruppe.name}</TableCell>
                  <TableCell>
                    {gruppe.createdAt ? new Date(gruppe.createdAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1}}>
                      <Button
                        size="small"
                        startIcon={<CameraAltIcon />}
                        onClick={() => setTokenDialogGruppe(gruppe)}
                      >
                        Fotobox-Token
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Container>

      {tokenDialogGruppe && (
        <FotoboxTokenDialog
          gruppe={tokenDialogGruppe}
          onClose={() => setTokenDialogGruppe(null)}
        />
      )}
    </Layout>
  );
};
