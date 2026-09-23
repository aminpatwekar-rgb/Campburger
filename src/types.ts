export interface User {
  id: number;
  uid: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isVegetarian: boolean;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryLandmark: string;
  deliveryInstructions: string;
  paymentProofUrl?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface DashboardStats {
  todaysOrders: number;
  todaysRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  totalUsers: number;
}

export interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  menuItem: Partial<MenuItem>;
}

export interface PaymentSettings {
  upiId: string;
  payeeName: string;
  qrImageUrl: string;
  isEnabled: boolean;
  instructions: string;
}
