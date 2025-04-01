import { useState } from 'react';

const DashboardLayout = ({ children }) => {
  const [activeCountry, setActiveCountry] = useState('france');

  const handleCountryChange = (country) => {
    setActiveCountry(country);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>BMW Marketing Dashboard</h1>
        <nav className="country-navigation">
          <button 
            className={activeCountry === 'france' ? 'active' : ''} 
            onClick={() => handleCountryChange('france')}
          >
            France
          </button>
          <button 
            className={activeCountry === 'germany' ? 'active' : ''} 
            onClick={() => handleCountryChange('germany')}
          >
            Germany
          </button>
          <button 
            className={activeCountry === 'uk' ? 'active' : ''} 
            onClick={() => handleCountryChange('uk')}
          >
            UK
          </button>
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