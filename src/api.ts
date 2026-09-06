const API_URL = '/api';

export const fetchMenu = async () => {
  const res = await fetch(`${API_URL}/menu`);
  if (!res.ok) throw new Error('Failed to fetch menu');
  return res.json();
};

export const placeOrder = async (orderData: any, token: string) => {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to place order');
  }
  return res.json();
};

export const fetchMyOrders = async (token: string) => {
  const res = await fetch(`${API_URL}/orders/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
};

export const fetchOrder = async (id: string, token: string) => {
  const res = await fetch(`${API_URL}/orders/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch order details');
  return res.json();
};

// Admin
export const fetchAdminOrders = async (token: string) => {
  const res = await fetch(`${API_URL}/admin/orders`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch admin orders');
  return res.json();
};

export const updateOrderStatus = async (id: number, status: string, token: string) => {
  const res = await fetch(`${API_URL}/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
};

export const fetchAdminStats = async (token: string) => {
  const res = await fetch(`${API_URL}/admin/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch admin stats');
  return res.json();
};

export const createMenuItem = async (itemData: any, token: string) => {
  const res = await fetch(`${API_URL}/admin/menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(itemData)
  });
  if (!res.ok) throw new Error('Failed to create menu item');
  return res.json();
};

export const updateMenuAvailability = async (id: number, isAvailable: boolean, token: string) => {
  const res = await fetch(`${API_URL}/admin/menu/${id}/availability`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ isAvailable })
  });
  if (!res.ok) throw new Error('Failed to update availability');
  return res.json();
};
