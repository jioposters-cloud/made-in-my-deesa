// ===== MY DEESA SHOPPING - RAZORPAY CHECKOUT =====
// Updated for My Deesa Orders Google Apps Script

const RAZORPAY_KEY = 'rzp_live_RycGGdBVVqAFT9';
const ORDERS_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx7FcRGU-yBrEI6RY_5i8z_425ocBqYqU3szDgrVsvpMqucywzfHXy78EM4vVnx05A3/exec';
// 1. GET CART FROM STORAGE
function getCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

// 2. GET CUSTOMER DETAILS (WITH AUTO-PREFILL FROM LOCAL STORAGE)
function getCustomerDetails() {
  return {
    name: localStorage.getItem('customerName') || 'Guest',
    email: localStorage.getItem('customerEmail') || 'noemail@example.com',
    phone: localStorage.getItem('customerPhone') || '9000000000',
    address: localStorage.getItem('customerAddress') || 'Not provided'
  };
}

// 3. RAZORPAY CHECKOUT WITH METADATA
document.addEventListener('DOMContentLoaded', () => {
  const checkoutRazorpayBtn = document.getElementById('checkoutRazorpay');
  const checkoutModal = document.getElementById('checkoutModal');
  const closeCheckoutModal = document.getElementById('closeCheckoutModal');
  const checkoutModalOverlay = document.getElementById('checkoutModalOverlay');
  const checkoutForm = document.getElementById('checkoutForm');
  
  const closeModal = () => {
    if (checkoutModal) checkoutModal.classList.remove('show');
  };
  
  if (closeCheckoutModal) closeCheckoutModal.addEventListener('click', closeModal);
  if (checkoutModalOverlay) checkoutModalOverlay.addEventListener('click', closeModal);
  
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('#checkoutRazorpay');
    if (btn) {
      console.log('Pay with Razorpay clicked!');
      const cart = getCart();
      
      if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
      }
      
      if (document.getElementById('checkoutName')) {
        document.getElementById('checkoutName').value = localStorage.getItem('customerName') || '';
        document.getElementById('checkoutEmail').value = localStorage.getItem('customerEmail') || '';
        document.getElementById('checkoutPhone').value = localStorage.getItem('customerPhone') || '';
        document.getElementById('checkoutAddress').value = localStorage.getItem('customerAddress') || '';
      }
      
      const cartSidebar = document.getElementById('cartSidebar');
      const cartOverlay = document.getElementById('cartOverlay');
      if (cartSidebar) cartSidebar.classList.remove('open');
      if (cartOverlay) cartOverlay.classList.remove('open');
      
      if (checkoutModal) checkoutModal.classList.add('show');
    }
  });
  
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const customerName = document.getElementById('checkoutName').value;
      const customerEmail = document.getElementById('checkoutEmail').value;
      const customerPhone = document.getElementById('checkoutPhone').value;
      const customerAddress = document.getElementById('checkoutAddress').value;
      
      localStorage.setItem('customerName', customerName);
      localStorage.setItem('customerEmail', customerEmail);
      localStorage.setItem('customerPhone', customerPhone);
      localStorage.setItem('customerAddress', customerAddress);
      
      closeModal();
      triggerRazorpayPayment();
    });
  }
});

function triggerRazorpayPayment() {
  const cart = getCart();
  if (cart.length === 0) return;
  
  const customer = getCustomerDetails();
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const orderMetadata = {
    products: cart.map((item, idx) => `${item.name} (Qty: ${item.quantity}) - ₹${item.price * item.quantity}`).join(', '),
    customerName: customer.name,
    customerAddress: customer.address,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    orderTotal: total,
    itemCount: cart.length,
    orderTimestamp: new Date().toISOString()
  };
  
  const options = {
    key: RAZORPAY_KEY,
    amount: total * 100,
    currency: 'INR',
    name: 'My Deesa Shopping',
    description: 'Order for ' + cart.length + ' items',
    notes: orderMetadata,
    handler: function(response) {
      processPayment(response, cart, customer, total);
    },
    prefill: {
      name: customer.name,
      email: customer.email,
      contact: customer.phone
    },
    theme: { color: '#1abc9c' }
  };
  
  try {
    const rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function(response) {
      alert('Payment Failed: ' + response.error.description);
      console.log('Failed Payment:', response);
    });
    rzp1.open();
  } catch (error) {
    alert('Payment Error: ' + error.message);
    console.error('Razorpay Error:', error);
  }
}

// 4. PROCESS SUCCESSFUL PAYMENT
function processPayment(response, cart, customer, total) {
  const now = new Date();
  const orderNo = 'MD' + now.getFullYear() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0') + now.getTime().toString().slice(-4);
  
  const orderData = {
    orderNo: orderNo,
    date: now.toLocaleDateString('en-IN'),
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    shippingMethod: 'Delivery',
    address: customer.address,
    zip: document.getElementById('checkoutZip')?.value || '',
    products: cart.map(item => `${item.quantity} x ${item.name}`).join(', '),
    orderTotal: total,
    payment: 'Razorpay',
    transactionId: response.razorpay_payment_id
  };
  
  // Send to Google Apps Script
  fetch(ORDERS_APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  })
  .then(() => {
    console.log('Order sent to My Deesa Orders sheet');
    showSuccessNotification(orderData, response);
  })
  .catch(e => {
    console.error('Error sending order:', e);
    showSuccessNotification(orderData, response);
  });
  
  localStorage.setItem('cart', JSON.stringify([]));
  
  if (window.updateCartUI) {
    window.updateCartUI();
  }
  
  const cartSidebar = document.getElementById('cartSidebar');
  const cartOverlay = document.getElementById('cartOverlay');
  if (cartSidebar) cartSidebar.classList.remove('open');
  if (cartOverlay) cartOverlay.classList.remove('open');
}

// 5. SHOW SUCCESS NOTIFICATION
function showSuccessNotification(orderData, response) {
  const notification = document.createElement('div');
  notification.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 3000; text-align: left; max-width: 500px; font-family: Arial, sans-serif;';
  notification.innerHTML = `
    <h2 style="color: #1abc9c; margin-bottom: 15px;">✅ Payment Successful!</h2>
    <p>Thank you for your order.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px; font-size: 13px;">
      <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderData.orderNo}</p>
      <p style="margin: 5px 0;"><strong>Name:</strong> ${orderData.name}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${orderData.email}</p>
      <p style="margin: 5px 0;"><strong>Total:</strong> ₹${orderData.orderTotal}</p>
      <p style="margin: 5px 0;"><strong>Payment ID:</strong> ${response.razorpay_payment_id}</p>
    </div>
    <p style="margin-bottom: 15px; font-size: 12px; color: #999;">Check your email for order confirmation.</p>
    <button onclick="this.parentElement.remove()" style="background: #1abc9c; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; width: 100%;">Close</button>
  `;
  document.body.appendChild(notification);
}
