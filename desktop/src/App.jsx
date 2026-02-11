import { useState, useEffect } from 'react'
import './index.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function App() {
  const [session, setSession] = useState(null)
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check local storage for session
    const saved = localStorage.getItem('synthetix-session')
    if (saved) {
      try {
        setSession(JSON.parse(saved))
      } catch (e) {
        localStorage.removeItem('synthetix-session')
      }
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchDevices()
      const interval = setInterval(fetchDevices, 5000) // Poll for updates (simple fallback to WS)
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchDevices = async () => {
    try {
      // Use mock fetch for now if backend fails or add error handling
      const res = await fetch(`${API_URL}/devices`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setDevices(data)
    } catch (e) {
      console.error(e)
      // Fallback mock
      if (!devices.length) {
        setDevices([
          { id: '1', name: 'Virtual Light (Mock)', device_type: 'virtual_light', state: { on: false, brightness: 50 }, user_id: 'mock-user' }
        ])
      }
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const email = e.target.email.value
    const password = e.target.password.value

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (res.ok) {
        setSession(data)
        localStorage.setItem('synthetix-session', JSON.stringify(data))
      } else {
        setMessage(data.detail || 'Login failed')
      }
    } catch (e) {
      // Mock fallback for dev without backend
      if (email === 'demo@example.com') {
        const mockSession = { user: { email }, access_token: 'mock-token' }
        setSession(mockSession)
        localStorage.setItem('synthetix-session', JSON.stringify(mockSession))
      } else {
        setMessage('Connection error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setSession(null)
    localStorage.removeItem('synthetix-session')
    setDevices([])
  }

  const toggleDevice = async (device) => {
    // Optimistic update
    setDevices(prev => prev.map(d => d.id === device.id ? { ...d, state: { ...d.state, on: !d.state?.on } } : d))

    try {
      await fetch(`${API_URL}/devices/${device.id}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ command: 'set_state', params: { on: !device.state?.on } })
      })
      fetchDevices() // Refresh state
    } catch (e) {
      console.error(e)
      fetchDevices() // Revert
    }
  }

  if (!session) {
    return (
      <div className="login-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="card" style={{ width: '400px' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--color-primary)' }}>Synthetix OS</h1>
          <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--color-text-secondary)' }}>Desktop Client</p>

          <form onSubmit={handleLogin}>
            <input name="email" type="email" placeholder="Email" className="input-field" required />
            <input name="password" type="password" placeholder="Password" className="input-field" required />

            {message && <div style={{ color: 'var(--color-error)', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}

            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
            Build v0.0.1 (Electron)
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', background: 'white', borderRight: '1px solid var(--color-border)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '30px', height: '30px', background: 'var(--color-primary)', borderRadius: '8px' }}></div>
          <h2 style={{ fontSize: '1.2rem' }}>Synthetix OS</h2>
        </div>

        <nav style={{ flex: 1 }}>
          <a href="#" style={{ display: 'block', padding: '10px', borderRadius: '8px', background: 'var(--color-background)', color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '5px', textDecoration: 'none' }}>
            📱 Devices
          </a>
          <a href="#" style={{ display: 'block', padding: '10px', borderRadius: '8px', color: 'var(--color-text-secondary)', marginBottom: '5px', textDecoration: 'none' }}>
            📂 Files
          </a>
          <a href="#" style={{ display: 'block', padding: '10px', borderRadius: '8px', color: 'var(--color-text-secondary)', marginBottom: '5px', textDecoration: 'none' }}>
            ⚙️ Settings
          </a>
        </nav>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>{session.user.email}</div>
          <button onClick={handleLogout} style={{ color: 'var(--color-error)', background: 'none' }}>Log Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2rem' }}>Dashboard</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-primary" onClick={fetchDevices}>Refresh</button>
          </div>
        </header>

        <section>
          <h3 style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>Active Devices</h3>

          {devices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
              <p>No devices found.</p>
            </div>
          ) : (
            <div className="grid">
              {devices.map(device => (
                <div key={device.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: '48px', height: '48px', background: '#f0f7ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                      {device.device_type === 'virtual_light' ? '💡' : device.device_type === 'socket' ? '🔌' : '📱'}
                    </div>
                    {device.state && 'on' in device.state && (
                      <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                        <input
                          type="checkbox"
                          checked={device.state.on}
                          onChange={() => toggleDevice(device)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: device.state.on ? 'var(--color-primary)' : '#ccc',
                          borderRadius: '34px', transition: '.4s'
                        }}>
                          <span style={{
                            position: 'absolute', content: '""', height: '20px', width: '20px', left: '4px', bottom: '4px',
                            backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                            transform: device.state.on ? 'translateX(22px)' : 'translateX(0)'
                          }}></span>
                        </span>
                      </label>
                    )}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{device.name}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                      {device.device_type} • {device.state?.on ? 'Active' : 'Offline'}
                    </p>
                  </div>

                  {device.state && device.state.brightness !== undefined && (
                    <div style={{ marginTop: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px', color: '#666' }}>
                        <span>Brightness</span>
                        <span>{device.state.brightness}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${device.state.brightness}%`, height: '100%', background: 'var(--color-secondary)' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
