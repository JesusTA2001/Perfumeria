import { useEffect, useRef, useState } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	CardMedia,
	Chip,
	Container,
	Dialog,
	DialogContent,
	Divider,
	IconButton,
	InputAdornment,
	Stack,
	TextField,
	Typography,
	Badge,
	Alert,
	Grid,
} from '@mui/material';
import {
	ArrowBackIosNew,
	ArrowForwardIos,
	Close,
	LockOutlined,
	Search,
	ShoppingBagOutlined,
} from '@mui/icons-material';
import Carrito from '../features/Carrito/Carrito';

export default function DashboardUsuarios({ onNavigateToLogin }) {
	const [products, setProducts] = useState([]);
	const [apiError, setApiError] = useState('');
	
	// Carrito
	const [cartItems, setCartItems] = useState([]);
	const [cartOpen, setCartOpen] = useState(false);

	const carouselRefs = {
		current: {},
	};

	const normalizeProduct = (product) => ({
		...product,
		name: String(product.name || '').trim(),
		category: String(product.category || '').trim(),
		price: Number(product.price || 0),
		stock: Number(product.stock || 0),
		available: product.available === true || product.available === 1 || product.available === '1',
		mililitros: Number(product.mililitros || 100),
	});

	const categories = Array.from(
		new Set(
			products
				.map((product) => String(product.category || '').trim())
				.filter(Boolean)
		)
	);

	const categoriesToRender = categories.length > 0 ? categories : ['Hombre', 'Mujer', 'Unisex'];

	// Cargar Perfumes de la API
	const loadPerfumes = async () => {
		try {
			const response = await fetch('/api/perfumes');
			if (!response.ok) {
				throw new Error('No se pudo establecer conexión con la base de datos');
			}
			const data = await response.json();
			setProducts(data.map(normalizeProduct));
			setApiError('');
		} catch (err) {
			setApiError('No se pudo establecer conexión con el servidor. Por favor, asegúrate de que el backend y la base de datos estén activos.');
			setProducts([]);
		}
	};

	useEffect(() => {
		loadPerfumes();
	}, []);

	// Acciones de Carrito
	const handleAddToCart = (product) => {
		setCartItems((prevItems) => {
			const existingItem = prevItems.find((item) => item.id_presentacion === product.id_presentacion);
			if (existingItem) {
				if (existingItem.quantity >= product.stock) {
					alert('No puedes agregar más artículos. Límite de stock alcanzado.');
					return prevItems;
				}
				return prevItems.map((item) =>
					item.id_presentacion === product.id_presentacion
						? { ...item, quantity: item.quantity + 1 }
						: item
				);
			}
			return [...prevItems, { ...product, quantity: 1 }];
		});
	};

	const handleUpdateQuantity = (id_presentacion, newQty) => {
		setCartItems((prevItems) =>
			prevItems.map((item) =>
				item.id_presentacion === id_presentacion ? { ...item, quantity: newQty } : item
			)
		);
	};

	const handleRemoveItem = (id_presentacion) => {
		setCartItems((prevItems) => prevItems.filter((item) => item.id_presentacion !== id_presentacion));
	};

	const handleClearCart = () => {
		setCartItems([]);
	};

	// Filtro búsqueda
	const [searchTerm, setSearchTerm] = useState('');

	// Detalle de Producto
	const [selectedProduct, setSelectedProduct] = useState(null);

	// Controles de Carrusel por categoría
	const scrollCarousel = (ref, direction) => {
		if (ref.current) {
			const { scrollLeft, clientWidth } = ref.current;
			const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
			ref.current.scrollTo({ left: scrollLeft + scrollAmount, behavior: 'smooth' });
		}
	};

	const CATEGORY_ICONS = { Hombre: '👨', Mujer: '👩', Unisex: '🌐' };

	// Perfumes disponibles filtrados por búsqueda
	const availableProducts = products.filter(
		(p) => p.available && p.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const getProductsByCategory = (cat) =>
		availableProducts.filter((p) => p.category.toLowerCase() === cat.toLowerCase());

	return (
		<Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', pb: 8 }}>
			{/* Navbar Superior */}
			<Box
				sx={{
					position: 'sticky',
					top: 0,
					zIndex: 1000,
					backgroundColor: 'rgba(22, 26, 34, 0.95)',
					backdropFilter: 'blur(12px)',
					borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
					py: 1,
				}}
			>
				<Container maxWidth="lg">
					<Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
						{/* Logo / Marca */}
						<Box
							component="img"
							src="/logo_nav.jpg"
							alt="Perfumería y Fragancias"
							sx={{
								height: 85,
								objectFit: 'contain',
							}}
						/>

						{/* Botones de acción */}
						<Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
							{/* Carrito Icono */}
							<IconButton
								onClick={() => setCartOpen(true)}
								color="inherit"
								aria-label="Abrir carrito de compras"
								sx={{
									border: '1px solid rgba(255, 255, 255, 0.1)',
									backgroundColor: 'rgba(255, 255, 255, 0.05)',
									boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
									p: 1.2,
									'&:hover': {
										backgroundColor: 'rgba(255, 255, 255, 0.1)',
									},
								}}
							>
								<Badge 
									badgeContent={cartItems.reduce((acc, item) => acc + item.quantity, 0)} 
									sx={{
										'& .MuiBadge-badge': {
											backgroundColor: '#C9A84C',
											color: '#ffffff',
										}
									}}
								>
									<ShoppingBagOutlined sx={{ color: '#ffffff' }} />
								</Badge>
							</IconButton>

							{/* Login Administrador */}
							<Button
								variant="outlined"
								startIcon={<LockOutlined />}
								onClick={onNavigateToLogin}
								sx={{
									borderRadius: 99,
									borderColor: 'rgba(255, 255, 255, 0.2)',
									color: '#ffffff',
									textTransform: 'none',
									fontWeight: 700,
									px: 2.5,
									'&:hover': {
										borderColor: '#ffffff',
										backgroundColor: 'rgba(255, 255, 255, 0.08)',
									},
								}}
							>
								Administrar
							</Button>
						</Stack>
					</Stack>
				</Container>
			</Box>

			{/* Hero / Presentación */}
			<Box sx={{ py: { xs: 6, md: 8 }, background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', borderBottom: '1px solid rgba(15, 23, 42, 0.04)' }}>
				<Container maxWidth="md" sx={{ textAlign: 'center' }}>
					<Typography
						variant="h2"
						sx={{
							fontWeight: 900,
							color: '#0f172a',
							fontSize: { xs: '2.2rem', md: '3.5rem' },
							letterSpacing: '-1px',
							mb: 2.5,
						}}
					>
						Encuentra tu Fragancia <span style={{ color: '#C9A84C' }}>Ideal</span>
					</Typography>
					<Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: { xs: '1rem', md: '1.25rem' }, mb: 4, px: 2 }}>
						Explora nuestro catálogo premium de lociones y perfumes. Elige tu favorito y ordénalo en segundos directamente a través de WhatsApp.
					</Typography>

					{/* Barra de Búsqueda */}
					<Box sx={{ maxWidth: 600, mx: 'auto', px: 2 }}>
						<TextField
							fullWidth
							placeholder="Busca tu perfume favorito..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position="start">
											<Search sx={{ color: 'text.secondary' }} />
										</InputAdornment>
									),
								}
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									backgroundColor: '#ffffff',
									borderRadius: 99,
									boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)',
									'& fieldset': { borderColor: 'rgba(15, 23, 42, 0.08)' },
									'&:hover fieldset': { borderColor: '#C9A84C' },
									'&.Mui-focused fieldset': { borderColor: '#C9A84C' },
								},
							}}
						/>
					</Box>
				</Container>
			</Box>

			<Container maxWidth="lg" sx={{ mt: 5 }}>
				{apiError && (
					<Alert severity="warning" sx={{ mb: 4, borderRadius: 3 }}>
						{apiError}
					</Alert>
				)}

				{/* 3 Carruseles por categoría */}
				{categoriesToRender.map((cat) => {
					const catProducts = getProductsByCategory(cat);
					const ref = carouselRefs.current[cat] || null;
					return (
						<Box key={cat} sx={{ mb: 7 }}>
							{/* Encabezado de sección */}
							<Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
								<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
									<Typography sx={{ fontSize: '1.6rem', lineHeight: 1 }}>{CATEGORY_ICONS[cat] || '✨'}</Typography>
									<Box>
										<Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
											Fragancias para {cat}
										</Typography>
										<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
											{catProducts.length} {catProducts.length === 1 ? 'fragancia disponible' : 'fragancias disponibles'}
										</Typography>
									</Box>
								</Stack>
								{catProducts.length > 3 && (
									<Stack direction="row" spacing={1}>
										<IconButton onClick={() => scrollCarousel(ref, 'left')} sx={{ border: '1px solid rgba(15,23,42,0.08)', backgroundColor: '#fff' }}>
											<ArrowBackIosNew fontSize="small" />
										</IconButton>
										<IconButton onClick={() => scrollCarousel(ref, 'right')} sx={{ border: '1px solid rgba(15,23,42,0.08)', backgroundColor: '#fff' }}>
											<ArrowForwardIos fontSize="small" />
										</IconButton>
									</Stack>
								)}
							</Stack>

							{/* Carrusel */}
							{catProducts.length > 0 ? (
								<Box
										ref={(el) => {
											carouselRefs.current[cat] = el;
										}}
									sx={{
										display: 'flex',
										overflowX: 'auto',
										scrollBehavior: 'smooth',
										gap: 3,
										py: 2,
										px: 1,
										'&::-webkit-scrollbar': { display: 'none' },
										msOverflowStyle: 'none',
										scrollbarWidth: 'none',
									}}
								>
									{catProducts.map((product) => (
										<Box key={product.id} sx={{ minWidth: { xs: 260, sm: 290 }, maxWidth: 290, flexShrink: 0 }}>
											<Card
												sx={{
													borderRadius: 4,
													border: '1px solid rgba(15, 23, 42, 0.06)',
													boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
													overflow: 'hidden',
													height: '100%',
													display: 'flex',
													flexDirection: 'column',
													transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
													'&:hover': {
														transform: 'translateY(-6px)',
														boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
														borderColor: 'rgba(201, 168, 76, 0.3)',
													},
												}}
											>
												{/* Imagen */}
												<Box sx={{ position: 'relative', pt: '100%', backgroundColor: '#f1f5f9', cursor: 'pointer' }} onClick={() => setSelectedProduct(product)}>
													<CardMedia
														component="img"
														image={product.imageUrl || 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=400'}
														alt={product.name}
														sx={{
															position: 'absolute', top: 0, left: 0,
															width: '100%', height: '100%', objectFit: 'cover',
														}}
													/>
													<Chip
														label={`${product.mililitros || 100} ml`}
														size="small"
														sx={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(15,23,42,0.85)', color: '#fff', backdropFilter: 'blur(4px)', fontWeight: 700 }}
													/>
													{product.stock === 0 && (
														<Chip label="Agotado" size="small" color="error" sx={{ position: 'absolute', bottom: 12, right: 12, fontWeight: 700 }} />
													)}
												</Box>

												{/* Detalles */}
												<CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
													<Typography
														variant="subtitle1"
														onClick={() => setSelectedProduct(product)}
														sx={{ fontWeight: 800, color: '#0f172a', mb: 1, cursor: 'pointer', '&:hover': { color: '#C9A84C' }, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', height: 48 }}
													>
														{product.name}
													</Typography>
													<Typography variant="h6" sx={{ fontWeight: 800, color: '#C9A84C', mb: 2 }}>
														{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}
													</Typography>
													<Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
														<Button variant="outlined" fullWidth onClick={() => setSelectedProduct(product)}
															sx={{ borderRadius: 99, textTransform: 'none', fontWeight: 700, borderColor: 'rgba(15,23,42,0.1)', color: '#4b5563' }}
														>
															Ver Info
														</Button>
														<Button variant="contained" fullWidth disabled={product.stock === 0} onClick={() => handleAddToCart(product)}
															sx={{ borderRadius: 99, textTransform: 'none', fontWeight: 700, boxShadow: 'none', backgroundColor: '#C9A84C', '&:hover': { backgroundColor: '#b0923d' } }}
														>
															Agregar
														</Button>
													</Stack>
												</CardContent>
											</Card>
										</Box>
									))}
								</Box>
							) : (
								<Stack sx={{ py: 5, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 4, border: '1px dashed rgba(15,23,42,0.1)' }}>
									<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
										Aún no hay fragancias para {cat}.
									</Typography>
								</Stack>
							)}
						</Box>
					);
				})}
			</Container>

			{/* Modal Detalles de Fragancia */}
			<Dialog
				open={Boolean(selectedProduct)}
				onClose={() => setSelectedProduct(null)}
				maxWidth="sm"
				fullWidth
				slotProps={{
					paper: { sx: { borderRadius: 5, overflow: 'hidden' } },
				}}
			>
				{selectedProduct && (
					<Box>
						<Box sx={{ position: 'relative' }}>
							<IconButton
								onClick={() => setSelectedProduct(null)}
								sx={{
									position: 'absolute',
									top: 16,
									right: 16,
									backgroundColor: 'rgba(255, 255, 255, 0.85)',
									backdropFilter: 'blur(4px)',
									zIndex: 10,
									'&:hover': { backgroundColor: '#ffffff' },
								}}
							>
								<Close />
							</IconButton>
							<Box
								component="img"
								src={selectedProduct.imageUrl || 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=600'}
								alt={selectedProduct.name}
								sx={{
									width: '100%',
									height: { xs: 260, sm: 340 },
									objectFit: 'cover',
									backgroundColor: '#f1f5f9',
								}}
							/>
						</Box>
						<DialogContent sx={{ p: 4 }}>
							<Chip label={selectedProduct.category} color="primary" size="small" sx={{ fontWeight: 700, mb: 2, backgroundColor: '#C9A84C' }} />
							<Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mb: 1.5 }}>
								{selectedProduct.name}
							</Typography>
							<Typography variant="h4" sx={{ fontWeight: 800, color: '#C9A84C', mb: 3 }}>
								{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedProduct.price)}
							</Typography>

							<Divider sx={{ mb: 3 }} />

							<Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1 }}>
								Descripción:
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
								{selectedProduct.descripcion || 'Fragancia de larga duración, ideal para acompañar tus momentos especiales.'}
							</Typography>

							<Grid container spacing={2} sx={{ mb: 4 }}>
							<Grid size={{ xs: 6 }}>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
									Tamaño
								</Typography>
								<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
									{selectedProduct.mililitros || 100} ml
								</Typography>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
									Disponibilidad
								</Typography>
								<Typography variant="subtitle2" sx={{ fontWeight: 800, color: selectedProduct.stock > 0 ? 'success.main' : 'error.main' }}>
									{selectedProduct.stock > 0 ? `En Stock (${selectedProduct.stock} disponibles)` : 'Agotado'}
								</Typography>
							</Grid>
							</Grid>

							<Button
								variant="contained"
								fullWidth
								size="large"
								disabled={selectedProduct.stock === 0}
								onClick={() => {
									handleAddToCart(selectedProduct);
									setSelectedProduct(null);
									setCartOpen(true);
								}}
								sx={{
									borderRadius: 99,
									py: 1.5,
									fontWeight: 800,
									textTransform: 'none',
									backgroundColor: '#C9A84C',
									boxShadow: '0 4px 14px rgba(201, 168, 76, 0.3)',
									'&:hover': {
										backgroundColor: '#b0923d',
									},
								}}
							>
								Añadir al Carrito
							</Button>
						</DialogContent>
					</Box>
				)}
			</Dialog>

			{/* Carrito Drawer */}
			<Carrito
				open={cartOpen}
				onClose={() => setCartOpen(false)}
				cartItems={cartItems}
				onUpdateQuantity={handleUpdateQuantity}
				onRemoveItem={handleRemoveItem}
				onClearCart={handleClearCart}
			/>
		</Box>
	);
}
