import { useEffect, useState } from 'react';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	Grid,
	MenuItem,
	Stack,
	Switch,
	TextField,
	Typography,
} from '@mui/material';
import { CloudUploadOutlined } from '@mui/icons-material';

const defaultForm = {
	name: '',
	descripcion: '',
	category: 'Floral',
	mililitros: '',
	price: '',
	stock: '',
	imageUrl: '',
	available: true,
};

function CrearPerfume({ open, onClose, onCreate, categories }) {
	const [formState, setFormState] = useState(defaultForm);

	useEffect(() => {
		if (open) {
			setFormState(defaultForm);
		}
	}, [open]);

	const handleImageFileChange = (event) => {
		const file = event.target.files?.[0];

		if (!file) {
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			setFormState((currentState) => ({
				...currentState,
				imageUrl: typeof reader.result === 'string' ? reader.result : '',
			}));
		};
		reader.readAsDataURL(file);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		const payload = {
			name: formState.name.trim(),
			descripcion: formState.descripcion.trim(),
			category: formState.category,
			mililitros: Number(formState.mililitros),
			price: Number(formState.price),
			stock: Number(formState.stock),
			imageUrl: formState.imageUrl,
			available: formState.available,
		};

		if (!payload.name || Number.isNaN(payload.price) || Number.isNaN(payload.stock) || !payload.imageUrl || !payload.mililitros) {
			return;
		}

		const success = await onCreate(payload);

		if (success) {
			onClose();
		}
	};

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
			<DialogTitle
				sx={{
					backgroundColor: 'primary.main',
					color: '#ffffff',
					fontWeight: 800,
					borderTopLeftRadius: 8,
					borderTopRightRadius: 8,
				}}
			>
				Agregar perfume
			</DialogTitle>
			<Box component="form" onSubmit={handleSubmit}>
				<DialogContent dividers>
					<Stack spacing={2}>
						<Box>
							<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>
								Imagen del perfume
							</Typography>
							<Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
								<Box
									sx={{
										width: 72,
										height: 72,
										borderRadius: 2,
										border: '1px dashed rgba(15, 23, 42, 0.18)',
										backgroundColor: '#f8fafc',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										overflow: 'hidden',
									}}
								>
									{formState.imageUrl ? (
										<Box
											component="img"
											src={formState.imageUrl}
											alt="Vista previa del perfume"
											sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
										/>
									) : (
										<Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', px: 1 }}>
											Sin imagen
										</Typography>
									)}
								</Box>
								<Button component="label" variant="outlined" startIcon={<CloudUploadOutlined />}>
									Subir imagen
									<input hidden accept="image/*" type="file" onChange={handleImageFileChange} />
								</Button>
							</Stack>
							<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
								Selecciona una imagen desde tu dispositivo.
							</Typography>
						</Box>

						<TextField
							label="Nombre"
							value={formState.name}
							onChange={(event) => setFormState((currentState) => ({ ...currentState, name: event.target.value }))}
							fullWidth
							required
						/>
						<TextField
							label="Descripción"
							value={formState.descripcion}
							onChange={(event) => setFormState((currentState) => ({ ...currentState, descripcion: event.target.value }))}
							fullWidth
							multiline
							rows={2}
							placeholder="Describe el aroma, notas o características del perfume..."
						/>
						<TextField
							select
							label="Categoría"
							value={formState.category}
							onChange={(event) => setFormState((currentState) => ({ ...currentState, category: event.target.value }))}
							fullWidth
						>
							{categories.map((category) => (
								<MenuItem key={category} value={category}>
									{category}
								</MenuItem>
							))}
						</TextField>
						<Grid container spacing={2}>
							<Grid size={{ xs: 12, sm: 4 }}>
								<TextField
									label="Mililitros (ml)"
									type="number"
									value={formState.mililitros}
									onChange={(event) => setFormState((currentState) => ({ ...currentState, mililitros: event.target.value }))}
									fullWidth
									required
									placeholder="Ej. 100"
									slotProps={{ htmlInput: { min: 1, step: 1 } }}
								/>
							</Grid>
							<Grid size={{ xs: 12, sm: 4 }}>
								<TextField
									label="Precio (MXN)"
									type="number"
									value={formState.price}
									onChange={(event) => setFormState((currentState) => ({ ...currentState, price: event.target.value }))}
									fullWidth
									required
									slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
								/>
							</Grid>
							<Grid size={{ xs: 12, sm: 4 }}>
								<TextField
									label="Stock"
									type="number"
									value={formState.stock}
									onChange={(event) => setFormState((currentState) => ({ ...currentState, stock: event.target.value }))}
									fullWidth
									required
									slotProps={{ htmlInput: { min: 0, step: 1 } }}
								/>
							</Grid>
						</Grid>
						<FormControlLabel
							control={
								<Switch
									checked={formState.available}
									onChange={(event) => setFormState((currentState) => ({ ...currentState, available: event.target.checked }))}
								/>
							}
							label="Disponible"
						/>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button onClick={onClose} color="inherit">
						Cancelar
					</Button>
					<Button type="submit" variant="contained">
						Guardar
					</Button>
				</DialogActions>
			</Box>
		</Dialog>
	);
}

export default CrearPerfume;
