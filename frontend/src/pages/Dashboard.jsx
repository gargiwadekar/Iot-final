import { useEffect, useState } from 'react'
import api from '../services/api'

function NoticeForm({ onAdded }){
  const [title,setTitle] = useState('')
  const [desc,setDesc] = useState('')
  const clear = ()=>{ setTitle(''); setDesc('') }
  const submit = async (e)=>{
    e.preventDefault()
    await api.post('/notices', { title, description: desc })
    clear()
    onAdded()
  }
  return (
    <div>
      <h2 className="page-title">Add Notice Here</h2>
      <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea placeholder="Description" rows={6} value={desc} onChange={e=>setDesc(e.target.value)} />
      <div className="row">
        <button className="primary" onClick={submit}>Add Notice</button>
        <button className="primary" onClick={clear} style={{opacity:.95}}>Clear</button>
      </div>
    </div>
  )
}

function NoticeList({ reloadKey, onChanged }){
  const [items,setItems]=useState([])
  useEffect(()=>{ (async()=>{
    const { data } = await api.get('/notices')
    setItems(data)
  })() }, [reloadKey])

  const del = async id=>{ await api.delete(`/notices/${id}`); onChanged() }
  const repost = async id=>{ await api.post(`/notices/${id}/repost`); onChanged() }

  return (
    <div style={{marginTop:10}}>
      {items.map(n=> (
        <div key={n.id} className="notice-card">
          <div className="n-title">{n.title}</div>
          <div className="n-desc">{n.description}</div>
          <div className="n-date">{new Date(n.created_at).toLocaleString()}</div>
          <div className="row">
            <button className="primary" onClick={()=>repost(n.id)}>Repost</button>
            <button className="primary" onClick={()=>del(n.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard(){
  const [view,setView] = useState('add')
  const [reload,setReload] = useState(0)
  const logout = ()=>{ localStorage.removeItem('token'); location.href='/login' }

  return (
    <div className="layout">
      <aside className="sidebar">
        <button className={"side-btn"} onClick={()=>setView('add')}>Add Notice</button>
        <button className={"side-btn"} onClick={()=>setView('list')}>Show Notices</button>
        <div style={{flex:1}}></div>
        <button className="side-btn" onClick={logout}>Logout</button>
      </aside>
      <main className="main">
        {view==='add' ?
          <NoticeForm onAdded={()=>setReload(x=>x+1)} /> :
          <>
            <h2 className="page-title">All Notices</h2>
            <NoticeList reloadKey={reload} onChanged={()=>setReload(x=>x+1)} />
          </>
        }
      </main>
    </div>
  )
}
