const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// ─── GET /api/orders ─────────────────────────────────────────────────────────
// Returns all orders with their items (newest first)
router.get('/', async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );

    if (orders.length === 0) return res.json([]);

    const orderIds = orders.map(o => o.id);
    const [items] = await db.query(
      `SELECT * FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`,
      orderIds
    );

    // Map items back to their parent order in the same shape the frontend expects
    const result = orders.map(order => ({
      orderId: order.order_id,
      id: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerAlternatePhone: order.customer_alt_phone,
      address: {
        line1: order.address_line1,
        city: order.address_city,
        state: order.address_state,
        pincode: order.address_pincode,
      },
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      totalAmount: Number(order.total_amount),
      orderStatus: order.status,
      createdAt: order.created_at,
      items: items
        .filter(i => i.order_id === order.id)
        .map(i => ({
          productId: i.product_id,
          name: i.product_name,
          price: Number(i.price),
          quantity: i.quantity,
        })),
      timeline: [{ status: order.status, timestamp: order.created_at }],
    }));

    res.json(result);
  } catch (err) {
    console.error('GET /api/orders error:', err);
    res.status(500).json({ error: err.message });
  }
});

const { sendOrderConfirmation } = require('../utils/email');

router.get('/test-email', async (req, res) => {
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'Test Route Check',
      text: 'If you see this, the active backend server can send emails.'
    });
    res.json({ success: true, messageId: info.messageId, user: process.env.SMTP_USER });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, envUser: process.env.SMTP_USER });
  }
});

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Place a new order
router.post('/', async (req, res) => {
  const {
    customerName, customerPhone, customerAlternatePhone, customerEmail,
    address, items, subtotal, shipping, totalAmount, userId
  } = req.body;

  if (!customerName || !customerPhone || !address || !items?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = uuidv4();
  const orderId = `SBC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO orders
       (id, order_id, user_id, customer_name, customer_phone, customer_alt_phone,
        address_line1, address_city, address_state, address_pincode,
        subtotal, shipping, total_amount, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'PENDING')`,
      [
        id, orderId, userId || null,
        customerName, customerPhone, customerAlternatePhone || null,
        address.line1, address.city, address.state, address.pincode,
        subtotal, shipping, totalAmount
      ]
    );

    const itemValues = items.map(item => [
      id, item.id || item.productId, item.name, item.price, item.quantity
    ]);
    await conn.query(
      'INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES ?',
      [itemValues]
    );

    await conn.commit();
    
    // Trigger emails in background
    sendOrderConfirmation({
      id: orderId,
      items,
      total: totalAmount,
      customerInfo: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        city: address.city,
        state: address.state,
        address: address.line1
      }
    });

    res.status(201).json({ success: true, orderId, id });
  } catch (err) {
    await conn.rollback();
    console.error('POST /api/orders error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ─── GET /api/orders/:orderId ───────────────────────────────────────────────────
// Returns a specific order by its order_id (e.g. SBC-...)
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const [orders] = await db.query('SELECT * FROM orders WHERE order_id = ? LIMIT 1', [orderId]);
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const order = orders[0];
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    
    res.json({
      orderId: order.order_id,
      id: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerAlternatePhone: order.customer_alt_phone,
      address: {
        line1: order.address_line1,
        city: order.address_city,
        state: order.address_state,
        pincode: order.address_pincode,
      },
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      totalAmount: Number(order.total_amount),
      orderStatus: order.status,
      createdAt: order.created_at,
      items: items.map(i => ({
        productId: i.product_id,
        name: i.product_name,
        price: Number(i.price),
        quantity: i.quantity,
      })),
      timeline: [{ status: order.status, timestamp: order.created_at }],
    });
  } catch (err) {
    console.error('GET /api/orders/:orderId error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/orders/:id/status ─────────────────────────────────────────────
// Update order status (admin)
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    await db.query(
      'UPDATE orders SET status = ? WHERE order_id = ? OR id = ?',
      [status, req.params.id, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/orders/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Find the UUID first (param could be orderId or UUID)
    const [[row]] = await conn.query(
      'SELECT id FROM orders WHERE order_id = ? OR id = ?',
      [req.params.id, req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Order not found' });

    await conn.query('DELETE FROM order_items WHERE order_id = ?', [row.id]);
    await conn.query('DELETE FROM orders WHERE id = ?', [row.id]);
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ─── GET /api/orders/by-user/:userId ─────────────────────────────────────────
// Customer's own orders
router.get('/by-user/:userId', async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.userId]
    );
    if (!orders.length) return res.json([]);

    const orderIds = orders.map(o => o.id);
    const [items] = await db.query(
      `SELECT * FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`,
      orderIds
    );

    res.json(orders.map(order => ({
      orderId: order.order_id,
      id: order.id,
      customerName: order.customer_name,
      orderStatus: order.status,
      totalAmount: Number(order.total_amount),
      createdAt: order.created_at,
      items: items.filter(i => i.order_id === order.id).map(i => ({
        name: i.product_name, price: Number(i.price), quantity: i.quantity
      })),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
