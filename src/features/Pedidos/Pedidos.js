import React, { useEffect, useState, useMemo } from 'react';
import {
	Alert,
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	Chip,
	CircularProgress,
	Grid,
	InputAdornment,
	Stack,
	TextField,
	Typography,
	Grow,
} from '@mui/material';
import {
	CheckCircleOutlined,
	LocalShippingOutlined,
	PersonOutlined,
	Search,
	ShoppingBagOutlined,
	History,
	CalendarTodayOutlined,
	AttachMoneyOutlined,
	PhoneOutlined,
	CancelOutlined,
} from '@mui/icons-material';

const apiBaseUrl = process.env.REACT_APP_API_URL || '/api';

const PERIOD_OPTIONS = [
	{ label: 'Hoy', days: 0 },
	{ label: '7 días', days: 7 },
	{ label: '14 días', days: 14 },
	{ label: '30 días', days: 30 },
	{ label: 'Todo', days: null },
];

function isWithinDays(dateString, days) {
	if (days === null) return true;
	if (days === 0) {
		const today = new Date();
		const d = new Date(dateString);
		return (
			d.getFullYear() === today.getFullYear() &&
			d.getMonth() === today.getMonth() &&
			d.getDate() === today.getDate()
		);
	}
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - days);
	return new Date(dateString) >= cutoff;
}

function Pedidos({ estado }) {
	const [pedidos, setPedidos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS[4]); // "Todo" por defecto
	const [searchTerm, setSearchTerm] = useState('');

	const fetchPedidos = async () => {
		try {
			setLoading(true);
			setError('');
			const response = await fetch(`${apiBaseUrl}/pedidos`);
			if (!response.ok) {
				throw new Error('No se pudo cargar la lista de pedidos.');
			}
			const data = await response.json();
			setPedidos(data);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPedidos();
	}, [estado]);

	const handleDeliver = async (id) => {
		try {
			setError('');
			const response = await fetch(`${apiBaseUrl}/pedidos/${id}/entregar`, {
				method: 'PUT',
			});
			if (!response.ok) {
				throw new Error('No se pudo actualizar el estado del pedido a entregado.');
			}
			setPedidos((current) =>
				current.map((pedido) => (pedido.id === id ? { ...pedido, estado: 'entregado' } : pedido))
			);
		} catch (err) {
			setError(err.message);
		}
	};

	const handleNoDeliver = async (id) => {
		try {
			setError('');
			const response = await fetch(`${apiBaseUrl}/pedidos/${id}/no-entregar`, {
				method: 'PUT',
			});
			if (!response.ok) {
				throw new Error('No se pudo actualizar el estado del pedido a no entregado.');
			}
			setPedidos((current) =>
				current.map((pedido) => (pedido.id === id ? { ...pedido, estado: 'no_entregado' } : pedido))
			);
		} catch (err) {
			setError(err.message);
		}
	};

	const formatPrice = (price) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

	const formatDate = (dateString) =>
		new Date(dateString).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});

	// Filtrado combinado: estado + período + búsqueda
	const filteredPedidos = useMemo(() => {
		return pedidos.filter((p) => {
			const matchEstado = p.estado === estado;
			const matchPeriod = isWithinDays(p.fecha, selectedPeriod.days);
			const matchSearch =
				!searchTerm.trim() ||
				p.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				p.clienteTelefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				p.perfumeName?.toLowerCase().includes(searchTerm.toLowerCase());
			return matchEstado && matchPeriod && matchSearch;
		});
	}, [pedidos, estado, selectedPeriod, searchTerm]);

	// Estadísticas del período
	const stats = useMemo(() => {
		const total = filteredPedidos.reduce((acc, p) => acc + Number(p.precioTotal), 0);
		return { count: filteredPedidos.length, total };
	}, [filteredPedidos]);

	const getEstadoLabel = (est) => {
		if (est === 'pendiente') return 'Pendiente';
		if (est === 'entregado') return 'Entregado';
		return 'No entregado';
	};

	const getEstadoColor = (est) => {
		if (est === 'pendiente') return 'primary';
		if (est === 'entregado') return 'success';
		return 'error';
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{ py: 1 }}>
			{error ? (
				<Alert severity="error" sx={{ mb: 3 }}>
					{error}
				</Alert>
			) : null}

			{/* Barra de filtros */}
			<Box
				sx={{
					mb: 3,
					p: 2.5,
					backgroundColor: '#ffffff',
					borderRadius: 3,
					border: '1px solid rgba(15, 23, 42, 0.06)',
					boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
				}}
			>
				{/* Período rápido */}
				<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
					Filtrar por período
				</Typography>
				<Stack direction="row" spacing={1} useFlexGap sx={{ mb: 2.5, flexWrap: 'wrap' }}>
					{PERIOD_OPTIONS.map((opt) => (
						<Chip
							key={opt.label}
							label={opt.label}
							onClick={() => setSelectedPeriod(opt)}
							sx={{
								fontWeight: 700,
								px: 1,
								fontSize: '0.85rem',
								backgroundColor: selectedPeriod.label === opt.label ? '#C9A84C' : '#f1f5f9',
								color: selectedPeriod.label === opt.label ? '#ffffff' : '#4b5563',
								border: 'none',
								transition: 'all 0.2s ease',
								'&:hover': {
									backgroundColor: selectedPeriod.label === opt.label ? '#b0923d' : 'rgba(201,168,76,0.12)',
								},
							}}
						/>
					))}
				</Stack>

				{/* Búsqueda */}
				<TextField
					size="small"
					fullWidth
					placeholder="Buscar por cliente, teléfono o perfume..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<Search sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />
								</InputAdornment>
							),
						},
					}}
					sx={{
						'& .MuiOutlinedInput-root': {
							borderRadius: 2,
							backgroundColor: '#f8fafc',
							'& fieldset': { borderColor: 'rgba(15,23,42,0.08)' },
							'&:hover fieldset': { borderColor: '#C9A84C' },
							'&.Mui-focused fieldset': { borderColor: '#C9A84C' },
						},
					}}
				/>

				{/* Resumen del período */}
				<Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap' }} useFlexGap>
					<Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
						<CalendarTodayOutlined sx={{ fontSize: '1rem', color: 'primary.main' }} />
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
							{stats.count}{' '}
							<Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
								{estado === 'pendiente' ? 'pedido(s) pendiente(s)' : (estado === 'entregado' ? 'entrega(s)' : 'pedido(s) no entregado(s)')}
								{selectedPeriod.days !== null ? ` — ${selectedPeriod.label}` : ''}
							</Typography>
						</Typography>
					</Stack>
					<Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
						<AttachMoneyOutlined sx={{ fontSize: '1rem', color: 'success.main' }} />
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
							{formatPrice(stats.total)}
							<Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 400, ml: 0.5 }}>
								en ventas
							</Typography>
						</Typography>
					</Stack>
				</Stack>
			</Box>

			{/* Lista de pedidos */}
			{filteredPedidos.length > 0 ? (
				<Grid container spacing={3}>
					{filteredPedidos.map((pedido, index) => (
						<Grid size={{ xs: 12, sm: 6, md: 4 }} key={pedido.id}>
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
										backgroundColor: '#ffffff',
										transition: 'all 0.25s ease',
										'&:hover': {
											boxShadow: '0 8px 24px rgba(15, 23, 42, 0.07)',
											transform: 'translateY(-2px)',
										},
									}}
								>
									{/* Encabezado */}
									<Box
										sx={{
											p: 2,
											backgroundColor: estado === 'pendiente' ? 'rgba(25, 118, 210, 0.04)' : (estado === 'entregado' ? 'rgba(46, 125, 50, 0.04)' : 'rgba(211, 47, 47, 0.04)'),
											borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
										}}
									>
										<Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
											Pedido #{pedido.id}
										</Typography>
										<Chip
											icon={estado === 'pendiente' ? <LocalShippingOutlined fontSize="small" /> : (estado === 'entregado' ? <History fontSize="small" /> : <CancelOutlined fontSize="small" />)}
											label={getEstadoLabel(estado)}
											color={getEstadoColor(estado)}
											size="small"
											variant="outlined"
											sx={{ fontWeight: 700, '& .MuiChip-icon': { fontSize: '0.9rem' } }}
										/>
									</Box>

									{/* Cuerpo */}
									<CardContent sx={{ flexGrow: 1, p: 3 }}>
										<Stack spacing={2}>
											{/* Cliente */}
											<Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
												<PersonOutlined sx={{ color: 'text.secondary', mt: 0.2 }} />
												<Box>
													<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
														Cliente
													</Typography>
													<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
														{pedido.clienteNombre}
													</Typography>
													{pedido.clienteTelefono && (
														<Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.5 }}>
															<PhoneOutlined sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
															<Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
																{pedido.clienteTelefono}
															</Typography>
														</Stack>
													)}
												</Box>
											</Stack>

											{/* Productos */}
											<Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
												<ShoppingBagOutlined sx={{ color: 'text.secondary', mt: 0.2 }} />
												<Box>
													<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
														Productos Pedidos
													</Typography>
													<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', whiteSpace: 'pre-line' }}>
														{pedido.perfumeName}
													</Typography>
												</Box>
											</Stack>

											{/* Fecha */}
											<Box>
												<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
													Fecha de Pedido
												</Typography>
												<Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
													{formatDate(pedido.fecha)}
												</Typography>
											</Box>

											{/* Comentarios */}
											{pedido.comentarios && (
												<Box sx={{ backgroundColor: 'rgba(201, 168, 76, 0.04)', p: 1.5, borderRadius: 2, border: '1px dashed rgba(201, 168, 76, 0.2)' }}>
													<Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', display: 'block', mb: 0.5 }}>
														Instrucciones de Entrega
													</Typography>
													<Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: '0.85rem' }}>
														"{pedido.comentarios}"
													</Typography>
												</Box>
											)}
										</Stack>
									</CardContent>

									{/* Pie con total y acción */}
									<Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
										<Box
											sx={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												p: 2,
												borderRadius: 3,
												backgroundColor: '#f8fafc',
												border: '1px solid rgba(15, 23, 42, 0.04)',
											}}
										>
											<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
												Total
											</Typography>
											<Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.15rem' }}>
												{formatPrice(pedido.precioTotal)}
											</Typography>
										</Box>

										{estado === 'pendiente' ? (
											<CardActions sx={{ px: 0, pt: 2, pb: 0 }}>
												<Stack direction="row" spacing={1} sx={{ width: '100%' }}>
													<Button
														fullWidth
														variant="contained"
														color="success"
														startIcon={<CheckCircleOutlined />}
														onClick={() => handleDeliver(pedido.id)}
														sx={{
															py: 1,
															borderRadius: 2.5,
															fontWeight: 700,
															boxShadow: 'none',
															fontSize: '0.85rem',
															'&:hover': { boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)' },
														}}
													>
														Entregado
													</Button>
													<Button
														fullWidth
														variant="contained"
														color="error"
														startIcon={<CancelOutlined />}
														onClick={() => handleNoDeliver(pedido.id)}
														sx={{
															py: 1,
															borderRadius: 2.5,
															fontWeight: 700,
															fontSize: '0.85rem',
															boxShadow: 'none',
															'&:hover': { boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)' },
														}}
													>
														No entregado
													</Button>
												</Stack>
											</CardActions>
										) : null}
									</Box>
								</Card>
							</Grow>
						</Grid>
					))}
				</Grid>
			) : (
				/* Estado vacío */
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
					{pedidos.filter((p) => p.estado === estado).length === 0 ? (
						<>
							{estado === 'pendiente' ? (
								<CheckCircleOutlined sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
							) : estado === 'entregado' ? (
								<History sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
							) : (
								<CancelOutlined sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
							)}
							<Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
								{estado === 'pendiente' ? '¡Todos los pedidos están al día!' : (estado === 'entregado' ? 'Historial vacío' : 'Sin pedidos no entregados')}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{estado === 'pendiente'
									? 'No hay pedidos pendientes de entrega en este momento.'
									: estado === 'entregado' ? 'Aún no se han completado entregas en el sistema.' : 'No hay registro de pedidos marcados como no entregados.'}
							</Typography>
						</>
					) : (
						<>
							<Search sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
							<Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
								Sin resultados
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
								No hay pedidos que coincidan con "{searchTerm || selectedPeriod.label}".
							</Typography>
							<Button
								variant="outlined"
								size="small"
								onClick={() => { setSearchTerm(''); setSelectedPeriod(PERIOD_OPTIONS[4]); }}
								sx={{ borderRadius: 99, textTransform: 'none', fontWeight: 700 }}
							>
								Limpiar filtros
							</Button>
						</>
					)}
				</Box>
			)}
		</Box>
	);
}

export default Pedidos;
