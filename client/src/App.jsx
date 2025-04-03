import { useState, useEffect } from 'react'
import DashboardLayout from './components/DashboardLayout'
import FRDashboard from './pages/FRDashboard'
import PTDashboard from './pages/PTDashboard'
import TemplateFRDashboard from './pages/TemplateFRDashboard'
import TemplatePTDashboard from './pages/TemplatePTDashboard'
import './App.css'

function App() {
  const [activeCountry, setActiveCountry] = useState('fr')
  const [availableCountries, setAvailableCountries] = useState(['fr', 'pt'])
  const [useTemplate, setUseTemplate] = useState(false)

  // Function to handle country changes
  const handleCountryChange = (country) => {
    if (availableCountries.includes(country)) {
      setActiveCountry(country);
    } else {
      console.warn(`Dashboard for ${country} is not available`);
      // Fallback to FR if selected country is not available
      setActiveCountry('fr');
    }
  }

  // Function to toggle between original and template dashboards
  const toggleTemplate = () => {
    setUseTemplate(!useTemplate);
  }

  return (
    <>
      <div className="template-toggle">
        <span>Dashboard Version: </span>
        <button 
          className={!useTemplate ? 'active' : ''} 
          onClick={() => setUseTemplate(false)}
        >
          Original
        </button>
        <button 
          className={useTemplate ? 'active' : ''} 
          onClick={() => setUseTemplate(true)}
        >
          Template
        </button>
      </div>
      
      <DashboardLayout 
        activeCountry={activeCountry} 
        onCountryChange={handleCountryChange}
        availableCountries={availableCountries}
      >
        {/* FR Dashboards */}
        {activeCountry === 'fr' && !useTemplate && <FRDashboard />}
        {activeCountry === 'fr' && useTemplate && <TemplateFRDashboard />}
        
        {/* PT Dashboards */}
        {activeCountry === 'pt' && !useTemplate && <PTDashboard />}
        {activeCountry === 'pt' && useTemplate && <TemplatePTDashboard />}
      </DashboardLayout>
    </>
  )
}

export default App
