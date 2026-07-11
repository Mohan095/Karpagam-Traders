import React, { useState, useEffect } from 'react';

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
    try {
      // Sending data to Python Backend
      const response = await fetch('http://127.0.0.1:8000/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData) // உங்க ஃபார்ம் டேட்டா
      });

      if (response.ok) {
        // உங்களுடைய அழகான Success Toast-ஐ இங்கே கொடுக்கவும்
        showAlert('✅ Message Sent to Python Successfully!', 'success'); 
        setFormData({ name: '', phone: '', email: '', service: 'Daily Calendar', message: '' });
        if (onClearService) onClearService();
      } else {
        // உங்களுடைய Error Toast-ஐ இங்கே கொடுக்கவும்
        showAlert('❌ Failed to send message.', 'error'); 
      }
    } catch (error) {
      showAlert('Error: Check if Python server is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact-section" id="contact">
      <div className="section-title scroll-reveal-fade revealed">
        <h2>Get In Touch</h2>
        <p>Ready to bring your printing ideas to life? Contact us today!</p>
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
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Sending securely to Python Backend...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane" style={{ marginRight: '8px' }}></i> Send Message to Python Backend
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
