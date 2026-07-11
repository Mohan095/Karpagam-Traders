import React, { useState, useEffect } from 'react';

const TAMIL_MONTHS = [
  'சித்திரை', 'வைகாசி', 'ஆனி', 'ஆடி', 'ஆவணி', 'புரட்டாசி',
  'ஐப்பசி', 'கார்த்திகை', 'மார்கழி', 'தை', 'மாசி', 'பங்குனி'
];
const TAMIL_WEEKDAYS = ['ஞாயிற்றுக்கிழமை', 'திங்கட்கிழமை', 'செவ்வாய்க்கிழமை', 'புதன்கிழமை', 'வியாழக்கிழமை', 'வெள்ளிக்கிழமை', 'சனிக்கிழமை'];
const ENG_MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const ENG_WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const RAHU_KALAM = ['4:30-6:00', '7:30-9:00', '3:00-4:30', '12:00-1:30', '1:30-3:00', '10:30-12:00', '9:00-10:30'];
const NALLA_NERAM = ['6:00-7:30', '7:30-9:00', '6:00-7:30', '10:30-12:00', '6:00-7:30', '6:00-7:30', '6:00-7:30'];

const TITHIS = [
  'பிரதமை', 'துவிதியை', 'திருதியை', 'சதுர்த்தி', 'பஞ்சமி',
  'சஷ்டி', 'சப்தமி', 'அஷ்டமி', 'நவமி', 'தசமி',
  'ஏகாதசி', 'துவாதசி', 'திரயோதசி', 'சதுர்தசி', 'பௌர்ணமி',
  'பிரதமை', 'துவிதியை', 'திருதியை', 'சதுர்த்தி', 'பஞ்சமி',
  'சஷ்டி', 'சப்தமி', 'அஷ்டமி', 'நவமி', 'தசமி',
  'ஏகாதசி', 'துவாதசி', 'திரயோதசி', 'சதுர்தசி', 'அமாவாசை'
];

const NAKSHATRAS = [
  'அசுவினி', 'பரணி', 'கார்த்திகை', 'ரோகிணி', 'மிருகசீரிஷம்', 'திருவாதிரை',
  'புனர்பூசம்', 'பூசம்', 'ஆயில்யம்', 'மகம்', 'பூரம்', 'உத்திரம்',
  'அஸ்தம்', 'சித்திரை', 'சுவாதி', 'விசாகம்', 'அனுஷம்', 'கேட்டை',
  'மூலம்', 'பூராடம்', 'உத்திராடம்', 'திருவோணம்', 'அவிட்டம்', 'சதயம்',
  'பூரட்டாதி', 'உத்திரட்டாதி', 'ரேவதி'
];

const CORP_QUOTES = [
  '"Quality is never an accident; it is always the result of intelligent effort."',
  '"Excellence is doing ordinary things extraordinarily well."',
  '"The secret of getting ahead is getting started."',
  '"Strive not to be a success, but rather to be of value."',
  '"Great things are not done by impulse, but by a series of small things."',
  '"The way to get started is to quit talking and begin doing."',
  '"Believe you can and you are halfway there."',
  '"Perfection is not attainable, but if we chase it we catch excellence."',
  '"It always seems impossible until it is done."',
  '"Your work is going to fill a large part of your life. Do great work."',
  '"Innovation distinguishes between a leader and a follower."',
  '"Success is not the key to happiness. Happiness is the key to success."'
];

function Hero() {
  const [widgetStyle, setWidgetStyle] = useState('traditional'); // 'traditional' or 'corporate'
  const [widgetFormat, setWidgetFormat] = useState('daily'); // 'daily' or 'monthly'
  const [fade, setFade] = useState(false);
  const [todayInfo, setTodayInfo] = useState(null);

  // Tamil Date Approximation helper
  const getTamilDate = (date) => {
    const year = date.getFullYear();
    const tamilMonthStarts = [
      new Date(year, 3, 14),
      new Date(year, 4, 15),
      new Date(year, 5, 15),
      new Date(year, 6, 16),
      new Date(year, 7, 17),
      new Date(year, 8, 17),
      new Date(year, 9, 18),
      new Date(year, 10, 16),
      new Date(year, 11, 16),
      new Date(year + 1, 0, 14),
      new Date(year + 1, 1, 13),
      new Date(year + 1, 2, 15)
    ];

    const prevStarts = [
      new Date(year - 1, 3, 14),
      new Date(year - 1, 4, 15),
      new Date(year - 1, 5, 15),
      new Date(year - 1, 6, 16),
      new Date(year - 1, 7, 17),
      new Date(year - 1, 8, 17),
      new Date(year - 1, 9, 18),
      new Date(year - 1, 10, 16),
      new Date(year - 1, 11, 16),
      new Date(year, 0, 14),
      new Date(year, 1, 13),
      new Date(year, 2, 15)
    ];

    const allStarts = [...prevStarts, ...tamilMonthStarts].sort((a, b) => a - b);
    const allNames = [...TAMIL_MONTHS, ...TAMIL_MONTHS];

    let tMonth = TAMIL_MONTHS[0], tDay = 1;
    for (let i = allStarts.length - 1; i >= 0; i--) {
      if (date >= allStarts[i]) {
        tMonth = allNames[i % TAMIL_MONTHS.length];
        tDay = Math.floor((date - allStarts[i]) / 86400000) + 1;
        break;
      }
    }
    return { month: tMonth, day: tDay };
  };

  useEffect(() => {
    const now = new Date();
    const dow = now.getDay();
    const date = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();

    const start = new Date(year, 0, 0);
    const doy = Math.floor((now - start) / 86400000);

    const tithi = TITHIS[doy % TITHIS.length];
    const nakshatra = NAKSHATRAS[doy % NAKSHATRAS.length];
    const quote = CORP_QUOTES[doy % CORP_QUOTES.length];
    const tamilDate = getTamilDate(now);

    setTodayInfo({
      date, month, year, dow,
      tamilMonth: tamilDate.month,
      tamilDay: tamilDate.day,
      tamilWeek: TAMIL_WEEKDAYS[dow],
      engMonth: ENG_MONTHS[month],
      engWeek: ENG_WEEKDAYS[dow],
      rahuKalam: RAHU_KALAM[dow],
      nallaNeram: NALLA_NERAM[dow],
      tithi, nakshatra, quote
    });
  }, []);

  const handleStyleChange = (style) => {
    if (widgetStyle === style) return;
    setFade(true);
    setTimeout(() => {
      setWidgetStyle(style);
      setFade(false);
    }, 300);
  };

  const handleFormatChange = (format) => {
    if (widgetFormat === format) return;
    setFade(true);
    setTimeout(() => {
      setWidgetFormat(format);
      setFade(false);
    }, 300);
  };

  const scrollInquire = (e) => {
    e.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderMonthlyGrid = () => {
    if (!todayInfo) return null;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const isTrad = widgetStyle === 'traditional';
    const hdrs = isTrad ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const monthLabel = isTrad
      ? `${todayInfo.tamilMonth} - ${ENG_MONTHS[month]} ${year}`
      : `${ENG_MONTHS[month]} ${year}`;

    const gridCells = [];
    // empty cells
    for (let e = 0; e < firstDay; e++) {
      gridCells.push(<span key={`empty-${e}`} className="grid-day empty"></span>);
    }
    // day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today;
      const isAuspicious = !isToday && (d % 7 === 3 || d % 7 === 0);
      let cls = 'grid-day';
      if (isToday) cls += isTrad ? ' auspicious' : ' highlight';
      else if (isAuspicious && isTrad) cls += ' auspicious';

      gridCells.push(<span key={`day-${d}`} className={cls}>{d}</span>);
    }

    return (
      <div className={isTrad ? 'monthly-view traditional' : 'monthly-view corporate'}>
        <div className={isTrad ? 'month-name' : 'corp-month-name'}>{monthLabel}</div>
        <div className="mini-calendar-grid">
          {hdrs.map((h, i) => <div key={`hdr-${i}`} className="grid-header">{h}</div>)}
          {gridCells}
        </div>
      </div>
    );
  };

  return (
    <section className="hero-section" id="home">
      <div className="hero-container">
        <div className="hero-content scroll-reveal-fade revealed">
          <span className="hero-badge"><i className="fa-solid fa-star"></i> Sivakasi's Premier Printing House</span>
          <h1>Premium <span class="gradient-text">Printing</span> Services</h1>
          <p>
            Transform your ideas into stunning prints. From calendars to business materials, we deliver exceptional
            quality that makes your brand shine.
          </p>
          <div className="hero-buttons">
            <a className="btn-primary" href="#contact" onClick={scrollInquire}><i className="fa-solid fa-paper-plane"></i> Get Quote Now</a>
            <a className="btn-secondary" href="tel:+919566801402"><i class="fa-solid fa-phone-volume"></i> Call Us</a>
          </div>
        </div>

        <div className="hero-widget-container scroll-reveal-fade revealed">
          {/* Interactive Live Calendar Widget */}
          {todayInfo && (
            <div className="calendar-widget" id="hero-calendar-widget">
              <div className="calendar-hanger">
                <span className="ring"></span>
                <span className="ring"></span>
              </div>
              <div className="calendar-page">
                <div className="calendar-page-header">
                  <span className="brand-small">Karpagam Traders</span>
                  <div className="widget-controls">
                    <button 
                      className={`widget-btn ${widgetStyle === 'traditional' ? 'active' : ''}`} 
                      onClick={() => handleStyleChange('traditional')}
                    >
                      Tamil Devotional
                    </button>
                    <button 
                      className={`widget-btn ${widgetStyle === 'corporate' ? 'active' : ''}`} 
                      onClick={() => handleStyleChange('corporate')}
                    >
                      Modern Elite
                    </button>
                  </div>
                </div>

                <div className={`calendar-page-body ${fade ? 'fade-out' : ''}`} id="widget-calendar-content">
                  {widgetFormat === 'daily' ? (
                    widgetStyle === 'traditional' ? (
                      <div className="daily-view traditional">
                        <div className="deity-header">
                          <div className="deity-title">ஸ்ரீ மகா கணபதி</div>
                        </div>
                        <div className="date-row">
                          <div className="tamil-month">{todayInfo.tamilMonth} {todayInfo.tamilDay}</div>
                          <div className="main-date">{String(todayInfo.date).padStart(2, '0')}</div>
                          <div className="week-day">{todayInfo.tamilWeek}</div>
                        </div>
                        <div className="details-grid">
                          <div><span>நல்ல நேரம்:</span> {todayInfo.nallaNeram}</div>
                          <div><span>ராகு காலம்:</span> {todayInfo.rahuKalam}</div>
                          <div><span>திதி:</span> {todayInfo.tithi}</div>
                          <div><span>நட்சத்திரம்:</span> {todayInfo.nakshatra}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="daily-view corporate">
                        <div className="corp-header">{todayInfo.engMonth} {todayInfo.year}</div>
                        <div className="corp-date">{String(todayInfo.date).padStart(2, '0')}</div>
                        <div className="corp-month">{todayInfo.engWeek}</div>
                        <div className="corp-quote">{todayInfo.quote}</div>
                      </div>
                    )
                  ) : (
                    renderMonthlyGrid()
                  )}
                </div>

                <div className="calendar-page-footer">
                  <div className="format-toggles">
                    <button 
                      className={`format-btn ${widgetFormat === 'daily' ? 'active' : ''}`} 
                      onClick={() => handleFormatChange('daily')}
                    >
                      Daily Page
                    </button>
                    <button 
                      className={`format-btn ${widgetFormat === 'monthly' ? 'active' : ''}`} 
                      onClick={() => handleFormatChange('monthly')}
                    >
                      Monthly Sheet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Hero;
