import React, { useState } from 'react';
import { db } from '../firebase';
import apiService from '../api';

function ProductsSection({ 
  products, 
  cart, 
  onAddToCart, 
  onRemoveFromCart, 
  onClearCart,
  isCartOpen = false,
  onOpenCart,
  onCloseCart,
  showAlert 
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState('Deluxe');
  const [selectedSize, setSelectedSize] = useState('A3 Wall Mount');
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [internalCartOpen, setInternalCartOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Single-column slider indexes for Row 1 (Daily), Row 2 (Monthly), Row 3 (Cake)
  const [dailyIndex, setDailyIndex] = useState(0);
  const [monthlyIndex, setMonthlyIndex] = useState(0);
  const [specialtyIndex, setSpecialtyIndex] = useState(0);

  // Payment Form State
  const [payName, setPayName] = useState('');
  const [payEmail, setPayEmail] = useState('');
  const [payMobile, setPayMobile] = useState('');
  const [payAddress, setPayAddress] = useState('');
  const [payMethod, setPayMethod] = useState('gpay');
  const [qrGenerated, setQrGenerated] = useState(false);

  // Cart open state controlled externally or internally
  const cartOpen = isCartOpen || internalCartOpen;

  const handleCloseCartDrawer = () => {
    setInternalCartOpen(false);
    if (onCloseCart) onCloseCart();
  };

  const handleOpenCartDrawer = () => {
    if (onOpenCart) onOpenCart();
    setInternalCartOpen(true);
  };

  // Quality multiplier map
  const qualityPriceMultiplier = {
    'Standard': 1.0,
    'Deluxe': 1.2,
    'Premium Gold': 1.5
  };

  const handleOpenOptions = (product) => {
    setSelectedProduct(product);
    setSelectedQuality('Deluxe');
    setSelectedSize('A3 Wall Mount');
    setOptionsModalOpen(true);
  };

  const handleConfirmAddToCart = () => {
    if (!selectedProduct) return;
    
    const basePrice = selectedProduct.price;
    const finalPrice = Math.round(basePrice * (qualityPriceMultiplier[selectedQuality] || 1.0));

    const cartItem = {
      id: Date.now() + Math.random(),
      productId: selectedProduct.id,
      name: selectedProduct.name,
      category: selectedProduct.category,
      image: selectedProduct.image,
      quality: selectedQuality,
      size: selectedSize,
      price: finalPrice
    };

    onAddToCart(cartItem);
    setOptionsModalOpen(false);
    if (showAlert) showAlert(`${selectedProduct.name} (${selectedQuality}, ${selectedSize}) added to cart!`, 'success');
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);

  // Split products by category for 3 explicit rows
  const dailyProducts = products.filter(p => p.category === 'daily');
  const monthlyProducts = products.filter(p => p.category === 'monthly');
  const specialtyProducts = products.filter(p => p.category === 'specialty');

  const handleSendWhatsAppOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      if (showAlert) showAlert("Your cart is empty!", "warning");
      return;
    }
    if (!payName.trim() || !payMobile.trim() || !payAddress.trim()) {
      if (showAlert) showAlert("Please fill in all delivery details.", "error");
      return;
    }

    const itemsSummary = cart.map(item => `• *${item.name}* (${item.quality}, ${item.size}) - ₹${item.price}`).join('\n');
    const waMessage = 
      `*NEW CALENDAR ORDER - KARPAGAM TRADERS*\n` +
      `----------------------------------------\n` +
      `👤 *Customer Name:* ${payName}\n` +
      `📱 *Mobile:* ${payMobile}\n` +
      `📧 *Email:* ${payEmail || 'N/A'}\n` +
      `📍 *Address:* ${payAddress}\n` +
      `----------------------------------------\n` +
      `🛒 *Ordered Items (${cart.length}):*\n${itemsSummary}\n` +
      `----------------------------------------\n` +
      `💰 *Total Amount:* ₹${cartTotal}\n` +
      `----------------------------------------\n` +
      `Please confirm my order and share payment details. Thank you!`;

    // 1. Open WhatsApp with prefilled message
    const whatsappUrl = `https://wa.me/919566801402?text=${encodeURIComponent(waMessage)}`;
    window.open(whatsappUrl, '_blank');

    const orderPayload = {
      name: payName || 'Customer',
      phone: payMobile || '',
      email: payEmail || '',
      service: `Shop Order via WhatsApp (₹${cartTotal})`,
      message: `Items:\n${itemsSummary}\nDelivery Address: ${payAddress}`
    };

    // 2. Log Order to Python FastAPI backend
    try {
      await fetch('http://127.0.0.1:8000/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
    } catch (err) {
      console.warn("Python backend order logging error:", err);
    }

    // 3. Save Order to Firebase Firestore
    if (db) {
      try {
        const now = new Date();
        const timestampStr = now.getFullYear() + '-' +
          String(now.getMonth() + 1).padStart(2, '0') + '-' +
          String(now.getDate()).padStart(2, '0') + ' ' +
          String(now.getHours()).padStart(2, '0') + ':' +
          String(now.getMinutes()).padStart(2, '0') + ':' +
          String(now.getSeconds()).padStart(2, '0');

        // Customer Inquiry Document
        await db.collection("customer_inquiries").add({
          name: orderPayload.name,
          phone: orderPayload.phone,
          email: orderPayload.email,
          service: orderPayload.service,
          message: orderPayload.message,
          timestamp: timestampStr,
          date: timestampStr,
          status: "Order via WhatsApp"
        });

        // Audit & History Activity Document
        await db.collection("history").add({
          email: orderPayload.email || orderPayload.name,
          event: `Placed Shop Order via WhatsApp (₹${cartTotal})`,
          activity: `Placed Shop Order via WhatsApp (₹${cartTotal}) by ${orderPayload.name}`,
          user: orderPayload.name,
          timestamp: timestampStr,
          type: "success"
        });
      } catch (fbErr) {
        console.warn("Firebase order save warning:", fbErr);
      }
    }

    onClearCart();
    setPaymentModalOpen(false);
    handleCloseCartDrawer();
    setQrGenerated(false);
    setPayName('');
    setPayEmail('');
    setPayMobile('');
    setPayAddress('');
    if (showAlert) showAlert("Order details sent via WhatsApp! Thank you for choosing Karpagam Traders.", "success");
  };

  // Render individual product card WITHOUT internal < > icons on the image
  const renderProductCard = (product, isSideBlur = false) => {
    if (!product) return null;
    const badgeLabel = product.category === 'daily' ? 'DAILY' : product.category === 'monthly' ? 'MONTHLY' : 'SPECIALTY';
    return (
      <div key={product.id} id={`prod-card-${product.id}`} className={`product-card-item exact-mockup-card scroll-reveal-fade revealed ${isSideBlur ? 'blur-card' : ''}`}>
        <div className="product-image-container">
          <span className="image-dark-red-badge">{badgeLabel}</span>
          
          <img 
            src={product.image} 
            alt={product.name} 
            className="product-card-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&auto=format&fit=crop';
            }}
          />

          {/* Quick View Button on Hover */}
          <div className="image-overlay-action">
            <button className="btn-quick-view" onClick={() => handleOpenOptions(product)}>
              <i className="fa-solid fa-eye"></i> View Options
            </button>
          </div>
        </div>

        <div className="product-card-details">
          <h3 className="product-title">{product.name}</h3>
          <p className="product-desc">{product.description || 'Standard daily tear-off sheet calendar with auspicious Nalla Neram.'}</p>
          
          {/* Divider Line */}
          <div className="product-card-divider"></div>

          <div className="product-card-footer">
            <div className="product-price-box">
              <span className="price-label">PRICE</span>
              <span className="price-value">₹{product.price}</span>
            </div>
            
            <button className="btn-add-cart dark-red-pill-btn" onClick={() => handleOpenOptions(product)} title="Add to Cart">
              <i className="fa-solid fa-cart-plus"></i> Add
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Category Row: 4x4 Grid on Laptop/Desktop screens, 3-Card Coverflow on Mobile screens
  const renderCoverflowRow = (list, currIndex, setIndex, rowTitle, categoryIcon, rowBadgeLabel) => {
    if (!list || list.length === 0) return null;
    const len = list.length;
    const prevItem = list[(currIndex - 1 + len) % len];
    const currItem = list[currIndex % len];
    const nextItem = list[(currIndex + 1) % len];

    const handlePrev = () => setIndex(prev => (prev === 0 ? len - 1 : prev - 1));
    const handleNext = () => setIndex(prev => (prev === len - 1 ? 0 : prev + 1));

    return (
      <div className="product-category-row-section">
        <div className="row-category-header">
          <h3 className="dark-red-title"><i className={`fa-solid ${categoryIcon}`}></i> {rowTitle}</h3>
          <span className="dark-red-badge-pill">{rowBadgeLabel} ({list.length} Products)</span>
        </div>

        {/* Laptop / Desktop View: 4-Column Grid (4*4 Product View) */}
        <div className="desktop-4col-grid-view">
          {list.map(product => renderProductCard(product, false))}
        </div>

        {/* Mobile Only View: 3-Card Coverflow Carousel */}
        <div className="coverflow-3card-wrapper mobile-only-coverflow">
          {/* Outer Left Navigation Arrow (<) */}
          <button className="row-outer-nav-btn left-nav" onClick={handlePrev} title="Previous Product">
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          {/* Left Blurred Side Card (Mobile View) */}
          <div className="side-card-blur left-blur">
            {renderProductCard(prevItem, true)}
          </div>

          {/* Main Focused Center Card */}
          <div className="center-card-main">
            {renderProductCard(currItem, false)}
          </div>

          {/* Right Blurred Side Card (Mobile View) */}
          <div className="side-card-blur right-blur">
            {renderProductCard(nextItem, true)}
          </div>

          {/* Outer Right Navigation Arrow (>) */}
          <button className="row-outer-nav-btn right-nav" onClick={handleNext} title="Next Product">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    );
  };

  return (
    <section id="shop-section" className="products-shop-wrapper">
      <div className="section-title scroll-reveal-fade revealed">
        <h2>Daily & Monthly Calendar Shop</h2>
        <p>Explore our exclusive Sivakasi offset printed tear-off daily sheets, monthly wall designs, and custom diaries</p>
      </div>

      {/* Category Filter Pills */}
      <div className="category-filter-bar">
        <button 
          className={`filter-pill ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          <i className="fa-solid fa-layer-group"></i> All Calendars ({products.length})
        </button>
        <button 
          className={`filter-pill ${activeCategory === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveCategory('daily')}
        >
          <i className="fa-solid fa-calendar-day"></i> Daily Tear-Offs ({dailyProducts.length})
        </button>
        <button 
          className={`filter-pill ${activeCategory === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveCategory('monthly')}
        >
          <i className="fa-solid fa-calendar-days"></i> Monthly Wall ({monthlyProducts.length})
        </button>
        <button 
          className={`filter-pill ${activeCategory === 'specialty' ? 'active' : ''}`}
          onClick={() => setActiveCategory('specialty')}
        >
          <i className="fa-solid fa-star"></i> Cake & Specialty ({specialtyProducts.length})
        </button>

        {/* View Cart Button */}
        <button className="cart-trigger-btn" onClick={handleOpenCartDrawer}>
          <i className="fa-solid fa-cart-shopping"></i>
          <span>View Cart</span>
          <span className="cart-badge-count">{cart.length}</span>
        </button>
      </div>

      {/* 3 CATEGORIZED ROWS */}
      <div className="categorized-rows-container">
        {/* ROW 1: DAILY TEAR-OFF CALENDARS */}
        {(activeCategory === 'all' || activeCategory === 'daily') && (
          renderCoverflowRow(
            dailyProducts, 
            dailyIndex, 
            setDailyIndex, 
            'Row 1: Daily Tear-Off Calendars', 
            'fa-calendar-day', 
            'Daily'
          )
        )}

        {/* ROW 2: MONTHLY WALL CALENDARS */}
        {(activeCategory === 'all' || activeCategory === 'monthly') && (
          renderCoverflowRow(
            monthlyProducts, 
            monthlyIndex, 
            setMonthlyIndex, 
            'Row 2: Monthly Wall Calendars', 
            'fa-calendar-days', 
            'Monthly'
          )
        )}

        {/* ROW 3: CAKE & SPECIALTY CALENDARS */}
        {(activeCategory === 'all' || activeCategory === 'specialty') && (
          renderCoverflowRow(
            specialtyProducts, 
            specialtyIndex, 
            setSpecialtyIndex, 
            'Row 3: Cake & Specialty Calendars', 
            'fa-cake-candles', 
            'Cake'
          )
        )}
      </div>

      {/* 1. OPTIONS SELECTION MODAL WITH DROPDOWN LISTS */}
      {optionsModalOpen && selectedProduct && (
        <div className="product-modal-overlay open" onClick={(e) => e.target.classList.contains('product-modal-overlay') && setOptionsModalOpen(false)}>
          <div className="product-modal-card">
            <button className="close-modal-btn" onClick={() => setOptionsModalOpen(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="modal-content-grid">
              <div className="modal-img-col">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="modal-product-img" />
              </div>

              <div className="modal-details-col">
                <span className="modal-category-tag">{selectedProduct.category.toUpperCase()} CALENDAR</span>
                <h2 className="modal-product-title">{selectedProduct.name}</h2>
                <p className="modal-product-desc">{selectedProduct.description || 'Premium Sivakasi print on high-gsm paper with gold foil title and clear daily typography.'}</p>

                {/* Quality Select Dropdown List */}
                <div className="option-group">
                  <label className="option-label"><i className="fa-solid fa-gem"></i> Select Paper & Finish Quality:</label>
                  <div className="custom-dropdown-wrap">
                    <select 
                      className="modal-select-dropdown"
                      value={selectedQuality}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                    >
                      <option value="Standard">Standard Quality (1.0x Base Price)</option>
                      <option value="Deluxe">Deluxe Gloss Print (1.2x Base Price)</option>
                      <option value="Premium Gold">Premium Gold (Gold Foil Finish - 1.5x Base Price)</option>
                    </select>
                    <i className="fa-solid fa-chevron-down dropdown-arrow-icon"></i>
                  </div>
                </div>

                {/* Size Select Dropdown List */}
                <div className="option-group">
                  <label className="option-label"><i className="fa-solid fa-ruler-combined"></i> Select Dimensions & Size:</label>
                  <div className="custom-dropdown-wrap">
                    <select 
                      className="modal-select-dropdown"
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                    >
                      <option value="A3 Wall Mount">A3 Wall Mount (12 x 18 inches)</option>
                      <option value="A4 Desk Stand">A4 Desk Stand (8.5 x 11 inches)</option>
                      <option value="Compact Tear-Off">Compact Tear-Off (Pocket Size)</option>
                    </select>
                    <i className="fa-solid fa-chevron-down dropdown-arrow-icon"></i>
                  </div>
                </div>

                {/* Price Display & Add to Cart */}
                <div className="modal-action-bar">
                  <div className="modal-price-display">
                    <span>Total Price:</span>
                    <strong>₹{Math.round(selectedProduct.price * (qualityPriceMultiplier[selectedQuality] || 1.0))}</strong>
                  </div>

                  <button className="btn-modal-confirm" onClick={handleConfirmAddToCart}>
                    <i className="fa-solid fa-cart-plus"></i> Add to Shopping Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SHOPPING CART DRAWER (RIGHT-SIDE 25% WIDTH, 100VH FULL HEIGHT) */}
      {cartOpen && (
        <div className="cart-drawer-overlay open" onClick={(e) => e.target.classList.contains('cart-drawer-overlay') && handleCloseCartDrawer()}>
          <div className="cart-drawer-card right-side-drawer">
            <div className="cart-drawer-header">
              <h3><i className="fa-solid fa-cart-shopping"></i> Shopping Cart ({cart.length})</h3>
              <button className="close-modal-btn" onClick={handleCloseCartDrawer}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="cart-drawer-body">
              {cart.map((item, idx) => (
                <div key={item.id || idx} className="cart-item-row">
                  <img src={item.image} alt={item.name} className="cart-item-img" />
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <span className="cart-item-specs">{item.quality} • {item.size}</span>
                    <span className="cart-item-price">₹{item.price}</span>
                  </div>
                  <button className="btn-remove-item" onClick={() => onRemoveFromCart(idx)} title="Remove Item">
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="empty-cart-state">
                  <i className="fa-solid fa-cart-flatbed"></i>
                  <p>Your shopping cart is empty.</p>
                  <span>Add items from our Daily, Monthly & Specialty calendars.</span>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-summary-line">
                  <span>Total Amount:</span>
                  <strong>₹{cartTotal}</strong>
                </div>

                <div className="cart-footer-buttons">
                  <button className="btn-secondary-cart" onClick={onClearCart}>
                    <i className="fa-solid fa-broom"></i> Clear
                  </button>
                  <button className="btn-primary-checkout" onClick={() => { handleCloseCartDrawer(); setPaymentModalOpen(true); }}>
                    <i className="fa-solid fa-credit-card"></i> Checkout (₹{cartTotal})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. CHECKOUT & PAYMENT UPI QR MODAL */}
      {paymentModalOpen && (
        <div className="product-modal-overlay open" onClick={(e) => e.target.classList.contains('product-modal-overlay') && setPaymentModalOpen(false)}>
          <div className="payment-modal-card">
            <div className="payment-modal-header">
              <h3><i className="fa-solid fa-cash-register"></i> Complete Order & Payment</h3>
              <button className="close-modal-btn" onClick={() => setPaymentModalOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="payment-modal-body">
              <form onSubmit={handleSendWhatsAppOrder} className="delivery-form-grid">
                <div className="form-group-full">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Full Name" 
                    value={payName}
                    onChange={(e) => setPayName(e.target.value)}
                  />
                </div>

                <div className="form-group-half">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="customer@gmail.com" 
                    value={payEmail}
                    onChange={(e) => setPayEmail(e.target.value)}
                  />
                </div>

                <div className="form-group-half">
                  <label>Mobile Number *</label>
                  <input 
                    type="tel" 
                    required 
                    pattern="[0-9]{10}"
                    placeholder="10-digit mobile number" 
                    value={payMobile}
                    onChange={(e) => setPayMobile(e.target.value)}
                  />
                </div>

                <div className="form-group-full">
                  <label>Delivery Address *</label>
                  <textarea 
                    required 
                    rows="3" 
                    placeholder="Full delivery address with pincode..."
                    value={payAddress}
                    onChange={(e) => setPayAddress(e.target.value)}
                  ></textarea>
                </div>

                <div className="order-summary-box" style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', background: '#fdf5e6', padding: '14px 18px', borderRadius: '12px', fontSize: '1rem', border: '1px solid #fde68a' }}>
                  <span>Items Total ({cart.length}):</span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>₹{cartTotal}</strong>
                </div>

                <button type="submit" className="btn-send-whatsapp" style={{
                  gridColumn: 'span 2',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '30px',
                  padding: '16px 24px',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 6px 20px rgba(37, 211, 102, 0.4)',
                  transition: 'all 0.3s ease'
                }}>
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.5rem' }}></i> Send Order via WhatsApp (₹{cartTotal})
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProductsSection;
