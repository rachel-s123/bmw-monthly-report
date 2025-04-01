import { useState, useEffect } from 'react'
import DashboardLayout from './components/DashboardLayout'
import FranceDashboard from './pages/FranceDashboard'
import PortugalDashboard from './pages/PortugalDashboard'
import './App.css'

function App() {
  const [activeCountry, setActiveCountry] = useState('france')
  const [availableCountries, setAvailableCountries] = useState(['france', 'portugal'])

  // Function to handle country changes
  const handleCountryChange = (country) => {
    if (availableCountries.includes(country)) {
      setActiveCountry(country);
    } else {
      console.warn(`Dashboard for ${country} is not available`);
      // Fallback to France if selected country is not available
      setActiveCountry('france');
    }
  }

  return (
    <DashboardLayout 
      activeCountry={activeCountry} 
      onCountryChange={handleCountryChange}
      availableCountries={availableCountries}
    >
      {activeCountry === 'france' && <FranceDashboard />}
      {activeCountry === 'portugal' && <PortugalDashboard />}
    </DashboardLayout>
  )
}

export default App
