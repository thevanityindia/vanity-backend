const sendEmail = require('./sendEmail');

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
};

const sendOrderConfirmationEmail = async (order, user) => {
    const orderDate = new Date(order.createdAt).toLocaleDateString();

    // Generate Items HTML
    const itemsHtml = order.items.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; text-align: left;">
                <div style="font-weight: bold;">${item.name}</div>
                <div style="font-size: 12px; color: #777;">Quantity: ${item.quantity}</div>
            </td>
            <td style="padding: 10px; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>
    `).join('');

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="text-align: center; padding: 20px; background-color: #000; color: #fff;">
                <h1>The Vanity</h1>
            </div>
            
            <div style="padding: 20px;">
                <h2>Order Confirmed!</h2>
                <p>Hi ${order.shippingAddress?.firstName || user.firstName},</p>
                <p>Thank you for shopping with The Vanity. Your order has been received and is being processed.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                    <p><strong>Order Date:</strong> ${orderDate}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
                    <p><strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}</p>
                    <p><strong>Status:</strong> ${order.status}</p>
                </div>

                <h3>Order Summary</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f1f1f1;">
                            <th style="padding: 10px; text-align: left;">Item</th>
                            <th style="padding: 10px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
                            <td style="padding: 10px; text-align: right;">${formatCurrency(order.subtotal)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; text-align: right; font-weight: bold;">Shipping:</td>
                            <td style="padding: 10px; text-align: right;">${formatCurrency(order.shippingCost)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px;">Total:</td>
                            <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px;">${formatCurrency(order.totalAmount)}</td>
                        </tr>
                    </tfoot>
                </table>

                <h3>Shipping Address</h3>
                <p>
                    ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
                    ${order.shippingAddress.address1}<br>
                    ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
                    ${order.shippingAddress.country}<br>
                    Phone: ${order.shippingAddress.phone}
                </p>

                <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #777; text-align: center;">
                    If you have any questions, reply to this email or contact our support team.<br>
                    &copy; ${new Date().getFullYear()} The Vanity. All rights reserved.
                </p>
            </div>
        </div>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: `Order Confirmation - ${order.orderNumber}`,
            message: `Thank you for your order! Your order number is ${order.orderNumber}.`,
            html
        });
        console.log(`Order confirmation email sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
    }
};

const sendOrderStatusUpdateEmail = async (order, user) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="text-align: center; padding: 20px; background-color: #000; color: #fff;">
                <h1>The Vanity</h1>
            </div>
            
            <div style="padding: 20px;">
                <h2>Order Update</h2>
                <p>Hi ${order.shippingAddress?.firstName || user.firstName},</p>
                <p>Your order status has been updated.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                    <p style="font-size: 14px; color: #555;">Order Number: ${order.orderNumber}</p>
                    <p style="font-size: 18px; font-weight: bold; margin: 10px 0;">
                        New Status: <span style="color: #000; text-transform: uppercase;">${order.status}</span>
                    </p>
                </div>

                ${order.trackingNumber ? `
                    <div style="margin: 20px 0; padding: 10px; border: 1px dashed #ccc; text-align: center;">
                        <strong>Tracking Number:</strong> ${order.trackingNumber}
                    </div>
                ` : ''}

                <p>You can check the details of your order by logging into your account.</p>

                <a href="http://localhost:5173/orders" style="display: block; width: 200px; margin: 20px auto; padding: 10px; background-color: #000; color: #fff; text-align: center; text-decoration: none; border-radius: 5px;">View My Orders</a>

                <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #777; text-align: center;">
                    If you have any questions, reply to this email or contact our support team.<br>
                    &copy; ${new Date().getFullYear()} The Vanity. All rights reserved.
                </p>
            </div>
        </div>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: `Order Update - ${order.orderNumber}`,
            message: `Your order ${order.orderNumber} status has been updated to ${order.status}.`,
            html
        });
        console.log(`Order update email sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending order update email:', error);
    }
};

module.exports = {
    sendOrderConfirmationEmail,
    sendOrderStatusUpdateEmail
};
