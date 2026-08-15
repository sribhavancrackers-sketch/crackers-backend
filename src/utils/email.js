const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOrderConfirmation = async (orderData) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured. Skipping email.');
    return;
  }

  const { id, items, total, customerInfo } = orderData;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

  // Formatting order items for email
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.quantity * item.price).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  // 1. Send Email to Customer
  if (customerInfo.email) {
    try {
      await transporter.sendMail({
        from: `Sri Bhavan Crackers <${process.env.SMTP_USER}>`,
        to: customerInfo.email,
        subject: `Order Confirmation - Sri Bhavan Crackers (#${id})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #E25E3E;">Thank you for your order!</h2>
            <p>Hi ${customerInfo.name},</p>
            <p>Your order <strong>#${id}</strong> has been successfully placed.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Grand Total:</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold; color: #E25E3E;">₹${total.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
            
            <p>We will contact you shortly regarding shipping and delivery.</p>
            <p>Best regards,<br>Sri Bhavan Crackers Team</p>
          </div>
        `
      });
      console.log(`Confirmation email sent to customer: ${customerInfo.email}`);
    } catch (err) {
      console.error('Error sending email to customer:', err);
    }
  }

  // 2. Send Notification Email to Admin
  if (adminEmail) {
    try {
      await transporter.sendMail({
        from: `"Sri Bhavan Web System" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `New Order Received - #${id} (₹${total.toLocaleString('en-IN')})`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2 style="color: #d32f2f;">New Order Received!</h2>
            <p><strong>Order ID:</strong> #${id}</p>
            <p><strong>Customer Name:</strong> ${customerInfo.name}</p>
            <p><strong>Phone:</strong> ${customerInfo.phone}</p>
            <p><strong>Email:</strong> ${customerInfo.email || 'N/A'}</p>
            <p><strong>City/State:</strong> ${customerInfo.city}, ${customerInfo.state}</p>
            <p><strong>Address:</strong> ${customerInfo.address}</p>
            
            <h3>Order Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Item</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Qty</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(i => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${i.name}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${i.quantity}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${(i.quantity * i.price).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid #ddd;">Total Value:</td>
                  <td style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid #ddd;">₹${total.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
            
            <p><a href="http://localhost:5174">Click here to view in Admin Dashboard</a></p>
          </div>
        `
      });
      console.log(`Notification email sent to admin: ${adminEmail}`);
    } catch (err) {
      console.error('Error sending email to admin:', err);
    }
  }
};

module.exports = { sendOrderConfirmation };
