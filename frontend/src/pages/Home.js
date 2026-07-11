import React from 'react';
import Hero from '../components/Hero';
import CalendarShowcase from '../components/CalendarShowcase';
import ContactForm from '../components/ContactForm';

const Home = ({ selectedService, onSelectService, onClearService }) => {
  return (
    <>
      {/* Hero section banner */}
      <Hero />

      {/* Calendar showcase portfolios */}
      <CalendarShowcase onSelectService={onSelectService} />

      {/* Contact inquiries form */}
      <ContactForm 
        selectedService={selectedService} 
        onClearService={onClearService} 
      />
    </>
  );
};

export default Home;
