import { useEffect, useState } from 'react'
import api from '../services/api'
import Toast from '../components/Toast'

function NoticeForm({ onAdded }) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const clear = () => { setTitle(''); setMessage('') }

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      setToast({ message: 'Both fields are required', type: 'error' })
      return
    }

    try {
      await api.post('/notices', {
        title,
        message,
        date: new Date().toISOString(), // ✅ send date
      })
      setToast({ message: '✅ Notice added successfully!', type: 'success' })
      clear()
      onAdded()
    } catch (err) {
      setToast({ message: err?.response?.data?.message || 'Server error', type: 'error' })
    }
  }

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <h2 className="page-title">Add Notice Here</h2>
      <input
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Message"
        rows={6}
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      <div className="row">
        <button className="primary" onClick={submit}>Add Notice</button>
        <button className="primary" onClick={clear} style={{ opacity: .95 }}>Clear</button>
      </div>
    </div>
  )
}

function NoticeList({ reloadKey }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/notices')
      setItems(data)
    })()
  }, [reloadKey])

  return (
    <div style={{ marginTop: 10 }}>
      {items.length === 0 && <p>No notices available yet.</p>}
      {items.map(n => (
        <div key={n.id} className="notice-card">
          <div className="n-title">{n.title}</div>
          <div className="n-desc">{n.message}</div>
          <div className="n-date">{new Date(n.date).toLocaleString()}</div>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [view, setView] = useState('add')
  const [reload, setReload] = useState(0)

  const logout = () => {
    localStorage.removeItem('token')
    location.href = '/login'
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <button className="side-btn" onClick={() => setView('add')}>Add Notice</button>
        <button className="side-btn" onClick={() => setView('list')}>Show Notices</button>
        <div style={{ flex: 1 }}></div>
        <button className="side-btn" onClick={logout}>Logout</button>
      </aside>

      <main className="main">
        {view === 'add'
          ? <NoticeForm onAdded={() => setReload(x => x + 1)} />
          : <>
              <h2 className="page-title">All Notices</h2>
              <NoticeList reloadKey={reload} />
            </>
        }
      </main>
    </div>
  )
}
