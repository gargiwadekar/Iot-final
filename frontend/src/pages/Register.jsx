import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Toast from '../components/Toast'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const nav = useNavigate()

  const validate = () => {
    const { username, email, password } = form
    const errors = []
    if (!username.trim()) errors.push('Username is required')
    if (!email.trim()) errors.push('Email is required')
    if (!password.trim()) errors.push('Password is required')

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
    if (email && !emailOk) errors.push('Enter a valid email address')

    if (username && (username.length < 4 || username.length > 12))
      errors.push('Username must be 4–12 characters')

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
      // ✅ Base URL in api.js is '/api', so no need to repeat '/api'
      await api.post('/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      })

      setToast({ message: '✅ Registered successfully. Please login.', type: 'success' })
      setTimeout(() => nav('/login'), 1200)
    } catch (err) {
      setToast({
        message: err?.response?.data?.message || 'Server error',
        type: 'error',
      })
    }
  }

  return (
    <div className="auth-bg">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
      <h1 className="auth-title">Welcome to Digital Notice Board</h1>
      <p className="auth-sub">Please register to continue</p>

      <form className="card" onSubmit={submit} noValidate>
        <input
          placeholder="Username"
          maxLength={12}
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
          placeholder="Password"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="primary" type="submit">Register</button>
        <div className="muted">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </form>
    </div>
  )
}
