import React from 'react';

function CalendarShowcase({ onOpenMonthlyModal, onOpenDailyModal }) {
  return (
    <section className="showcase-section" id="calendar-section">
      <div className="section-title scroll-reveal-fade revealed">
        <h2>Calendar Showcase</h2>
        <p>Beautiful calendar designs that combine tradition with modern aesthetics</p>
      </div>

      <div className="calendar-grid">
        {/* Monthly Calendar Card */}
        <div className="calendar-card scroll-reveal-fade revealed" id="monthly-card">
          <div className="calendar-card-header monthly-gradient">
            <div className="showcase-badge">Best Seller</div>
            <div className="mini-sheet">
              <div className="sheet-binder"></div>
              <div className="sheet-logo">Karpagam</div>
              <div className="sheet-month">ஆடி / JULY</div>
              <div className="sheet-grid-preview">
                <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span className="active"></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
              </div>
            </div>
          </div>
          <div className="calendar-content">
            <h3>Monthly Wall Calendars</h3>
            <p>Traditional Tamil calendar sheets with high-quality printing, modern fonts, and vibrant color palettes. Ideal for corporate branding and home displays.</p>
            <button className="btn-card" onClick={onOpenMonthlyModal}>
              <i className="fa-solid fa-calendar-check" style={{ marginRight: '8px' }}></i> Order Monthly Calendar
            </button>
          </div>
        </div>

        {/* Daily Calendar Card */}
        <div className="calendar-card scroll-reveal-fade revealed" id="daily-card">
          <div className="calendar-card-header daily-gradient">
            <div className="showcase-badge">Premium</div>
            <div className="mini-sheet daily-sheet">
              <div className="sheet-binder-metal"></div>
              <div className="sheet-logo">Karpagam</div>
              <div className="sheet-day-num">09</div>
              <div className="sheet-day-info">வியாழன் | THURSDAY</div>
              <div className="sheet-auspicious">சுப முகூர்த்தம்</div>
            </div>
          </div>
          <div className="calendar-content">
            <h3>Daily Tear-off Calendars</h3>
            <p>Highly detailed daily sheets featuring auspicious timings, Nalla Neram, Thithi, Nakshatram, and customized spiritual illustrations or branding.</p>
            <button className="btn-card" onClick={onOpenDailyModal}>
              <i className="fa-solid fa-calendar-plus" style={{ marginRight: '8px' }}></i> Order Daily Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="features-grid">
        <div className="feature-card scroll-reveal-fade revealed">
          <div className="feature-icon"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
          <h3>Custom Designs</h3>
          <p>Personalized layouts, custom photos, and logo branding tailored specifically to represent your corporate identity.</p>
        </div>
        <div className="feature-card scroll-reveal-fade revealed">
          <div className="feature-icon"><i className="fa-solid fa-cubes"></i></div>
          <h3>Multiple Formats</h3>
          <p>Choose from wall hanging designs, executive desk triangular stands, compact pocket size, or multi-sheet layouts.</p>
        </div>
        <div className="feature-card scroll-reveal-fade revealed">
          <div className="feature-icon"><i className="fa-solid fa-truck-fast"></i></div>
          <h3>Quick Delivery</h3>
          <p>Efficient production runs backed by Sivakasi's high-speed printing infrastructure ensures shipping timelines are always met.</p>
        </div>
      </div>
    </section>
  );
}

export default CalendarShowcase;
