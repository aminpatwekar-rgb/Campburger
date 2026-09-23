import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  role: text('role').default('customer').notNull(),
  favoriteCategory: text('favorite_category'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(),
  category: text('category').notNull(),
  imageUrl: text('image_url').notNull(),
  isVegetarian: boolean('is_vegetarian').default(false).notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id),
  status: text('status').notNull().default('Received'), // Received, Confirmed, Preparing, Ready, Out for Delivery, Delivered, Cancelled
  paymentMethod: text('payment_method').notNull().default('COD'),
  paymentStatus: text('payment_status').notNull().default('Pending'),
  subtotal: integer('subtotal').notNull(),
  deliveryFee: integer('delivery_fee').notNull(),
  total: integer('total').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  deliveryAddress: text('delivery_address'),
  deliveryLandmark: text('delivery_landmark'),
  deliveryInstructions: text('delivery_instructions'),
  paymentProofUrl: text('payment_proof_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  menuItemId: integer('menu_item_id').references(() => menuItems.id).notNull(),
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));
