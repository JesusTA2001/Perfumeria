import { useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Container,
	IconButton,
	InputAdornment,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';

function Loing({ onLogin, onBackToStore }) {
	const [usuario, setUsuario] = useState('');
	const [contrasena, setContrasena] = useState('');
	const [mostrarContrasena, setMostrarContrasena] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (event) => {
		event.preventDefault();

		if (!usuario || !contrasena) {
			setError('Por favor ingrese usuario y contraseña.');
			return;
		}

		try {
			setError('');
			const apiBaseUrl = process.env.REACT_APP_API_URL || '/api';
			const response = await fetch(`${apiBaseUrl}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ usuario, contrasena }),
			});
			
			const data = await response.json();
			
			if (response.ok && data.ok) {
				onLogin(data.user);
			} else {
				setError(data.message || 'Usuario o contraseña incorrectos.');
			}
		} catch (err) {
			setError('Error de conexión con el servidor.');
		}
	};

	return (
		<Box
			sx={{
				minHeight: '100vh',
				background: 'linear-gradient(135deg, #0a0a0a 0%, #111111 45%, #1a1a1a 100%)',
				display: 'flex',
				alignItems: 'center',
				py: 4,
			}}
		>
			<Container maxWidth="sm">
				<Paper
					elevation={0}
					sx={{
						p: { xs: 3, sm: 4 },
						borderRadius: 4,
						backgroundColor: '#ffffff',
						border: '1px solid rgba(255,255,255,0.08)',
						boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
					}}
				>
					<Stack spacing={3}>
						<Box sx={{ textAlign: 'center' }}>
							<Box
								sx={{
									width: 72,
									height: 72,
									borderRadius: '50%',
									mx: 'auto',
									mb: 2,
									background: 'linear-gradient(135deg, #111111 0%, #3a3a3a 100%)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: '#ffffff',
									boxShadow: '0 14px 30px rgba(0,0,0,0.18)',
								}}
							>
								<LockOutlined />
							</Box>
							<Typography variant="h4" sx={{ fontWeight: 900, color: '#111111' }}>
								Perfumeria HG
							</Typography>
							<Typography variant="body2" sx={{ color: '#4b5563', mt: 1 }}>
								Acceso al panel administrativo
							</Typography>
							{onBackToStore && (
								<Button
									variant="text"
									onClick={onBackToStore}
									sx={{ textTransform: 'none', color: '#C9A84C', mt: 1, fontWeight: 700, '&:hover': { color: '#b0923d' } }}
								>
									← Volver a la tienda
								</Button>
							)}
						</Box>

						<Box component="form" onSubmit={handleSubmit}>
							<Stack spacing={2.2}>
								<TextField
									label="Usuario"
									value={usuario}
									onChange={(event) => setUsuario(event.target.value)}
									fullWidth
									required
									slotProps={{ inputLabel: { sx: { color: '#4b5563' } } }}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: '#fafafa',
											'& fieldset': { borderColor: '#d1d5db' },
											'&:hover fieldset': { borderColor: '#111111' },
											'&.Mui-focused fieldset': { borderColor: '#111111' },
										},
									}}
								/>

								<TextField
									label="Contraseña"
									type={mostrarContrasena ? 'text' : 'password'}
									value={contrasena}
									onChange={(event) => setContrasena(event.target.value)}
									fullWidth
									required
									slotProps={{
										inputLabel: { sx: { color: '#4b5563' } },
										input: {
											endAdornment: (
												<InputAdornment position="end">
													<IconButton onClick={() => setMostrarContrasena((currentValue) => !currentValue)} edge="end" aria-label="Mostrar contraseña">
														{mostrarContrasena ? <VisibilityOff /> : <Visibility />}
													</IconButton>
												</InputAdornment>
											),
										}
									}}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: '#fafafa',
											'& fieldset': { borderColor: '#d1d5db' },
											'&:hover fieldset': { borderColor: '#111111' },
											'&.Mui-focused fieldset': { borderColor: '#111111' },
										},
									}}
								/>

								{error ? <Alert severity="error">{error}</Alert> : null}

								<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
									<Button
										type="submit"
										variant="contained"
										sx={{
											backgroundColor: '#111111',
											px: 4,
											py: 1.2,
											borderRadius: 999,
											'&:hover': { backgroundColor: '#000000' },
										}}
									>
										Iniciar sesión
									</Button>
								</Box>
							</Stack>
						</Box>
					</Stack>
				</Paper>
			</Container>
		</Box>
	);
}

export default Loing;
