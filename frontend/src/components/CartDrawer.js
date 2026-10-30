import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { downloadBillingImage } from '../utils/billGenerator';

function CartDrawer({
  isOpen,
  onClose,
  cart = [],
  onRemoveFromCart,
  onClearCart,
  onUpdateQuantity,
  showAlert,
  user
}) {
  const navigate = useNavigate();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Customer Delivery details
  const [payName, setPayName] = useState(user?.name || '');
  const [payEmail, setPayEmail] = useState(user?.email || '');
  const [payMobile, setPayMobile] = useState('');
  const [payAddress, setPayAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update user details if user logs in
  useEffect(() => {
    if (user) {
      setPayName(prev => prev || user.name || '');
      setPayEmail(prev => prev || user.email || '');
    }
  }, [user]);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (paymentModalOpen) {
          setPaymentModalOpen(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, paymentModalOpen, onClose]);

  // Calculate total price
  const cartTotal = cart.reduce((acc, item) => {
    const qty = item.quantity || 1;
    return acc + (item.price * qty);
  }, 0);

  // Calculate total items count (accounting for quantities)
  const totalItemCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const handleSendWhatsAppOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      if (showAlert) showAlert("Your cart is empty!", "warning");
      return;
    }
    if (!payName.trim() || !payMobile.trim() || !payAddress.trim()) {
      if (showAlert) showAlert("Please fill in your name, mobile number, and delivery address.", "error");
      return;
    }

    setIsSubmitting(true);

    const invoiceId = 'KT-INV-' + Math.floor(100000 + Math.random() * 900000);
    const now = new Date();
    const timestampStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');

    const billItems = cart.map(item => ({
      name: item.name,
      qty: item.quantity || 1,
      price: item.price,
      size: item.size || 'Standard',
      quality: item.quality || 'Premium'
    }));

    const orderRecord = {
      id: invoiceId,
      invoiceNo: invoiceId,
      customerName: payName.trim(),
      name: payName.trim(),
      phone: payMobile.trim(),
      email: payEmail.trim() || 'N/A',
      address: payAddress.trim(),
      items: billItems,
      total: cartTotal,
      totalAmount: cartTotal,
      timestamp: timestampStr,
      date: timestampStr,
      status: "Order via WhatsApp",
      method: "WhatsApp Express Order"
    };

    // 1. AUTO-DOWNLOAD Black & White Billing Image (PNG) for User
    try {
      downloadBillingImage(orderRecord, 'png');
    } catch (billErr) {
      console.warn("Auto-download bill notice:", billErr);
    }

    const itemsSummary = cart.map(item => {
      const qty = item.quantity || 1;
      return `• *${item.name}* (${item.quality || 'Standard'}, ${item.size || 'A3'}) x ${qty} = ₹${item.price * qty}`;
    }).join('\n');

    const waMessage = 
      `*NEW CALENDAR ORDER - KARPAGAM TRADERS*\n` +
      `----------------------------------------\n` +
      `🧾 *Bill / Invoice No:* ${invoiceId}\n` +
      `👤 *Customer Name:* ${payName.trim()}\n` +
      `📱 *Mobile:* ${payMobile.trim()}\n` +
      `📧 *Email:* ${payEmail.trim() || 'N/A'}\n` +
      `📍 *Delivery Address:* ${payAddress.trim()}\n` +
      `----------------------------------------\n` +
      `🛒 *Ordered Items (${totalItemCount}):*\n${itemsSummary}\n` +
      `----------------------------------------\n` +
      `💰 *Total Amount:* ₹${cartTotal}\n` +
      `----------------------------------------\n` +
      `📄 Official Black & White Order Bill has been downloaded.\n` +
      `Please confirm my order and share payment/dispatch details. Thank you!`;

    // 2. Open WhatsApp with prefilled message
    const whatsappUrl = `https://wa.me/919566801402?text=${encodeURIComponent(waMessage)}`;
    window.open(whatsappUrl, '_blank');

    const orderPayload = {
      name: payName.trim(),
      phone: payMobile.trim(),
      email: payEmail.trim() || '',
      service: `Shop Order (${totalItemCount} Items - ₹${cartTotal})`,
      message: `Invoice: ${invoiceId}\nItems:\n${itemsSummary}\nDelivery Address: ${payAddress.trim()}`
    };

    // 3. Log Order to FastAPI backend
    try {
      await fetch('http://127.0.0.1:8000/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
    } catch (err) {
      console.warn("FastAPI backend order logging notice:", err);
    }

    // 4. Save to LocalStorage Billing Records for Admin/Owner and User History
    try {
      const existingBills = JSON.parse(localStorage.getItem('karpagam_billing_records') || '[]');
      existingBills.unshift(orderRecord);
      localStorage.setItem('karpagam_billing_records', JSON.stringify(existingBills));
    } catch (billLsErr) {
      console.warn("LocalStorage bill save notice:", billLsErr);
    }

    // 4.5 Save Order inquiry to localStorage so Admin sees it immediately in Inquiries tab
    try {
      const existingInquiries = JSON.parse(localStorage.getItem('karpagam_customer_inquiries') || '[]');
      existingInquiries.unshift({
        id: invoiceId,
        invoiceNo: invoiceId,
        name: orderRecord.customerName,
        phone: orderRecord.phone,
        email: orderRecord.email,
        address: orderRecord.address,
        service: orderPayload.service,
        message: orderPayload.message,
        items: billItems,
        timestamp: timestampStr,
        date: timestampStr,
        status: "Order via WhatsApp",
        totalAmount: cartTotal
      });
      localStorage.setItem('karpagam_customer_inquiries', JSON.stringify(existingInquiries));
    } catch (lsErr) {
      console.warn("LocalStorage order backup error:", lsErr);
    }

    // 5. Save Order & Billing Record to Firebase Firestore if connected
    if (db) {
      try {
        await db.collection("billing_records").doc(invoiceId).set(orderRecord);

        await db.collection("customer_inquiries").add({
          invoiceNo: invoiceId,
          name: orderRecord.customerName,
          phone: orderRecord.phone,
          email: orderRecord.email,
          address: orderRecord.address,
          service: orderPayload.service,
          message: orderPayload.message,
          items: billItems,
          timestamp: timestampStr,
          date: timestampStr,
          status: "Order via WhatsApp",
          totalAmount: cartTotal
        });

        await db.collection("history").add({
          email: orderPayload.email || orderPayload.name,
          event: `Placed Shop Order via WhatsApp (${invoiceId} - ₹${cartTotal})`,
          activity: `Placed Shop Order (${totalItemCount} items, ₹${cartTotal}) by ${orderPayload.name}`,
          user: orderPayload.name,
          timestamp: timestampStr,
          type: "success"
        });
      } catch (fbErr) {
        console.warn("Firebase order save notice:", fbErr);
      }
    }

    setIsSubmitting(false);
    if (onClearCart) onClearCart();
    setPaymentModalOpen(false);
    onClose();
    if (showAlert) showAlert("Order submitted! WhatsApp opened & your Black & White Bill (PNG) has been automatically downloaded.", "success");
  };

  const handleBrowseShop = () => {
    onClose();
    navigate('/shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* SHOPPING CART DRAWER OVERLAY */}
      {isOpen && (
        <div 
          className="cart-drawer-overlay open" 
          onClick={(e) => {
            if (e.target.classList.contains('cart-drawer-overlay')) {
              onClose();
            }
          }}
        >
          <div className="cart-drawer-card right-side-drawer">
            {/* Drawer Header */}
            <div className="cart-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-cart-shopping" style={{ color: 'var(--primary)', fontSize: '1.25rem' }}></i>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                  Shopping Cart
                </h3>
                <span style={{ 
                  background: 'rgba(139, 0, 0, 0.1)', 
                  color: 'var(--primary)', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.8rem', 
                  fontWeight: 800 
                }}>
                  {totalItemCount}
                </span>
              </div>
              <button 
                className="close-modal-btn" 
                onClick={onClose}
                aria-label="Close Shopping Cart"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '1.2rem', 
                  color: '#64748b' 
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="cart-drawer-body">
              {cart.map((item, idx) => {
                const qty = item.quantity || 1;
                return (
                  <div key={item.id || idx} className="cart-item-row">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="cart-item-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/daily 1.jpeg';
                      }}
                    />
                    <div className="cart-item-info" style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '0.92rem', 
                        fontWeight: 700, 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}>
                        {item.name}
                      </h4>
                      <span className="cart-item-specs" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        {item.quality || 'Standard'} • {item.size || 'A3 Wall Mount'}
                      </span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span className="cart-item-price" style={{ fontWeight: 800, color: 'var(--primary)' }}>
                          ₹{item.price * qty}
                        </span>

                        {/* Quantity Increment / Decrement Controls */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', borderRadius: '16px', padding: '2px 6px' }}>
                          <button 
                            type="button"
                            onClick={() => onUpdateQuantity ? onUpdateQuantity(idx, -1) : onRemoveFromCart(idx)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}
                            title="Decrease quantity"
                          >
                            -
                          </button>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>
                            {qty}
                          </span>
                          <button 
                            type="button"
                            onClick={() => onUpdateQuantity && onUpdateQuantity(idx, 1)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Delete Item Button */}
                    <button 
                      className="btn-remove-item" 
                      onClick={() => onRemoveFromCart(idx)} 
                      title="Remove Item"
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#ef4444', 
                        cursor: 'pointer', 
                        padding: '6px',
                        fontSize: '0.95rem' 
                      }}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="empty-cart-state" style={{ textAlign: 'center', padding: '40px 16px' }}>
                  <i className="fa-solid fa-cart-flatbed" style={{ fontSize: '3.5rem', color: '#cbd5e1', marginBottom: '16px' }}></i>
                  <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>Your cart is empty</h4>
                  <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
                    Discover our Daily Tear-Off, 12-Sheet Monthly, and Specialty calendar collections.
                  </p>
                  <button 
                    onClick={handleBrowseShop}
                    style={{
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 22px',
                      borderRadius: '24px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      boxShadow: '0 4px 14px rgba(139, 0, 0, 0.25)'
                    }}
                  >
                    <i className="fa-solid fa-store" style={{ marginRight: '6px' }}></i> Explore Shop
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer with Checkout */}
            {cart.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-summary-line" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '1rem', color: '#475569', fontWeight: 600 }}>Total Amount:</span>
                  <strong style={{ fontSize: '1.4rem', color: 'var(--primary)', fontWeight: 900 }}>₹{cartTotal}</strong>
                </div>

                <div className="cart-footer-buttons" style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn-secondary-cart" 
                    onClick={onClearCart}
                    style={{ 
                      flex: 1, 
                      background: '#f1f5f9', 
                      color: '#475569', 
                      border: 'none', 
                      padding: '12px', 
                      borderRadius: '16px', 
                      fontWeight: 700, 
                      cursor: 'pointer' 
                    }}
                  >
                    <i className="fa-solid fa-trash" style={{ marginRight: '6px' }}></i> Clear
                  </button>
                  <button 
                    className="btn-primary-checkout" 
                    onClick={() => {
                      setPaymentModalOpen(true);
                    }}
                    style={{ 
                      flex: 2, 
                      background: 'var(--primary)', 
                      color: 'white', 
                      border: 'none', 
                      padding: '12px', 
                      borderRadius: '16px', 
                      fontWeight: 800, 
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(139, 0, 0, 0.3)'
                    }}
                  >
                    <i className="fa-solid fa-credit-card" style={{ marginRight: '6px' }}></i> Checkout (₹{cartTotal})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT & DELIVERY DETAILS MODAL */}
      {paymentModalOpen && (
        <div 
          className="product-modal-overlay open" 
          onClick={(e) => {
            if (e.target.classList.contains('product-modal-overlay')) {
              setPaymentModalOpen(false);
            }
          }}
          style={{ zIndex: 100000 }}
        >
          <div className="payment-modal-card" style={{ maxWidth: '520px', width: '92%', borderRadius: '24px', padding: '28px', background: '#ffffff', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <div className="payment-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-cash-register" style={{ color: 'var(--primary)', fontSize: '1.3rem' }}></i>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                  Delivery Details & Order
                </h3>
              </div>
              <button 
                className="close-modal-btn" 
                onClick={() => setPaymentModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="payment-modal-body">
              <form onSubmit={handleSendWhatsAppOrder} className="delivery-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group-full" style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter your full name" 
                    value={payName}
                    onChange={(e) => setPayName(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                  />
                </div>

                <div className="form-group-half">
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    placeholder="yourname@gmail.com" 
                    value={payEmail}
                    onChange={(e) => setPayEmail(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                  />
                </div>

                <div className="form-group-half">
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Mobile Number *
                  </label>
                  <input 
                    type="tel" 
                    required 
                    pattern="[0-9]{10}"
                    maxLength="10"
                    placeholder="10-digit mobile number" 
                    value={payMobile}
                    onChange={(e) => setPayMobile(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                  />
                </div>

                <div className="form-group-full" style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Delivery Address with Pincode *
                  </label>
                  <textarea 
                    required 
                    rows="3" 
                    placeholder="Full street address, city, pincode..."
                    value={payAddress}
                    onChange={(e) => setPayAddress(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none', resize: 'vertical' }}
                  ></textarea>
                </div>

                <div 
                  className="order-summary-box" 
                  style={{ 
                    gridColumn: 'span 2', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: '#fdf5e6', 
                    padding: '14px 18px', 
                    borderRadius: '14px', 
                    border: '1.5px solid #fde68a' 
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>Total Order Summary</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{totalItemCount} items selected</div>
                  </div>
                  <strong style={{ fontSize: '1.35rem', color: 'var(--primary)', fontWeight: 900 }}>₹{cartTotal}</strong>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{
                    gridColumn: 'span 2',
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '30px',
                    padding: '15px 24px',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 6px 20px rgba(37, 211, 102, 0.4)',
                    transition: 'all 0.3s ease',
                    marginTop: '4px'
                  }}
                >
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.4rem' }}></i> 
                  {isSubmitting ? 'Generating Bill & Placing Order...' : `Send Order via WhatsApp (₹${cartTotal})`}
                </button>
                <div style={{ gridColumn: 'span 2', textAlign: 'center', fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-circle-down" style={{ color: '#000000' }}></i>
                  <span>Official Black & White Bill (PNG) automatically downloads upon ordering</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CartDrawer;
