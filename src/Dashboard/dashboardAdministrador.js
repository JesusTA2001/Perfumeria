import React, { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	AppBar,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Drawer,
	Grid,
	IconButton,
	MenuItem,
	Paper,
	Select,
	Stack,
	Switch,
	Toolbar,
	Typography,
} from '@mui/material';
import {
	Add,
	Close,
	Delete,
	Edit,
	Inventory2Outlined,
	Logout,
	Menu,
	ShoppingBagOutlined,
	StarBorder,
	WarningAmberOutlined,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import CrearPerfume from '../features/CrearPerfume/CrearPerfume';
import EditarPerfume from '../features/EditarPerfume/EditarPerfume';
import EliminarPerfume from '../features/EliminarPerfume/EliminarPerfume';
import Productos from '../features/Productos/Productos';
import Pedidos from '../features/Pedidos/Pedidos';

const drawerWidth = 280;
const apiBaseUrl = process.env.REACT_APP_API_URL || '/api';

const categories = ['Hombre', 'Mujer', 'Unisex'];



function normalizeProduct(product) {
	return {
		...product,
		price: Number(product.price),
		stock: Number(product.stock),
		available: Boolean(product.available),
	};
}

function dashboardPalette(isAvailable, stock) {
	if (!isAvailable) {
		return { label: 'Inactivo', background: '#dc2626', text: '#ffffff' };
	}

	if (stock < 10) {
		return { label: 'Stock bajo', background: '#f59e0b', text: '#ffffff' };
	}

	return { label: 'Disponible', background: '#16a34a', text: '#ffffff' };
}

function DashboardAdministrador({ onLogout }) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [products, setProducts] = useState([]);
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState(null);
	const [productToDelete, setProductToDelete] = useState(null);
	const [apiError, setApiError] = useState('');
	const [currentTab, setCurrentTab] = useState('dashboard');

	const metrics = useMemo(() => {
		const inventoryValue = products.reduce((accumulator, product) => accumulator + product.price * product.stock, 0);
		const activeProducts = products.filter((product) => product.available).length;
		const lowStock = products.filter((product) => product.stock < 10).length;
		const availability = products.length ? Math.round((activeProducts / products.length) * 100) : 0;

		return {
			inventoryValue,
			orders: products.length * 3,
			activeProducts,
			lowStock,
			availability,
		};
	}, [products]);

	const currentYear = new Date().getFullYear();
	const [selectedYear, setSelectedYear] = useState(currentYear);
	const [monthlySales, setMonthlySales] = useState(Array(12).fill(0));
	const [topProducts, setTopProducts] = useState([]);
	const [chartsLoading, setChartsLoading] = useState(false);

	const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
	const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - i);

	useEffect(() => {
		const fetchProducts = async () => {
			try {
				setApiError('');
				const response = await fetch(`${apiBaseUrl}/perfumes`);

				if (!response.ok) {
					throw new Error('No se pudo cargar la lista de perfumes.');
				}

				const data = await response.json();
				setProducts(data.map(normalizeProduct));
			} catch (error) {
				setApiError(error.message);
			}
		};

		fetchProducts();
	}, []);

	// Cargar datos de gráficas
	useEffect(() => {
		const fetchCharts = async () => {
			setChartsLoading(true);
			try {
				const [ventasRes, topRes] = await Promise.all([
					fetch(`${apiBaseUrl}/pedidos/ventas-mensuales?anio=${selectedYear}`),
					fetch(`${apiBaseUrl}/pedidos/top-perfumes`),
				]);
				if (ventasRes.ok) {
					const data = await ventasRes.json();
					setMonthlySales(data.map(d => d.total));
				}
				if (topRes.ok) {
					setTopProducts(await topRes.json());
				}
			} catch (_) {}
			setChartsLoading(false);
		};
		fetchCharts();
	}, [selectedYear]);

	const openAddDialog = () => {
		setCreateOpen(true);
	};

	const openEditDialog = (product) => {
		setEditingProduct(product);
		setEditOpen(true);
	};

	const closeDeleteDialog = () => {
		setDeleteOpen(false);
		setProductToDelete(null);
	};

	const closeCreateDialog = () => {
		setCreateOpen(false);
	};

	const closeEditDialog = () => {
		setEditOpen(false);
		setEditingProduct(null);
	};

	const handleCreate = async (payload) => {
		try {
			setApiError('');
			const response = await fetch(`${apiBaseUrl}/perfumes`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error('No se pudo crear el perfume.');
			}

			const created = await response.json();
			setProducts((currentProducts) => [normalizeProduct(created), ...currentProducts]);
			return true;
		} catch (error) {
			setApiError(error.message);
			return false;
		}
	};

	const handleEdit = async (payload) => {
		if (!editingProduct) {
			return false;
		}

		try {
			setApiError('');
			const response = await fetch(`${apiBaseUrl}/perfumes/${editingProduct.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error('No se pudo actualizar el perfume.');
			}

			const updated = await response.json();
			setProducts((currentProducts) =>
				currentProducts.map((product) =>
					product.id === editingProduct.id ? normalizeProduct(updated) : product,
				),
			);
			return true;
		} catch (error) {
			setApiError(error.message);
			return false;
		}
	};

	const handleDelete = async () => {
		if (!productToDelete) {
			return false;
		}

		try {
			setApiError('');
			const response = await fetch(`${apiBaseUrl}/perfumes/${productToDelete.id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error('No se pudo eliminar el perfume.');
			}

			setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productToDelete.id));
			closeDeleteDialog();
			return true;
		} catch (error) {
			setApiError(error.message);
			return false;
		}
	};

	const handleToggleAvailability = async (productId) => {
		const currentProduct = products.find((product) => product.id === productId);

		if (!currentProduct) {
			return;
		}

		try {
			setApiError('');
			const response = await fetch(`${apiBaseUrl}/perfumes/${productId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...currentProduct,
					available: !currentProduct.available,
				}),
			});

			if (!response.ok) {
				throw new Error('No se pudo cambiar el estado del perfume.');
			}

			const updated = await response.json();
			setProducts((currentProducts) =>
				currentProducts.map((product) =>
					product.id === productId ? normalizeProduct(updated) : product,
				),
			);
		} catch (error) {
			setApiError(error.message);
		}
	};

	const columns = [
		{
			field: 'imageUrl',
			headerName: 'Foto',
			width: 92,
			sortable: false,
			filterable: false,
			renderCell: (params) => (
				<Box
					component="img"
					src={params.value}
					alt={params.row.name}
					sx={{ width: 48, height: 48, borderRadius: 2, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }}
				/>
			),
		},
		{ field: 'name', headerName: 'Nombre', flex: 1, minWidth: 180 },
		{ field: 'category', headerName: 'Categoría', width: 150 },
		{
			field: 'price',
			headerName: 'Precio',
			width: 140,
			valueFormatter: (value) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value),
		},
		{ field: 'stock', headerName: 'Stock', width: 110 },
		{
			field: 'available',
			headerName: 'Estado',
			width: 150,
			renderCell: (params) => {
				const palette = dashboardPalette(params.value, params.row.stock);

				return (
					<Chip
						label={palette.label}
						size="small"
						sx={{
							backgroundColor: palette.background,
							color: palette.text,
							fontWeight: 700,
							'& .MuiChip-label': { px: 1.25 },
						}}
					/>
				);
			},
		},
		{
			field: 'actions',
			headerName: 'Acciones',
			width: 170,
			sortable: false,
			filterable: false,
			renderCell: (params) => (
				<Stack direction="row" spacing={0.5}>
					<IconButton size="small" onClick={() => openEditDialog(params.row)} aria-label="Editar producto">
						<Edit fontSize="small" />
					</IconButton>
					<IconButton
						size="small"
						onClick={() => {
							setProductToDelete(params.row);
							setDeleteOpen(true);
						}}
						aria-label="Eliminar producto"
					>
						<Delete fontSize="small" />
					</IconButton>
					<Switch
						size="small"
						checked={params.row.available}
						onChange={() => handleToggleAvailability(params.row.id)}
						slotProps={{ input: { 'aria-label': 'Cambiar disponibilidad' } }}
					/>
				</Stack>
			),
		},
	];

	const menuItems = [
		{ label: 'Dashboard', value: 'dashboard' },
		{ label: 'Productos', value: 'productos' },
		{ label: 'Pedidos', value: 'pedidos' },
		{ label: 'Entregados', value: 'entregados' },
	];

	const sidebar = (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#f5f5f5' }}>
			<Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Box>
					<Typography variant="h5" sx={{ fontWeight: 800, color: '#0112fd' }}>
						Perfumeria HG
					</Typography>
					<Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
						Panel de administración
					</Typography>
				</Box>
				<IconButton
					onClick={() => setSidebarOpen(false)}
					sx={{
						display: { xs: 'inline-flex', md: 'none' },
						color: 'rgba(255, 255, 255, 0.7)',
						'&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' }
					}}
				>
					<Close />
				</IconButton>
			</Box>
			<Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
			<Box sx={{ p: 2, flex: 1 }}>
				<Stack spacing={1}>
					{menuItems.map((item) => (
						<Button
							key={item.value}
							variant={currentTab === item.value ? 'contained' : 'text'}
							color={currentTab === item.value ? 'primary' : 'inherit'}
							fullWidth
							onClick={() => {
								setCurrentTab(item.value);
								setSidebarOpen(false);
							}}
							sx={{
								justifyContent: 'flex-start',
								borderRadius: 2,
								py: 1.2,
								color: currentTab === item.value ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
								'&:hover': {
									backgroundColor: 'rgba(255, 255, 255, 0.08)'
								}
							}}
						>
							{item.label}
						</Button>
					))}
				</Stack>
			</Box>
			<Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
			<Box sx={{ p: 2 }}>
				<Button
					fullWidth
					startIcon={<Logout />}
					color="inherit"
					sx={{
						justifyContent: 'flex-start',
						color: 'rgba(255, 255, 255, 0.7)',
						'&:hover': {
							backgroundColor: 'rgba(255, 255, 255, 0.08)'
						}
					}}
					onClick={onLogout}
				>
					Cerrar sesión
				</Button>
			</Box>
		</Box>
	);

	return (
		<Box sx={{ display: 'flex', minHeight: '100vh', background: '#f5f7fb', color: 'text.primary' }}>
			<Box
				component="nav"
				sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
				aria-label="Navegación lateral"
			>
				<Drawer
					variant="temporary"
					open={sidebarOpen}
					onClose={() => setSidebarOpen(false)}
					ModalProps={{ keepMounted: true }}
					sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, backgroundColor: '#161a22', color: '#f5f5f5' } }}
				>
					{sidebar}
				</Drawer>
				<Drawer
					variant="permanent"
					sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', backgroundColor: '#161a22', color: '#f5f5f5', borderRight: '1px solid rgba(255,255,255,0.08)' } }}
					open
				>
					{sidebar}
				</Drawer>
			</Box>

			<Box sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
				<AppBar
					position="sticky"
					elevation={0}
					sx={{ backgroundColor: 'rgba(255, 255, 255, 0.88)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(15, 23, 42, 0.08)', color: 'text.primary' }}
				>
					<Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
						<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
							<IconButton color="inherit" edge="start" sx={{ display: { md: 'none' } }} onClick={() => setSidebarOpen(true)}>
								<Menu />
							</IconButton>
							<Typography variant="h6" sx={{ fontWeight: 700 }}>
								{currentTab === 'dashboard' && 'Panel de Administración'}
								{currentTab === 'productos' && 'Catálogo de Productos'}
								{currentTab === 'pedidos' && 'Pedidos Pendientes'}
								{currentTab === 'entregados' && 'Historial de Entregados'}
							</Typography>
						</Stack>
						<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
							<Chip label="Administrador" color="primary" />
							<Button variant="outlined" color="inherit" startIcon={<Logout />} sx={{ display: { xs: 'none', sm: 'inline-flex' }, borderColor: 'rgba(15, 23, 42, 0.2)' }} onClick={onLogout}>
								Cerrar sesión
							</Button>
						</Stack>
					</Toolbar>
				</AppBar>

				<Box sx={{ p: { xs: 2, md: 4 } }}>
					{apiError ? (
						<Alert severity="error" sx={{ mb: 2 }}>
							{apiError}
						</Alert>
					) : null}

					{currentTab === 'dashboard' && (
						<Grid container spacing={2.5}>
							<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
								<Card sx={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)' }}>
									<CardContent>
										<Stack direction="row" mb={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
											<Inventory2Outlined color="primary" />
											<Chip label="Inventario" size="small" color="primary" />
										</Stack>
										<Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
											{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(metrics.inventoryValue)}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											Valor total del inventario
										</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
								<Card sx={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)' }}>
									<CardContent>
										<Stack direction="row" mb={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
											<ShoppingBagOutlined color="info" />
											<Chip label="Pedidos" size="small" color="info" />
										</Stack>
										<Typography variant="h4" sx={{ fontWeight: 800 }}>
											{metrics.orders}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											Pedidos totales simulados
										</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
								<Card sx={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)' }}>
									<CardContent>
										<Stack direction="row" mb={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
											<StarBorder color="success" />
											<Chip label="Activos" size="small" color="success" />
										</Stack>
										<Typography variant="h4" sx={{ fontWeight: 800 }}>
											{metrics.activeProducts}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											Productos disponibles
										</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
								<Card sx={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)' }}>
									<CardContent>
										<Stack direction="row" mb={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
											<WarningAmberOutlined color="warning" />
											<Chip label="Stock" size="small" color="warning" />
										</Stack>
										<Typography variant="h4" sx={{ fontWeight: 800 }}>
											{metrics.lowStock}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											Productos con stock bajo
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<Stack direction="row" spacing={2} mb={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
									<Box sx={{ flex: 1 }}>
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											Gestión de productos
										</Typography>
										<Typography variant="body2" color="text.secondary">
											CRUD de perfumes con DataGrid
										</Typography>
									</Box>
									<Button variant="contained" startIcon={<Add />} onClick={openAddDialog} sx={{ ml: 'auto' }}>
										Agregar perfume
									</Button>
								</Stack>

								<Paper sx={{ height: 520, backgroundColor: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)' }}>
									<DataGrid
										rows={products}
										columns={columns}
										disableRowSelectionOnClick
										pageSizeOptions={[5, 10, 25]}
										initialState={{
											pagination: { paginationModel: { pageSize: 5, page: 0 } },
										}}
										sx={{
											border: 0,
											color: 'text.primary',
											'& .MuiDataGrid-columnHeaders': {
												backgroundColor: '#f1f5f9',
												borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
											},
											'& .MuiDataGrid-cell': {
												borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
											},
											'& .MuiDataGrid-row:hover': {
												backgroundColor: 'rgba(201,168,76,0.06)',
											},
											'& .MuiTablePagination-root, & .MuiDataGrid-footerContainer, & .MuiDataGrid-selectedRowCount': {
												color: 'text.secondary',
												borderTop: '1px solid rgba(15, 23, 42, 0.08)',
											},
											'& .MuiDataGrid-columnHeaderTitle, & .MuiDataGrid-cell': {
												color: 'text.primary',
											},
										}}
									/>
								</Paper>
							</Grid>

							<Grid size={{ xs: 12, lg: 6 }}>
								<Paper sx={{ p: 3, height: '100%', backgroundColor: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)' }}>
									<Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											Ventas mensuales
										</Typography>
										<Select
											size="small"
											value={selectedYear}
											onChange={(e) => setSelectedYear(Number(e.target.value))}
											sx={{ fontWeight: 700, fontSize: '0.85rem', minWidth: 90 }}
										>
											{YEAR_OPTIONS.map(y => (
												<MenuItem key={y} value={y}>{y}</MenuItem>
											))}
										</Select>
									</Stack>
									{chartsLoading ? (
										<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Cargando...</Typography>
									) : (
										<Stack spacing={1.2}>
											{monthlySales.map((value, index) => {
												const maxVal = Math.max(...monthlySales, 1);
												const pct = Math.round((value / maxVal) * 100);
												return (
													<Stack key={index} spacing={0.3}>
														<Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
															<Typography variant="body2" color="text.secondary" sx={{ minWidth: 32, fontWeight: 600 }}>
																{MONTH_NAMES[index]}
															</Typography>
															<Box sx={{ flexGrow: 1, mx: 1.5, height: 10, borderRadius: 999, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
																<Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: value > 0 ? 'linear-gradient(90deg, #C9A84C 0%, #E8D5A3 100%)' : 'transparent', transition: 'width 0.5s ease' }} />
															</Box>
															<Typography variant="body2" sx={{ minWidth: 80, textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', color: value > 0 ? '#C9A84C' : 'text.disabled' }}>
																{value > 0 ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value) : '—'}
															</Typography>
														</Stack>
													</Stack>
												);
											})}
										</Stack>
									)}
								</Paper>
							</Grid>

							<Grid size={{ xs: 12, lg: 6 }}>
								<Paper sx={{ p: 3, height: '100%', backgroundColor: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)' }}>
									<Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
										Perfumes más vendidos
									</Typography>
									{chartsLoading ? (
										<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Cargando...</Typography>
									) : topProducts.length === 0 ? (
										<Stack sx={{ py: 5, alignItems: 'center' }}>
											<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Aún no hay pedidos registrados.</Typography>
										</Stack>
									) : (
										<Stack spacing={1.8}>
											{topProducts.map((product) => {
												const maxUnits = Math.max(...topProducts.map(p => p.units), 1);
												const pct = Math.round((product.units / maxUnits) * 100);
												return (
													<Stack key={product.name} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
														<Typography variant="body2" sx={{ minWidth: 130, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
															{product.name}
														</Typography>
														<Box sx={{ flexGrow: 1, height: 10, borderRadius: 999, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
															<Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #60A5FA 0%, #A78BFA 100%)', transition: 'width 0.5s ease' }} />
														</Box>
														<Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right', fontWeight: 700 }}>
															{product.units} uds.
														</Typography>
													</Stack>
												);
											})}
										</Stack>
									)}
								</Paper>
							</Grid>
						</Grid>
					)}

					{currentTab === 'productos' && (
						<Productos products={products} />
					)}

					{currentTab === 'pedidos' && (
						<Pedidos estado="pendiente" />
					)}

					{currentTab === 'entregados' && (
						<Pedidos estado="entregado" />
					)}
				</Box>
			</Box>
						<CrearPerfume
							open={createOpen}
							onClose={closeCreateDialog}
							onCreate={handleCreate}
							categories={categories}
						/>
						<EditarPerfume
							open={editOpen}
							product={editingProduct}
							onClose={closeEditDialog}
							onSave={handleEdit}
							categories={categories}
						/>
						<EliminarPerfume
							open={deleteOpen}
							product={productToDelete}
							onClose={closeDeleteDialog}
							onConfirm={handleDelete}
						/>
		</Box>
	);
}

export default DashboardAdministrador;
