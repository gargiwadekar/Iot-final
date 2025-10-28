import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import initSqlJs from 'sql.js'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())

// Load environment variables
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'

// SQLite (sql.js) init
let SQL
let db
const dbFilePath = path.join(__dirname, 'data.sqlite')

async function initDB(){
  SQL = await initSqlJs({ locateFile: (file)=> path.join(__dirname, 'node_modules', 'sql.js', 'dist', file) })
  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }
  // Create tables if not exist
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      user_id TEXT NOT NULL
    );
  `)
  saveDB()
}

function saveDB(){
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbFilePath, buffer)
}

function getOne(sql, params=[]) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  let result = null
  if (stmt.step()) {
    result = stmt.getAsObject()
  }
  stmt.free()
  return result
}

function getAll(sql, params=[]) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function run(sql, params=[]) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  stmt.step()
  stmt.free()
  saveDB()
}

function auth(req,res,next){
  const hdr = req.headers.authorization||''
  const token = hdr.startsWith('Bearer ')? hdr.slice(7): null
  if(!token) return res.status(401).json({ message:'Unauthorized' })
  try{
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  }catch{
    return res.status(401).json({ message:'Invalid token' })
  }
}

app.get('/api/health', (req,res)=> res.json({ ok:true }))

// Auth
app.post('/api/auth/register', async (req,res)=>{
  const { username, email, phone, password } = req.body
  if(!username||!email||!password) return res.status(400).json({ message:'Missing fields' })
  const exists = getOne('SELECT 1 as ok FROM users WHERE email = ?', [email])
  if(exists) return res.status(409).json({ message:'Email already registered' })
  const id = uuidv4()
  const hash = bcrypt.hashSync(password, 10)
  run('INSERT INTO users (id, username, email, phone, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
    id, username, email, phone||'', hash, new Date().toISOString()
  ])
  return res.json({ success:true })
})

app.post('/api/auth/login', async (req,res)=>{
  const { email, password } = req.body
  const user = getOne('SELECT * FROM users WHERE email = ?', [email])
  if(!user) return res.status(401).json({ message:'Invalid credentials' })
  const ok = bcrypt.compareSync(password, user.password_hash)
  if(!ok) return res.status(401).json({ message:'Invalid credentials' })
  const token = jwt.sign({ id:user.id, email:user.email, username:user.username }, JWT_SECRET, { expiresIn:'7d' })
  return res.json({ token })
})

// Notices
app.get('/api/notices', auth, async (req,res)=>{
  const rows = getAll('SELECT * FROM notices ORDER BY datetime(created_at) DESC')
  res.json(rows)
})

app.post('/api/notices', auth, async (req,res)=>{
  const { title, description } = req.body
  if(!title||!description) return res.status(400).json({ message:'Missing fields' })
  const id = uuidv4()
  const created_at = new Date().toISOString()
  run('INSERT INTO notices (id, title, description, created_at, user_id) VALUES (?, ?, ?, ?, ?)', [
    id, title, description, created_at, req.user.id
  ])
  res.json({ id })
})

app.post('/api/notices/:id/repost', auth, async (req,res)=>{
  const id = req.params.id
  const n = getOne('SELECT * FROM notices WHERE id = ?', [id])
  if(!n) return res.status(404).json({ message:'Not found' })
  const newId = uuidv4()
  const created_at = new Date().toISOString()
  run('INSERT INTO notices (id, title, description, created_at, user_id) VALUES (?, ?, ?, ?, ?)', [
    newId, n.title, n.description, created_at, req.user.id
  ])
  res.json({ id:newId })
})

app.delete('/api/notices/:id', auth, async (req,res)=>{
  const id=req.params.id
  run('DELETE FROM notices WHERE id = ?', [id])
  res.json({ success:true })
})

const PORT = process.env.PORT || 4000

// Start after DB is ready
;(async ()=>{
  await initDB()
  app.listen(PORT, ()=> console.log(`API running on http://localhost:${PORT}`))
})()
