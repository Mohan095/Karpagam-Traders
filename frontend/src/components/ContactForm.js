import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import apiService from '../api';

function ContactForm({ selectedService, onClearService, showAlert }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  // Sync selectedService prop from Showcase cards selection
  useEffect(() => {
    if (selectedService) {
      let defaultMsg = '';
      if (selectedService === 'Calendar Printing') {
        defaultMsg = "Hi, I would like to order a Custom Tamil Calendar (Wall / Desk size). Please share pricing details.";
      }
      setFormData(prev => ({ 
        ...prev, 
        service: selectedService,
        message: defaultMsg || prev.message
      }));
    }
  }, [selectedService]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    let val = value;
    
    // Custom restrictions matching index.html
    if (id === 'msg-name') {
      val = value.replace(/[^A-Za-z\s]/g, '');
    } else if (id === 'msg-phone') {
      val = value.replace(/[^0-9]/g, '').slice(0, 10);
    } else if (id === 'msg-email') {
      val = value.toLowerCase();
    }

    const fieldMap = {
      'msg-name': 'name',
      'msg-phone': 'phone',
      'msg-email': 'email',
      'msg-service': 'service',
      'msg-content': 'message'
    };

    setFormData(prev => ({ ...prev, [fieldMap[id]]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let pythonSuccess = false;
    let firebaseSuccess = false;
    let errorDetail = '';

    const payload = {
      name: formData.name || 'Anonymous Customer',
      phone: formData.phone || '',
      email: formData.email || '',
      service: formData.service || 'Daily Calendar',
      message: formData.message || 'General Inquiry'
    };

    // 1. Send data to Python FastAPI Backend
    try {
      await apiService.submitContactForm(payload);
      pythonSuccess = true;
    } catch (pyErr) {
      console.warn("Python API submit failed, trying local direct fetch:", pyErr);
      try {
        const response = await fetch('http://127.0.0.1:8000/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) pythonSuccess = true;
      } catch (directErr) {
        console.warn("Direct Python backend fetch error:", directErr);
        errorDetail = directErr.message;
      }
    }

    // 2. Save inquiry to Firebase Firestore if initialized
    if (db) {
      try {
        const now = new Date();
        const timestampStr = now.getFullYear() + '-' +
          String(now.getMonth() + 1).padStart(2, '0') + '-' +
          String(now.getDate()).padStart(2, '0') + ' ' +
          String(now.getHours()).padStart(2, '0') + ':' +
          String(now.getMinutes()).padStart(2, '0') + ':' +
          String(now.getSeconds()).padStart(2, '0');

        await db.collection("customer_inquiries").add({
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          service: payload.service,
          message: payload.message,
          timestamp: timestampStr,
          status: "Pending"
        });
        firebaseSuccess = true;
      } catch (fbErr) {
        console.warn("Firebase collection write warning:", fbErr);
      }
    }

    // Determine Toast Alert Outcome
    if (pythonSuccess || firebaseSuccess) {
      if (showAlert) {
        showAlert('✅ Message Sent Successfully! Our team will contact you shortly.', 'success');
      }
      setFormData({ name: '', phone: '', email: '', service: 'Daily Calendar', message: '' });
      if (onClearService) onClearService();
    } else {
      if (showAlert) {
        showAlert(`❌ Failed to send message. ${errorDetail ? '(' + errorDetail + ')' : 'Please check your connection.'}`, 'error');
      }
    }

    setLoading(false);
  };

  return (
    <section className="contact-section" id="contact" style={{ paddingTop: '50px' }}>
      {/* Integrated About Us Company Banner */}
      <div className="about-company-banner scroll-reveal-fade revealed" style={{
        background: 'linear-gradient(135deg, rgba(139,0,0,0.05) 0%, rgba(220,38,38,0.08) 100%)',
        borderRadius: '24px',
        padding: '36px 30px',
        marginBottom: '50px',
        border: '1px solid rgba(139,0,0,0.12)',
        boxShadow: '0 10px 30px rgba(139,0,0,0.05)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '850px', margin: '0 auto' }}>
          <span style={{ 
            background: 'var(--primary)', 
            color: 'white', 
            padding: '6px 16px', 
            borderRadius: '20px', 
            fontSize: '0.8rem', 
            fontWeight: 800, 
            letterSpacing: '1px', 
            textTransform: 'uppercase',
            display: 'inline-block',
            marginBottom: '14px'
          }}>
            <i className="fa-solid fa-award" style={{ marginRight: '6px' }}></i> About Karpagam Traders
          </span>
          <h2 style={{ 
            fontFamily: 'var(--font-heading)', 
            color: 'var(--primary)', 
            fontSize: '2.2rem', 
            fontWeight: 800, 
            marginBottom: '14px',
            lineHeight: 1.25
          }}>
            Sivakasi's Premier Calendar & Offset Printing Hub
          </h2>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '1.05rem', 
            lineHeight: 1.7, 
            marginBottom: '28px' 
          }}>
            Located in the printing capital of India—Sivakasi—Karpagam Traders has been delivering top-tier offset printing services for over 10 years. We specialize in Tamil Daily Tear-Off Calendars, 12-Sheet Monthly Wall Calendars, customized business diaries, and corporate stationery.
          </p>

          {/* Quick About Stats Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '16px',
            marginTop: '20px'
          }}>
            <div style={{ background: 'white', padding: '16px 20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>10+ Years</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Printing Excellence</div>
            </div>
            <div style={{ background: 'white', padding: '16px 20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>500+</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Corporate Clients</div>
            </div>
            <div style={{ background: 'white', padding: '16px 20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>100%</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>High-GSM Quality</div>
            </div>
            <div style={{ background: 'white', padding: '16px 20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>Pan-India</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Fast Shipping</div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-title scroll-reveal-fade revealed">
        <h2>Get In Touch & Send Inquiry</h2>
        <p>Have questions about bulk calendar orders or custom printing? Contact us today!</p>
      </div>

      <div className="contact-grid">
        <div className="card scroll-reveal-fade revealed">
          <h3>Send us a message</h3>
          <form onSubmit={handleSubmit} noValidate>
            {/* Name Field */}
            <div className="input-wrapper">
              <input 
                type="text" 
                id="msg-name" 
                required 
                placeholder=" "
                value={formData.name}
                onChange={handleChange}
              />
              <label htmlFor="msg-name">Your Name <small style={{ fontSize: '0.7rem', opacity: 0.6 }}>(3–20 letters)</small></label>
              <i className="fa-solid fa-user input-icon"></i>
            </div>

            {/* Mobile Field */}
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <span id="phone-prefix" style={{
                position: 'absolute', left: '45px', top: '50%', transform: 'translateY(-50%)',
                fontWeight: 700, color: 'var(--text-dark)', zIndex: 10, pointerEvents: 'none', fontSize: '0.95rem'
              }}>+91</span>
              <input 
                type="tel" 
                id="msg-phone" 
                required 
                placeholder=" "
                style={{ paddingLeft: '82px' }}
                value={formData.phone}
                onChange={handleChange}
              />
              <label htmlFor="msg-phone" style={{ left: '82px' }}>Mobile Number <small style={{ fontSize: '0.7rem', opacity: 0.6 }}>(10 digits)</small></label>
              <i className="fa-solid fa-phone input-icon"></i>
            </div>

            {/* Email Field */}
            <div className="input-wrapper">
              <input 
                type="email" 
                id="msg-email" 
                required 
                placeholder=" "
                value={formData.email}
                onChange={handleChange}
              />
              <label htmlFor="msg-email">Email ID <small style={{ fontSize: '0.7rem', opacity: 0.6 }}>(@gmail.com only)</small></label>
              <i className="fa-solid fa-envelope input-icon"></i>
            </div>

            {/* Service Selection */}
            <div className="input-wrapper">
              <select 
                id="msg-service" 
                required
                value={formData.service}
                onChange={handleChange}
              >
                <option value="" disabled hidden></option>
                <option value="Calendar Printing">Calendar Printing</option>
                <option value="Business Cards">Business Cards</option>
                <option value="Brochures & Flyers">Brochures & Flyers</option>
                <option value="Wedding Cards">Wedding Cards</option>
                <option value="Banners & Posters">Banners & Posters</option>
                <option value="Custom Printing">Custom Printing</option>
              </select>
              <label htmlFor="msg-service">Select Service</label>
              <i className="fa-solid fa-tags input-icon"></i>
            </div>

            {/* Message Field */}
            <div className="input-wrapper">
              <textarea 
                id="msg-content" 
                required 
                placeholder=" "
                value={formData.message}
                onChange={handleChange}
              ></textarea>
              <label htmlFor="msg-content">Your Message</label>
              <i className="fa-solid fa-comment-dots input-icon"></i>
            </div>

            <button type="submit" className="whatsapp-btn" style={{ pointerEvents: loading ? 'none' : 'auto' }}>
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Sending Message...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane" style={{ marginRight: '8px' }}></i> Send Message
                </>
              )}
            </button>
          </form>
        </div>

        <div className="card info-card scroll-reveal-fade revealed">
          <h3>Business Details</h3>
          <ul className="info-list" style={{ marginBottom: '25px' }}>
            <li>
              <i className="fa-solid fa-building"></i>
              <div>
                <strong>Karpagam Traders</strong>
                <span>Sivakasi's premium print house. Delivering outstanding calendar, corporate stationery, and customized prints.</span>
              </div>
            </li>
            <li>
              <i className="fa-solid fa-clock"></i>
              <div>
                <strong>Business Hours</strong>
                <span>Monday - Saturday: 9:00 AM - 8:00 PM<br />Sunday: 10:00 AM - 6:00 PM</span>
              </div>
            </li>
            <li>
              <i className="fa-solid fa-map-location-dot"></i>
              <div>
                <strong>Map Directions</strong>
                <span>Sn Puram Road, Thiruthangal, Sivakasi, Tamil Nadu, 626130</span>
              </div>
            </li>
          </ul>
          <div className="quick-action-btns">
            <a href="https://wa.me/919566801402" target="_blank" rel="noopener noreferrer" className="quick-btn wa"><i className="fa-brands fa-whatsapp"></i> Chat</a>
            <a href="tel:+919566801402" className="quick-btn phone"><i className="fa-solid fa-phone"></i> Call</a>
            <a href="mailto:Karpagamtraderssivakasi@gmail.com" className="quick-btn mail"><i className="fa-solid fa-envelope"></i> Email</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactForm;
