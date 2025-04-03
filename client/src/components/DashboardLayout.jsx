import { useState } from 'react';

const DashboardLayout = ({ children, activeCountry, onCountryChange, availableCountries = ['fr'] }) => {
  const handleCountryChange = (country) => {
    if (onCountryChange) {
      onCountryChange(country);
    }
  };

  // Country name mapping for display
  const countryNames = {
    'fr': 'FR',
    'pt': 'PT',
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>BMW Marketing Dashboard</h1>
        <nav className="country-navigation">
          {availableCountries.map(country => (
            <button 
              key={country}
              className={activeCountry === country ? 'active' : ''} 
              onClick={() => handleCountryChange(country)}
            >
              {countryNames[country] || country}
            </button>
          ))}
        </nav>
      </header>
      <main className="dashboard-content">
        {children}
      </main>
      <footer className="dashboard-footer">
        <p>&copy; {new Date().getFullYear()} BMW Marketing</p>
      </footer>
    </div>
  );
};

export default DashboardLayout; 