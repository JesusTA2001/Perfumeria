import { useState } from 'react';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Drawer,
	IconButton,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Stack,
	TextField,
	Typography,
	Badge,
	Alert,
	CircularProgress,
} from '@mui/material';
import {
	Add,
	Close,
	DeleteOutlined,
	Remove,
	ShoppingBagOutlined,
} from '@mui/icons-material';

const WHATSAPP_PHONE = '15595812917'; // Número de teléfono de WhatsApp por defecto (editable)

export default function Carrito({
	open,
	onClose,
	cartItems,
	onUpdateQuantity,
	onRemoveItem,
	onClearCart,
}) {
	const [checkoutOpen, setCheckoutOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	
	// Formulario
	const [clienteNombre, setClienteNombre] = useState('');
	const [telefono, setTelefono] = useState('');
	const [comentarios, setComentarios] = useState('');

	const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

	const handleCheckoutSubmit = async (event) => {
		event.preventDefault();
		setError('');

		if (!clienteNombre.trim() || !telefono.trim()) {
			setError('El nombre y el teléfono son requeridos.');
			return;
		}

		setLoading(true);

		// Preparar items para la API
		const apiItems = cartItems.map((item) => ({
			id_presentacion: item.id_presentacion,
			cantidad: item.quantity,
		}));

		try {
			// 1. Guardar el pedido en la base de datos
			const response = await fetch('/api/pedidos', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					clienteNombre,
					telefono,
					comentarios,
					items: apiItems,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al guardar el pedido en el servidor');
			}

			// 2. Construir mensaje de WhatsApp
			let itemLines = '';
			cartItems.forEach((item) => {
				itemLines += `\n- ${item.name} 100 ml\nCantidad: ${item.quantity}\n`;
			});

			const messageText = `Hola.

Quisiera realizar el siguiente pedido.

Nombre:
${clienteNombre}

Teléfono:
${telefono}

Pedido:
${itemLines}
Comentarios:
${comentarios ? comentarios : 'Ninguno.'}

Gracias.`;

			// 3. Abrir WhatsApp
			const encodedMsg = encodeURIComponent(messageText);
			const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMsg}`;
			window.open(whatsappUrl, '_blank');

			// 4. Limpiar carrito y cerrar
			onClearCart();
			setClienteNombre('');
			setTelefono('');
			setComentarios('');
			setCheckoutOpen(false);
			onClose();
			
			// Mostrar mensaje de éxito temporal
			alert('¡Pedido registrado con éxito! Te hemos redirigido a WhatsApp para finalizar tu entrega.');
		} catch (err) {
			setError(err.message || 'Hubo un problema al procesar tu pedido. Verifica la disponibilidad.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Drawer
				anchor="right"
				open={open}
				onClose={onClose}
				PaperProps={{
					sx: {
						width: { xs: '100%', sm: 400 },
						backgroundColor: '#ffffff',
						display: 'flex',
						flexDirection: 'column',
					},
				}}
			>
				{/* Cabecera del Carrito */}
				<Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(15, 23, 42, 0.08)' }}>
					<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
						<Badge badgeContent={cartItems.length} color="primary">
							<ShoppingBagOutlined color="primary" />
						</Badge>
						<Typography variant="h6" sx={{ fontWeight: 800 }}>
							Tu Carrito
						</Typography>
					</Stack>
					<IconButton onClick={onClose} edge="end" aria-label="Cerrar carrito">
						<Close />
					</IconButton>
				</Box>

				{/* Lista de Productos */}
				<Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5 }}>
					{cartItems.length === 0 ? (
						<Stack spacing={2} sx={{ height: '100%', justifyContent: 'center', alignItems: 'center', py: 8 }}>
							<ShoppingBagOutlined sx={{ fontSize: 64, color: 'rgba(15, 23, 42, 0.15)' }} />
							<Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
								El carrito está vacío
							</Typography>
							<Button variant="outlined" color="primary" onClick={onClose} sx={{ borderRadius: 99 }}>
								Explorar fragancias
							</Button>
						</Stack>
					) : (
						<List disablePadding>
							{cartItems.map((item) => (
								<Box key={item.id_presentacion}>
									<ListItem
										alignItems="flex-start"
										secondaryAction={
											<IconButton
												edge="end"
												onClick={() => onRemoveItem(item.id_presentacion)}
												color="error"
												aria-label="Eliminar artículo"
											>
												<DeleteOutlined />
											</IconButton>
										}
										sx={{ px: 1, py: 2 }}
									>
										<ListItemAvatar sx={{ mr: 2 }}>
											<Box
												component="img"
												src={item.imageUrl || 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=150'}
												alt={item.name}
												sx={{
													width: 72,
													height: 72,
													borderRadius: 2,
													objectFit: 'cover',
													border: '1px solid rgba(15, 23, 42, 0.08)',
												}}
											/>
										</ListItemAvatar>
										<ListItemText
											primary={
												<Typography variant="subtitle2" sx={{ fontWeight: 700, pr: 3 }}>
													{item.name}
												</Typography>
											}
											secondary={
												<Stack spacing={1} sx={{ mt: 0.5 }}>
													<Typography variant="caption" color="text.secondary">
														Categoría: {item.category} • 100ml
													</Typography>
													<Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
														{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.price)}
													</Typography>

													{/* Controles de Cantidad */}
													<Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.5 }}>
														<IconButton
															size="small"
															disabled={item.quantity <= 1}
															onClick={() => onUpdateQuantity(item.id_presentacion, item.quantity - 1)}
															sx={{ border: '1px solid rgba(15, 23, 42, 0.12)', p: 0.2 }}
														>
															<Remove fontSize="small" />
														</IconButton>
														<Typography variant="body2" sx={{ minWidth: 32, textAlign: 'center', fontWeight: 700 }}>
															{item.quantity}
														</Typography>
														<IconButton
															size="small"
															disabled={item.quantity >= item.stock}
															onClick={() => onUpdateQuantity(item.id_presentacion, item.quantity + 1)}
															sx={{ border: '1px solid rgba(15, 23, 42, 0.12)', p: 0.2 }}
														>
															<Add fontSize="small" />
														</IconButton>
													</Stack>
												</Stack>
											}
										/>
									</ListItem>
									<Divider sx={{ borderStyle: 'dashed' }} />
								</Box>
							))}
						</List>
					)}
				</Box>

				{/* Pie del Carrito */}
				{cartItems.length > 0 && (
					<Box sx={{ p: 2.5, borderTop: '1px solid rgba(15, 23, 42, 0.08)', backgroundColor: '#fafafa' }}>
						<Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
							<Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
								Total estimado
							</Typography>
							<Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
								{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total)}
							</Typography>
						</Stack>
						<Button
							variant="contained"
							color="primary"
							fullWidth
							size="large"
							onClick={() => setCheckoutOpen(true)}
							sx={{
								borderRadius: 99,
								py: 1.5,
								fontWeight: 700,
								textTransform: 'none',
								boxShadow: '0 4px 14px rgba(201, 168, 76, 0.3)',
							}}
						>
							Proceder al Pedido
						</Button>
					</Box>
				)}
			</Drawer>

			{/* Modal de Checkout */}
			<Dialog
				open={checkoutOpen}
				onClose={() => !loading && setCheckoutOpen(false)}
				maxWidth="xs"
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: 4,
						p: 1.5,
					},
				}}
			>
				<DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Confirmar Pedido</DialogTitle>
				<Box component="form" onSubmit={handleCheckoutSubmit}>
					<DialogContent sx={{ py: 1 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
							Llena tus datos de contacto para registrar tu pedido e iniciar el chat de entrega en WhatsApp.
						</Typography>

						{error && (
							<Alert severity="error" sx={{ mb: 2 }}>
								{error}
							</Alert>
						)}

						<Stack spacing={2.5}>
							<TextField
								label="Nombre completo"
								value={clienteNombre}
								onChange={(e) => setClienteNombre(e.target.value)}
								fullWidth
								required
								disabled={loading}
								placeholder="Ej. Jesús Torres"
							/>
							<TextField
								label="Teléfono"
								type="tel"
								value={telefono}
								onChange={(e) => setTelefono(e.target.value)}
								fullWidth
								required
								disabled={loading}
								placeholder="Ej. 3512345678"
							/>
							<TextField
								label="Comentarios (opcional)"
								multiline
								rows={3}
								value={comentarios}
								onChange={(e) => setComentarios(e.target.value)}
								fullWidth
								disabled={loading}
								placeholder="Instrucciones especiales de entrega (Ej. Entregar por la tarde)"
							/>
						</Stack>
					</DialogContent>
					<DialogActions sx={{ p: 2, justifyContent: 'flex-end', gap: 1 }}>
						<Button
							onClick={() => setCheckoutOpen(false)}
							color="inherit"
							disabled={loading}
							sx={{ textTransform: 'none', fontWeight: 600 }}
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							variant="contained"
							color="primary"
							disabled={loading}
							sx={{
								textTransform: 'none',
								fontWeight: 700,
								px: 3,
								borderRadius: 99,
								boxShadow: '0 4px 12px rgba(201, 168, 76, 0.25)',
							}}
						>
							{loading ? <CircularProgress size={24} color="inherit" /> : 'Confirmar y Enviar'}
						</Button>
					</DialogActions>
				</Box>
			</Dialog>
		</>
	);
}
