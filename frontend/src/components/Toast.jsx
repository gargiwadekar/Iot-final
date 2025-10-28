export default function Toast({ message, type, onClose }) {
  if (!message) return null
  return (
    <div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',zIndex:1000}}>
      <div style={{background:type==='error'?'#ef4444':'#10b981',color:'#fff',padding:'10px 16px',borderRadius:6,boxShadow:'0 6px 20px rgba(0,0,0,0.15)'}}>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <strong>{type==='error'?'Server error':'Success'}</strong>
          <span>{message}</span>
          <button onClick={onClose} style={{marginLeft:12,background:'transparent',border:'none',color:'#fff',cursor:'pointer'}}>×</button>
        </div>
      </div>
    </div>
  )
}
