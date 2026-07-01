import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography } from '@mui/material';

function EliminarPerfume({ open, product, onClose, onConfirm }) {
	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
			<DialogTitle
				sx={{
					backgroundColor: 'primary.main',
					color: '#ffffff',
					fontWeight: 800,
					borderTopLeftRadius: 8,
					borderTopRightRadius: 8,
				}}
			>
				¿Eliminar producto?
			</DialogTitle>
			<DialogContent dividers>
				<Typography variant="body2" color="text.secondary">
					Esta acción no se puede deshacer.
				</Typography>
				{product ? (
					<Typography variant="body1" sx={{ mt: 1.5, fontWeight: 700 }}>
						{product.name}
					</Typography>
				) : null}
			</DialogContent>
			<DialogActions sx={{ p: 2 }}>
				<Button onClick={onClose} color="inherit">
					Cancelar
				</Button>
				<Button onClick={onConfirm} variant="contained" color="error">
					Eliminar
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default EliminarPerfume;
