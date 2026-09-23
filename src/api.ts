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

export const updateMenuItem = async (id: number, data: any, token: string) => {
  const res = await fetch(`${API_URL}/admin/menu/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update menu item');
  }
  return res.json();
};

export const deleteMenuItem = async (id: number, token: string) => {
  const res = await fetch(`${API_URL}/admin/menu/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete menu item');
  }
  return res.json();
};

export const uploadImage = async (file: File, token: string): Promise<{ url: string; filename: string; originalName: string; size: number }> => {
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  const res = await fetch(`${API_URL}/admin/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      filename: file.name,
      base64Data
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload image');
  }

  return res.json();
};

export const fetchUploads = async (token: string) => {
  const res = await fetch(`${API_URL}/admin/uploads`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch uploads');
  return res.json();
};

export const fetchPaymentSettings = async () => {
  const res = await fetch(`${API_URL}/settings/payment`);
  if (!res.ok) throw new Error('Failed to fetch payment settings');
  return res.json();
};

export const updatePaymentSettings = async (settings: any, token: string) => {
  const res = await fetch(`${API_URL}/admin/settings/payment`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(settings)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update payment settings');
  }
  return res.json();
};

export const updateOrderPaymentStatus = async (id: number, paymentStatus: string, token: string) => {
  const res = await fetch(`${API_URL}/admin/orders/${id}/payment`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ paymentStatus })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update payment status');
  }
  return res.json();
};

export const uploadPaymentProof = async (file: File, token: string) => {
  return new Promise<{ url: string; filename: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch(`${API_URL}/upload/payment-proof`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            filename: file.name,
            base64Data
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to upload receipt');
        }

        const data = await res.json();
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const submitOrderPaymentProof = async (orderId: number, data: { paymentProofUrl?: string; paymentUtr?: string }, token: string) => {
  const res = await fetch(`${API_URL}/orders/${orderId}/payment-proof`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit payment proof');
  }
  return res.json();
};

