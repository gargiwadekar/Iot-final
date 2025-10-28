import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Toast from '../components/Toast'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '' })
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const nav = useNavigate()

  const validate = () => {
    const { username, email, phone, password } = form
    const errors = []

    if (!username.trim()) errors.push('Username is required')
    if (!email.trim()) errors.push('Email is required')
    if (!phone.trim()) errors.push('Phone number is required')
    if (!password.trim()) errors.push('Password is required')

    if (username && (username.length < 4 || username.length > 8))
      errors.push('Username must be 4–8 characters long')

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
    if (email && !emailOk) errors.push('Enter a valid email address')

    const phoneOk = /^[0-9]{10}$/.test(phone)
    if (phone && !phoneOk) errors.push('Phone number must be exactly 10 digits')

    if (errors.length) {
      setToast({ message: errors.join(' | '), type: 'error' })
      return false
    }
    return true
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await api.post('/register', form)
      setToast({ message: '✅ Registered successfully! Please login.', type: 'success' })
      setTimeout(() => nav('/login'), 1200)
    } catch (err) {
      setToast({
        message: err?.response?.data?.message || 'Server error',
        type: 'error'
      })
    }
  }

  return (
    <div className="auth-bg">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <h1 className="auth-title">Welcome to Digital Notice Board</h1>
      <p className="auth-sub">Please register to continue</p>

      <form className="card" onSubmit={submit} noValidate>
        <input
          placeholder="Username (4–8 chars)"
          maxLength={8}
          required
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          placeholder="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Phone Number"
          inputMode="numeric"
          maxLength={10}
          required
          value={form.phone}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
            setForm({ ...form, phone: digits })
          }}
        />
        <input
          placeholder="Password"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button className="primary" type="submit">Register</button>
        <div className="muted">Already have an account? <Link to="/login">Login</Link></div>
      </form>
    </div>
  )
}
