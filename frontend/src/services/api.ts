import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CategoryDto {
  id: number;
  nameHe: string;
  nameEn: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export interface ProductDto {
  id: number;
  nameHe: string;
  nameEn: string;
  descriptionHe?: string;
  descriptionEn?: string;
  price: number;
  barcode?: string;
  imageUrl?: string;
  categoryId: number;
  categoryNameHe: string;
  categoryNameEn: string;
  stockQuantity: number;
  isActive: boolean;
}
export interface PackageDto {
  id: number;
  nameHe: string;
  nameEn: string;
  descriptionHe?: string;
  descriptionEn?: string;
  price: number;
  originalPrice: number;
  discount: number;
  imageUrl?: string;
  isActive: boolean;
  items: PackageItemDto[];
}

export interface PackageItemDto {
  productId: number;
  productNameHe: string;
  productNameEn: string;
  quantity: number;
}

export interface OrderDto {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress?: string;
  city?: string;
  totalAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
  items: OrderItemDto[];
}

export interface OrderItemDto {
  productId?: number;
  packageId?: number;
  nameHe: string;
  nameEn: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderDto {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress?: string;
  city?: string;
  notes?: string;
  items: { productId?: number; packageId?: number; quantity: number }[];
}

export interface CreateOrderResult {
  orderId: number;
  totalAmount: number;
  paymentUrl?: string;
}

export interface DashboardDto {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalPackages: number;
  recentOrders: { id: number; customerName: string; totalAmount: number; status: string; createdAt: string }[];
}

export interface LoginResult {
  token: string;
  fullName: string;
  expiration: string;
}

export interface SiteSettingsDto {
  isMaintenanceMode: boolean;
  updatedAt: string;
}

// Public API
export const categoriesApi = {
  getAll: () => api.get<CategoryDto[]>('/categories').then(r => r.data),
  getById: (id: number) => api.get<CategoryDto>(`/categories/${id}`).then(r => r.data),
};

export const productsApi = {
  getAll: (categoryId?: number) =>
    api.get<ProductDto[]>('/products', { params: categoryId ? { categoryId } : {} }).then(r => r.data),
  getById: (id: number) => api.get<ProductDto>(`/products/${id}`).then(r => r.data),
};

export const packagesApi = {
  getAll: () => api.get<PackageDto[]>('/packages').then(r => r.data),
  getById: (id: number) => api.get<PackageDto>(`/packages/${id}`).then(r => r.data),
};

export const ordersApi = {
  create: (dto: CreateOrderDto) => api.post<CreateOrderResult>('/orders', dto).then(r => r.data),
  getById: (id: number) => api.get<OrderDto>(`/orders/${id}`).then(r => r.data),
};

export const siteSettingsApi = {
  getStatus: () => api.get<SiteSettingsDto>('/site-settings/status').then(r => r.data),
};

// Admin API
export const adminApi = {
  login: (username: string, password: string) =>
    api.post<LoginResult>('/admin/login', { username, password }).then(r => r.data),
  getDashboard: () => api.get<DashboardDto>('/admin/dashboard').then(r => r.data),

  getCategories: () => api.get<CategoryDto[]>('/admin/categories').then(r => r.data),
  createCategory: (data: Partial<CategoryDto>) => api.post<CategoryDto>('/admin/categories', data).then(r => r.data),
  updateCategory: (id: number, data: Partial<CategoryDto>) => api.put<CategoryDto>(`/admin/categories/${id}`, data).then(r => r.data),
  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),

  getProducts: (categoryId?: number) =>
    api.get<ProductDto[]>('/admin/products', { params: categoryId ? { categoryId } : {} }).then(r => r.data),
  createProduct: (data: Partial<ProductDto>) => api.post<ProductDto>('/admin/products', data).then(r => r.data),
  updateProduct: (id: number, data: Partial<ProductDto>) => api.put<ProductDto>(`/admin/products/${id}`, data).then(r => r.data),
  deleteProduct: (id: number) => api.delete(`/admin/products/${id}`),

  getPackages: () => api.get<PackageDto[]>('/admin/packages').then(r => r.data),
  createPackage: (data: unknown) => api.post<PackageDto>('/admin/packages', data).then(r => r.data),
  updatePackage: (id: number, data: unknown) => api.put<PackageDto>(`/admin/packages/${id}`, data).then(r => r.data),
  deletePackage: (id: number) => api.delete(`/admin/packages/${id}`),

  getOrders: () => api.get<OrderDto[]>('/admin/orders').then(r => r.data),
  getOrder: (id: number) => api.get<OrderDto>(`/admin/orders/${id}`).then(r => r.data),
  updateOrderStatus: (id: number, status: string) => api.put(`/admin/orders/${id}/status`, { status }),
  getOrderReceipt: (id: number) => api.get(`/admin/orders/${id}/receipt`, { responseType: 'blob' }).then(r => r.data as Blob),
  getOrderInvoice: (id: number) => api.get(`/admin/orders/${id}/invoice`, { responseType: 'blob' }).then(r => r.data as Blob),

  getSiteSettings: () => api.get<SiteSettingsDto>('/admin/site-settings').then(r => r.data),
  setMaintenance: (isMaintenanceMode: boolean) =>
    api.put<SiteSettingsDto>('/admin/site-settings/maintenance', { isMaintenanceMode }).then(r => r.data),
};

export default api;
