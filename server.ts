import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { requireAuth, requireAdmin, AuthRequest } from "./src/middleware/auth.ts";
import { db } from "./src/db/index.ts";
import { menuItems, orders, orderItems, users } from "./src/db/schema.ts";
import { seedMenu } from "./src/db/seed.ts";
import { eq, desc, sql } from "drizzle-orm";
import { adminFirestore } from "./src/lib/firebase-admin.ts";

async function syncOrderToFirestore(orderId: number, fallbackUserUid?: string) {
  try {
    const orderData = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (orderData.length === 0) return null;
    const ord = orderData[0];

    const items = await db.select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      price: orderItems.price,
      name: menuItems.name,
      imageUrl: menuItems.imageUrl,
      category: menuItems.category,
    }).from(orderItems)
      .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(eq(orderItems.orderId, orderId));

    let userUid = fallbackUserUid;
    if (!userUid && ord.userId) {
      const u = await db.select().from(users).where(eq(users.id, ord.userId)).limit(1);
      if (u.length > 0) {
        userUid = u[0].uid;
      }
    }

    const payload = {
      id: ord.id,
      orderNumber: ord.orderNumber,
      userId: ord.userId,
      userUid: userUid || "",
      customerName: ord.customerName,
      customerPhone: ord.customerPhone,
      deliveryAddress: ord.deliveryAddress,
      deliveryLandmark: ord.deliveryLandmark || "",
      deliveryInstructions: ord.deliveryInstructions || "",
      status: ord.status,
      paymentMethod: ord.paymentMethod,
      paymentStatus: ord.paymentStatus,
      paymentProofUrl: ord.paymentProofUrl || "",
      subtotal: ord.subtotal,
      deliveryFee: ord.deliveryFee,
      total: ord.total,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        category: item.category
      })),
      createdAt: ord.createdAt ? new Date(ord.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: ord.updatedAt ? new Date(ord.updatedAt).toISOString() : new Date().toISOString(),
    };

    await adminFirestore.collection("orders").doc(String(orderId)).set(payload, { merge: true });
    return payload;
  } catch (err) {
    console.error("Error syncing order to Firestore:", err);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // Store payment settings helper
  const settingsFilePath = path.join(process.cwd(), "public", "payment-settings.json");
  const getPaymentSettings = () => {
    try {
      if (fs.existsSync(settingsFilePath)) {
        const raw = fs.readFileSync(settingsFilePath, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error("Failed to read payment settings:", e);
    }
    return {
      upiId: "paytm.s2tb8xn@pty",
      payeeName: "Camp New Burger",
      qrImageUrl: "/uploads/Sufyan_upi_id-1790178087121.jpg",
      isEnabled: false,
      instructions: "Online UPI payment is temporarily disabled. Pay Cash on Delivery (COD) upon receiving your order."
    };
  };

  const savePaymentSettings = (settings: any) => {
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), "utf-8");
  };

  // Ensure menu is seeded if empty
  await seedMenu().catch(err => console.error("Error during seedMenu:", err));

  // === PUBLIC API ===
  
  app.get("/api/settings/payment", (req, res) => {
    res.json(getPaymentSettings());
  });

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
      const { items, customerName, customerPhone, deliveryAddress, deliveryLandmark, deliveryInstructions, paymentMethod, paymentUtr, paymentProofUrl } = req.body;
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
      
      const method = paymentMethod === 'UPI' ? 'UPI' : 'COD';
      const cleanUtr = typeof paymentUtr === 'string' ? paymentUtr.trim() : '';
      const paymentStatus = method === 'UPI'
        ? (cleanUtr ? `Paid (UTR: ${cleanUtr})` : 'Paid via QR')
        : 'Pending';

      let combinedInstructions = deliveryInstructions || '';
      if (cleanUtr) {
        combinedInstructions = combinedInstructions
          ? `${combinedInstructions} [UPI Ref: ${cleanUtr}]`
          : `[UPI Ref: ${cleanUtr}]`;
      }

      const newOrder = await db.insert(orders).values({
        orderNumber,
        userId: user.id,
        status: 'Received',
        paymentMethod: method,
        paymentStatus,
        subtotal,
        deliveryFee,
        total,
        customerName,
        customerPhone,
        deliveryAddress,
        deliveryLandmark,
        deliveryInstructions: combinedInstructions,
        paymentProofUrl: typeof paymentProofUrl === 'string' && paymentProofUrl.trim() ? paymentProofUrl.trim() : null,
      }).returning();
      
      const orderId = newOrder[0].id;
      
      const orderItemsData = items.map((item: any) => ({
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
      }));
      
      await db.insert(orderItems).values(orderItemsData);
      
      // Real-time Firestore sync
      await syncOrderToFirestore(orderId, req.user?.uid);
      
      res.json(newOrder[0]);
    } catch (error: any) {
      console.error("Failed to create order:", error);
      res.status(500).json({ error: "Failed to create order. Please try again." });
    }
  });

  app.get("/api/orders/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      const myOrders = await db.select().from(orders).where(eq(orders.userId, req.dbUser!.id)).orderBy(desc(orders.createdAt));
      // Sync orders to Firestore in background so real-time listeners pick them up
      for (const ord of myOrders) {
        syncOrderToFirestore(ord.id, req.user?.uid).catch(() => {});
      }
      res.json(myOrders);
    } catch (error: any) {
      console.error("Failed to fetch user orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/me", requireAuth, (req: AuthRequest, res) => {
    res.json(req.dbUser);
  });
  
  app.patch("/api/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { favoriteCategory } = req.body;
      const updatedUser = await db.update(users)
        .set({ favoriteCategory })
        .where(eq(users.id, req.dbUser!.id))
        .returning();
      res.json(updatedUser[0]);
    } catch (error: any) {
      console.error("Failed to update user:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/orders/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        res.status(400).json({ error: "Invalid order ID" });
        return;
      }

      const orderData = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      
      if (orderData.length === 0) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      // Authorization Guard: Only the order owner or an admin can view order details
      if (orderData[0].userId !== req.dbUser!.id && req.dbUser!.role !== 'admin') {
        res.status(403).json({ error: "Forbidden: You are not authorized to view this order" });
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
        
      // Background sync to Firestore
      syncOrderToFirestore(orderId, req.user?.uid).catch(() => {});
        
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

  app.put("/api/admin/menu/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        res.status(400).json({ error: "Invalid item ID" });
        return;
      }

      const { name, description, price, category, imageUrl, isVegetarian, isAvailable, sortOrder } = req.body;
      const updateData: any = {
        updatedAt: new Date()
      };
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = typeof price === 'string' ? parseInt(price) : price;
      if (category !== undefined) updateData.category = category;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (isVegetarian !== undefined) updateData.isVegetarian = isVegetarian;
      if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

      const updated = await db.update(menuItems)
        .set(updateData)
        .where(eq(menuItems.id, itemId))
        .returning();

      if (updated.length === 0) {
        res.status(404).json({ error: "Menu item not found" });
        return;
      }

      res.json(updated[0]);
    } catch (error: any) {
      console.error("Failed to update menu item:", error);
      res.status(500).json({ error: "Failed to update menu item" });
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

  app.delete("/api/admin/menu/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        res.status(400).json({ error: "Invalid item ID" });
        return;
      }

      // Delete any order_items associated with this item if any
      await db.delete(orderItems).where(eq(orderItems.menuItemId, itemId));

      const deleted = await db.delete(menuItems).where(eq(menuItems.id, itemId)).returning();
      if (deleted.length === 0) {
        res.status(404).json({ error: "Menu item not found" });
        return;
      }
      res.json({ success: true, deletedItem: deleted[0] });
    } catch (error: any) {
      console.error("Failed to delete menu item:", error);
      res.status(500).json({ error: "Failed to delete menu item" });
    }
  });

  app.post("/api/admin/upload", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { filename, base64Data } = req.body;
      if (!base64Data) {
        res.status(400).json({ error: "No image data provided" });
        return;
      }

      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Parse data URL
      const matches = base64Data.match(/^data:([A-Za-z-+\/0-9.]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = "png";

      if (matches && matches.length === 3) {
        const mime = matches[1].toLowerCase();
        buffer = Buffer.from(matches[2], "base64");
        const mimeMap: Record<string, string> = {
          "image/jpeg": "jpg",
          "image/jpg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
          "image/svg+xml": "svg",
          "image/avif": "avif",
          "image/bmp": "bmp",
          "image/x-icon": "ico",
          "image/vnd.microsoft.icon": "ico",
          "image/tiff": "tiff",
          "image/heic": "heic",
          "image/heif": "heif",
        };
        ext = mimeMap[mime] || (filename ? path.extname(filename).replace('.', '') : 'png') || 'png';
      } else {
        buffer = Buffer.from(base64Data, "base64");
        ext = filename ? path.extname(filename).replace('.', '') || 'png' : 'png';
      }

      ext = ext.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      const cleanOriginalName = (filename || "image")
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 30);
      const uniqueName = `${cleanOriginalName}-${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, uniqueName);

      await fs.promises.writeFile(filePath, buffer);
      const publicUrl = `/uploads/${uniqueName}`;

      res.json({
        success: true,
        url: publicUrl,
        filename: uniqueName,
        originalName: filename || uniqueName,
        size: buffer.length
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Authenticated customer endpoint to upload UPI payment proof screenshot
  app.post("/api/upload/payment-proof", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { filename, base64Data } = req.body;
      if (!base64Data) {
        res.status(400).json({ error: "No image data provided" });
        return;
      }

      const uploadsDir = path.join(process.cwd(), "public", "uploads", "receipts");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const matches = base64Data.match(/^data:([A-Za-z-+\/0-9.]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = "png";

      if (matches && matches.length === 3) {
        const mime = matches[1].toLowerCase();
        buffer = Buffer.from(matches[2], "base64");
        const mimeMap: Record<string, string> = {
          "image/jpeg": "jpg",
          "image/jpg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/heic": "heic",
          "image/heif": "heif",
        };
        ext = mimeMap[mime] || 'png';
      } else {
        buffer = Buffer.from(base64Data, "base64");
      }

      ext = ext.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      const uniqueName = `receipt-${req.dbUser!.id}-${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, uniqueName);

      await fs.promises.writeFile(filePath, buffer);
      const publicUrl = `/uploads/receipts/${uniqueName}`;

      res.json({
        success: true,
        url: publicUrl,
        filename: uniqueName,
        size: buffer.length
      });
    } catch (error: any) {
      console.error("Payment proof upload error:", error);
      res.status(500).json({ error: "Failed to upload payment proof" });
    }
  });

  // Customer or admin updates payment proof or UTR on existing order
  app.post("/api/orders/:id/payment-proof", requireAuth, async (req: AuthRequest, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { paymentProofUrl, paymentUtr } = req.body;

      const orderData = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (orderData.length === 0) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      if (orderData[0].userId !== req.dbUser!.id && req.dbUser!.role !== 'admin') {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }

      const cleanUtr = typeof paymentUtr === 'string' ? paymentUtr.trim() : '';
      const cleanProof = typeof paymentProofUrl === 'string' ? paymentProofUrl.trim() : orderData[0].paymentProofUrl;
      const paymentStatus = cleanUtr ? `Paid (UTR: ${cleanUtr})` : (cleanProof ? 'Paid (Screenshot Attached)' : orderData[0].paymentStatus);

      const updated = await db.update(orders)
        .set({
          paymentProofUrl: cleanProof,
          paymentStatus,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning();

      // Real-time Firestore sync
      syncOrderToFirestore(orderId, req.user?.uid).catch(() => {});

      res.json(updated[0]);
    } catch (error: any) {
      console.error("Failed to attach payment proof:", error);
      res.status(500).json({ error: "Failed to attach payment proof" });
    }
  });

  app.get("/api/admin/uploads", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        res.json([]);
        return;
      }
      const files = await fs.promises.readdir(uploadsDir);
      const list = await Promise.all(
        files
          .filter(f => !f.startsWith("."))
          .map(async f => {
            const stat = await fs.promises.stat(path.join(uploadsDir, f));
            return {
              filename: f,
              url: `/uploads/${f}`,
              size: stat.size,
              createdAt: stat.birthtime || stat.mtime
            };
          })
      );
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(list.slice(0, 30));
    } catch (error: any) {
      console.error("Failed to list uploads:", error);
      res.status(500).json({ error: "Failed to list uploads" });
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

      // Real-time Firestore document update
      try {
        await adminFirestore.collection("orders").doc(String(orderId)).set({
          status,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.error("Failed to update status in Firestore:", fsErr);
      }
        
      res.json(updated[0]);
    } catch (error: any) {
      console.error("Failed to update order status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.patch("/api/admin/orders/:id/payment", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { paymentStatus } = req.body;
      
      const updated = await db.update(orders)
        .set({ paymentStatus, updatedAt: new Date() })
        .where(eq(orders.id, orderId))
        .returning();

      if (updated.length === 0) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      // Real-time Firestore document update
      try {
        await adminFirestore.collection("orders").doc(String(orderId)).set({
          paymentStatus,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.error("Failed to update paymentStatus in Firestore:", fsErr);
      }
        
      res.json(updated[0]);
    } catch (error: any) {
      console.error("Failed to update payment status:", error);
      res.status(500).json({ error: "Failed to update payment status" });
    }
  });

  app.put("/api/admin/settings/payment", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const current = getPaymentSettings();
      const { upiId, payeeName, qrImageUrl, isEnabled, instructions } = req.body;
      const updated = {
        ...current,
        upiId: upiId !== undefined ? String(upiId).trim() : current.upiId,
        payeeName: payeeName !== undefined ? String(payeeName).trim() : current.payeeName,
        qrImageUrl: qrImageUrl !== undefined ? String(qrImageUrl).trim() : current.qrImageUrl,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : current.isEnabled,
        instructions: instructions !== undefined ? String(instructions).trim() : current.instructions,
      };
      savePaymentSettings(updated);
      res.json(updated);
    } catch (error: any) {
      console.error("Failed to update payment settings:", error);
      res.status(500).json({ error: "Failed to update payment settings" });
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
