import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material';

const apiBaseUrl = process.env.REACT_APP_API_URL || '/api';

function CambiarContraseña({ open, onClose, loggedUser }) {
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNuevaContrasena('');
      setConfirmarContrasena('');
      setError('');
      setSuccess('');
    }
  }, [open]);

  const passwordsMatch = nuevaContrasena && confirmarContrasena && nuevaContrasena === confirmarContrasena;
  const passwordsDontMatch = nuevaContrasena && confirmarContrasena && nuevaContrasena !== confirmarContrasena;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwordsMatch) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/auth/cambiar-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: loggedUser.nombre,
          nuevaContrasena
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setSuccess('¡Contraseña actualizada correctamente!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Error al cambiar la contraseña.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Cambiar Contraseña</DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Usuario (No editable)
              </Typography>
              <TextField
                fullWidth
                disabled
                value={loggedUser?.nombre || ''}
                size="small"
              />
            </Box>

            <Box>
              <TextField
                label="Nueva contraseña"
                type="password"
                fullWidth
                required
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
              />
            </Box>

            <Box>
              <TextField
                label="Confirmar nueva contraseña"
                type="password"
                fullWidth
                required
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                error={passwordsDontMatch}
                helperText={passwordsDontMatch ? 'Las contraseñas no coinciden' : ''}
              />
            </Box>

            {passwordsMatch && !success && (
              <Alert severity="success">
                La contraseña es correcta y coincide
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1.5 }}>
          <Button onClick={onClose} color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!passwordsMatch || isSubmitting}
            sx={{ backgroundColor: '#111111', '&:hover': { backgroundColor: '#000000' } }}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CambiarContraseña;
