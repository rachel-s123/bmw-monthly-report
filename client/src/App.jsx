import { useState } from 'react'
import DashboardLayout from './components/DashboardLayout'
import FranceDashboard from './pages/FranceDashboard'
import './App.css'

function App() {
  const [activeCountry, setActiveCountry] = useState('france')

  return (
    <DashboardLayout>
      <FranceDashboard />
    </DashboardLayout>
  )
}

export default App
