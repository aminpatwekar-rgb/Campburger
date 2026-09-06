import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, requireAdmin, AuthRequest } from "./src/middleware/auth.ts";
import { db } from "./src/db/index.ts";
import { menuItems, orders, orderItems, users } from "./src/db/schema.ts";
import { eq, desc, sql } from "drizzle-orm";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // === PUBLIC API ===
  
  app.get("/api/menu", async (req, res) => {
    try {
      const items = await db.select().from(menuItems).orderBy(menuItems.sortOrder, desc(menuItems.createdAt));
      res.json(items);
    } catch (error: any) {
      console.error("Failed to fetch menu:", error);
      res.status(500).json({ error: "Failed to fetch menu" });
    }
  });

  // === CUSTOMER API ===
  
  app.post("/api/orders", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { items, customerName, customerPhone, deliveryAddress, deliveryLandmark, deliveryInstructions, paymentMethod } = req.body;
      const user = req.dbUser!;
      
      if (!items || items.length === 0) {
        res.status(400).json({ error: "Order must contain at least one item" });
        return;
      }
      
      let subtotal = 0;
      for (const item of items) {
        const dbItem = await db.select().from(menuItems).where(eq(menuItems.id, item.menuItemId)).limit(1);
        if (dbItem.length === 0 || !dbItem[0].isAvailable) {
          res.status(400).json({ error: `Item ${item.menuItemId} is unavailable or does not exist.` });
          return;
        }
        subtotal += dbItem[0].price * item.quantity;
      }
      
      const deliveryFee = 40; // Fixed delivery fee for now
      const total = subtotal + deliveryFee;
      
      // Generate unique order number (e.g. #CB1042)
      const countResult = await db.select({ count: sql`count(*)` }).from(orders);
      const nextId = Number(countResult[0].count) + 1;
      const orderNumber = `#CB${1000 + nextId}`;
      
      const newOrder = await db.insert(orders).values({
        orderNumber,
        userId: user.id,
        status: 'Received',
        paymentMethod: paymentMethod || 'COD',
        paymentStatus: 'Pending',
        subtotal,
        deliveryFee,
        total,
        customerName,
        customerPhone,
        deliveryAddress,
        deliveryLandmark,
        deliveryInstructions,
      }).returning();
      
      const orderId = newOrder[0].id;
      
      const orderItemsData = items.map((item: any) => ({
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
      }));
      
      await db.insert(orderItems).values(orderItemsData);
      
      res.json(newOrder[0]);
    } catch (error: any) {
      console.error("Failed to create order:", error);
      res.status(500).json({ error: "Failed to create order. Please try again." });
    }
  });

  app.get("/api/orders/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      const myOrders = await db.select().from(orders).where(eq(orders.userId, req.dbUser!.id)).orderBy(desc(orders.createdAt));
      res.json(myOrders);
    } catch (error: any) {
      console.error("Failed to fetch user orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/me", requireAuth, (req: AuthRequest, res) => {
    res.json(req.dbUser);
  });
  
  app.get("/api/orders/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const orderData = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      
      if (orderData.length === 0) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      
      const items = await db.select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        price: orderItems.price,
        menuItem: {
          id: menuItems.id,
          name: menuItems.name,
          imageUrl: menuItems.imageUrl,
        }
      }).from(orderItems)
        .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(eq(orderItems.orderId, orderId));
        
      res.json({ ...orderData[0], items });
    } catch (error: any) {
      console.error("Failed to fetch order:", error);
      res.status(500).json({ error: "Failed to fetch order details" });
    }
  });

  // === ADMIN API ===
  
  app.post("/api/admin/menu", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const newItem = await db.insert(menuItems).values(req.body).returning();
      res.json(newItem[0]);
    } catch (error: any) {
      console.error("Failed to create menu item:", error);
      res.status(500).json({ error: "Failed to create menu item" });
    }
  });

  app.patch("/api/admin/menu/:id/availability", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { isAvailable } = req.body;
      const updated = await db.update(menuItems).set({ isAvailable }).where(eq(menuItems.id, itemId)).returning();
      res.json(updated[0]);
    } catch (error: any) {
      console.error("Failed to update availability:", error);
      res.status(500).json({ error: "Failed to update availability" });
    }
  });

  app.get("/api/admin/orders", requireAdmin, async (req: AuthRequest, res) => {
    try {
      // Fetch all orders with their items and users
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      res.json(allOrders);
    } catch (error: any) {
      console.error("Failed to fetch admin orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.patch("/api/admin/orders/:id/status", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      const updated = await db.update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, orderId))
        .returning();
        
      res.json(updated[0]);
    } catch (error: any) {
      console.error("Failed to update order status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });
  
  app.get("/api/admin/stats", requireAdmin, async (req: AuthRequest, res) => {
    try {
      // Get today's orders
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const allOrders = await db.select().from(orders);
      
      let todaysOrders = 0;
      let todaysRevenue = 0;
      let pendingOrders = 0;
      let completedOrders = 0;
      
      for (const order of allOrders) {
        if (new Date(order.createdAt) >= startOfDay) {
          todaysOrders++;
          if (['Delivered', 'Ready'].includes(order.status)) {
             todaysRevenue += order.total;
          }
        }
        
        if (['Received', 'Confirmed', 'Preparing'].includes(order.status)) {
          pendingOrders++;
        }
        if (['Ready', 'Out for Delivery', 'Delivered'].includes(order.status)) {
          completedOrders++;
        }
      }
      
      const userCountResult = await db.select({ count: sql`count(*)` }).from(users);
      const totalUsers = Number(userCountResult[0].count);
      
      res.json({
        todaysOrders,
        todaysRevenue,
        pendingOrders,
        completedOrders,
        totalUsers
      });
    } catch (error: any) {
      console.error("Failed to fetch admin stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
