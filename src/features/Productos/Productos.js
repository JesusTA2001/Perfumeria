import React, { useState } from 'react';
import {
	Box,
	Card,
	CardContent,
	CardMedia,
	Chip,
	Grid,
	InputAdornment,
	TextField,
	Typography,
	Grow,
} from '@mui/material';
import { Search, ErrorOutlined } from '@mui/icons-material';

function Productos({ products }) {
	const [searchTerm, setSearchTerm] = useState('');

	const filteredProducts = products.filter((product) =>
		product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		product.category.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const formatPrice = (price) => {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN',
		}).format(price);
	};

	const getStockStatus = (available, stock) => {
		if (!available) {
			return { label: 'Inactivo', color: 'error' };
		}
		if (stock === 0) {
			return { label: 'Agotado', color: 'error' };
		}
		if (stock < 10) {
			return { label: `Stock bajo: ${stock} pzs`, color: 'warning' };
		}
		return { label: `Disponible: ${stock} pzs`, color: 'success' };
	};

	return (
		<Box sx={{ py: 1 }}>
			{/* Buscador Superior */}
			<Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
				<TextField
					placeholder="Buscar perfume por nombre o categoría..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					fullWidth
					variant="outlined"
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<Search sx={{ color: 'text.secondary' }} />
							</InputAdornment>
						),
						sx: {
							backgroundColor: '#ffffff',
							borderRadius: 3,
							boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
							'& fieldset': {
								borderColor: 'rgba(15, 23, 42, 0.08)',
							},
							'&:hover fieldset': {
								borderColor: 'primary.main',
							},
							'&.Mui-focused fieldset': {
								borderColor: 'primary.main',
							},
						},
					}}
					sx={{ maxWidth: 600 }}
				/>
			</Box>

			{/* Grid de Productos */}
			{filteredProducts.length > 0 ? (
				<Grid container spacing={3}>
					{filteredProducts.map((product, index) => {
						const status = getStockStatus(product.available, product.stock);
						return (
							<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
								<Grow in={true} timeout={(index + 1) * 100}>
									<Card
										sx={{
											height: '100%',
											display: 'flex',
											flexDirection: 'column',
											borderRadius: 4,
											overflow: 'hidden',
											border: '1px solid rgba(15, 23, 42, 0.06)',
											boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
											transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
											backgroundColor: '#ffffff',
											'&:hover': {
												transform: 'translateY(-6px)',
												boxShadow: '0 12px 30px rgba(15, 23, 42, 0.09)',
												'& img': {
													transform: 'scale(1.06)',
												},
											},
										}}
									>
										{/* Contenedor de la Imagen */}
										<Box sx={{ position: 'relative', pt: '100%', overflow: 'hidden', backgroundColor: '#fafafa' }}>
											<CardMedia
												component="img"
												image={product.imageUrl || 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=400'}
												alt={product.name}
												sx={{
													position: 'absolute',
													top: 0,
													left: 0,
													width: '100%',
													height: '100%',
													objectFit: 'cover',
													transition: 'transform 0.5s ease',
												}}
											/>
											{/* Chip Categoría */}
											<Chip
												label={product.category}
												size="small"
												sx={{
													position: 'absolute',
													top: 12,
													left: 12,
													backgroundColor: 'rgba(255, 255, 255, 0.9)',
													backdropFilter: 'blur(4px)',
													fontWeight: 600,
													color: 'text.primary',
													border: '1px solid rgba(0,0,0,0.05)',
												}}
											/>
										</Box>

										<CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
											{/* Estado de Disponibilidad */}
											<Box sx={{ mb: 1 }}>
												<Chip
													label={status.label}
													color={status.color}
													size="small"
													sx={{
														fontWeight: 700,
														fontSize: '0.75rem',
														borderRadius: 1.5,
														height: 24,
													}}
												/>
											</Box>

											{/* Nombre */}
											<Typography
												variant="h6"
												component="h2"
												sx={{
													fontWeight: 800,
													fontSize: '1.05rem',
													lineHeight: 1.3,
													mb: 1,
													color: 'text.primary',
													display: '-webkit-box',
													WebkitLineClamp: 2,
													WebkitBoxOrient: 'vertical',
													overflow: 'hidden',
													height: '2.7em', // Mantener altura consistente
												}}
											>
												{product.name}
											</Typography>

											{/* Separador */}
											<Box sx={{ flexGrow: 1 }} />

											{/* Precio */}
											<Box
												sx={{
													display: 'flex',
													alignItems: 'baseline',
													justifyContent: 'space-between',
													mt: 1.5,
													pt: 1.5,
													borderTop: '1px solid rgba(15, 23, 42, 0.05)',
												}}
											>
												<Typography
													variant="body2"
													color="text.secondary"
													sx={{ fontWeight: 500 }}
												>
													Precio
												</Typography>
												<Typography
													variant="h6"
													color="primary.main"
													sx={{ fontWeight: 800, fontSize: '1.25rem' }}
												>
													{formatPrice(product.price)}
												</Typography>
											</Box>
										</CardContent>
									</Card>
								</Grow>
							</Grid>
						);
					})}
				</Grid>
			) : (
				/* Sin Resultados */
				<Box
					sx={{
						textAlign: 'center',
						py: 8,
						px: 2,
						backgroundColor: '#ffffff',
						borderRadius: 4,
						border: '1px solid rgba(15, 23, 42, 0.06)',
						boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)',
					}}
				>
					<ErrorOutlined sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
					<Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
						No se encontraron perfumes
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Prueba buscando con otros términos o crea un nuevo perfume en el Dashboard principal.
					</Typography>
				</Box>
			)}
		</Box>
	);
}

export default Productos;
