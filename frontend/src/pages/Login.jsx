import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Toast from '../components/Toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const nav = useNavigate()

  const validate = () => {
    const email = form.email.trim()
    const password = form.password
    if (!email || !password) {
      setToast({ message: 'Both fields are required', type: 'error' })
      return false
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
    if (!emailOk) {
      setToast({ message: 'Enter a valid email address', type: 'error' })
      setForm({ ...form, email: '' })
      return false
    }
    return true
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      // ✅ Base URL is '/api', so call relative path only
      const { data } = await api.post('/login', form)
      localStorage.setItem('token', data.token)
      nav('/dashboard')
    } catch (err) {
      setToast({
        message: err?.response?.data?.message || 'Server error',
        type: 'error'
      })
      setForm({ ...form, password: '' })
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
      <p className="auth-sub">Please login to continue</p>
      <form className="card" onSubmit={submit}>
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <button className="primary" type="submit">Login</button>
        <div className="muted">
          New here? <Link to="/register">Register</Link>
        </div>
      </form>
    </div>
  )
}
