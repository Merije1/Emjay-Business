import { useState } from 'react'
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from './store.jsx'
import { ADMIN_PAGES, PORTAL_PAGES } from './pages.jsx'

export const ROLES = {
  'Super Admin': { pages: '*', write: true },
  'Manager': { pages: ['dashboard', 'candidates', 'employers', 'vacancies', 'applications', 'interviews', 'placements', 'letters', 'payments', 'reports'], write: true },
  'Registration Staff': { pages: ['dashboard', 'candidates', 'payments'], write: true },
  'Recruitment Staff': { pages: ['dashboard', 'candidates', 'employers', 'vacancies', 'applications', 'interviews', 'placements', 'letters'], write: true },
  'Finance Staff': { pages: ['dashboard', 'candidates', 'placements', 'payments', 'reports'], write: true },
  'Read-only Staff': { pages: ['dashboard', 'candidates', 'employers', 'vacancies', 'applications', 'interviews', 'placements', 'letters', 'payments', 'reports'], write: false },
}

function Login() {
  const { setUser, db } = useStore()
  const nav = useNavigate()
  const [mode, setMode] = useState('staff')
  const [role, setRole] = useState('Super Admin')
  const [cid, setCid] = useState(db.candidates[0]?.id)
  const go = e => {
    e.preventDefault()
    if (mode === 'staff') { setUser({ type: 'staff', role, name: role }); nav('/admin/dashboard') }
    else { setUser({ type: 'candidate', candidateId: cid }); nav('/portal/dashboard') }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 to-brand-600 p-4">
      <form onSubmit={go} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h1 className="text-2xl font-bold text-brand-900">EMJAY BUSINESS</h1>
        <p className="mb-5 text-sm text-slate-500">Recruitment & Employment Management System</p>
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 text-sm">
          {['staff', 'candidate'].map(m => <button type="button" key={m} onClick={() => setMode(m)} className={`rounded-md py-2 font-medium capitalize ${mode === m ? 'bg-white shadow' : 'text-slate-500'}`}>{m === 'staff' ? 'Staff login' : 'Candidate login'}</button>)}
        </div>
        <input className="inp mb-3" placeholder="Email" defaultValue={mode === 'staff' ? 'staff@emjaybusiness.com' : 'candidate@mail.com'} />
        <input className="inp mb-3" type="password" placeholder="Password" defaultValue="demo1234" />
        {mode === 'staff'
          ? <select className="inp mb-4" value={role} onChange={e => setRole(e.target.value)}>{Object.keys(ROLES).map(r => <option key={r}>{r}</option>)}</select>
          : <select className="inp mb-4" value={cid} onChange={e => setCid(e.target.value)}>{db.candidates.map(c => <option key={c.id} value={c.id}>{c.name} ({c.publicId})</option>)}</select>}
        <button className="btn w-full">Sign in</button>
        <p className="mt-3 text-center text-xs text-slate-400">Demo mode: pick a role to preview. Real login comes with the backend.</p>
      </form>
    </div>
  )
}

function Shell({ items, base, title, children }) {
  const { user, setUser } = useStore()
  const [open, setOpen] = useState(false)
  return (
    <div className="flex min-h-screen">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-brand-900 p-4 text-slate-200 transition lg:static lg:translate-x-0 ${open ? '' : '-translate-x-full'}`}>
        <div className="mb-6 text-lg font-bold text-white">EMJAY BUSINESS<div className="text-xs font-normal text-slate-400">{title}</div></div>
        <nav className="space-y-1">
          {items.map(p => <NavLink key={p.key} to={`${base}/${p.key}`} onClick={() => setOpen(false)} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-brand-500 text-white' : 'hover:bg-white/10'}`}>{p.label}</NavLink>)}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b bg-white px-4 py-3">
          <button className="btn2 lg:hidden" onClick={() => setOpen(true)}>☰ Menu</button>
          <span className="text-sm text-slate-500">{user.type === 'staff' ? user.role : 'Candidate'}</span>
          <button className="btn2" onClick={() => setUser(null)}>Log out</button>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

export default function App() {
  const { user } = useStore()
  if (!user) return <Routes><Route path="*" element={<Login />} /></Routes>
  if (user.type === 'staff') {
    const r = ROLES[user.role]
    const items = ADMIN_PAGES.filter(p => r.pages === '*' || r.pages.includes(p.key))
    return (
      <Shell items={items} base="/admin" title="Staff Portal">
        <Routes>
          {items.map(p => <Route key={p.key} path={`/admin/${p.key}`} element={<p.C write={r.write} />} />)}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Shell>
    )
  }
  return (
    <Shell items={PORTAL_PAGES} base="/portal" title="Candidate Portal">
      <Routes>
        {PORTAL_PAGES.map(p => <Route key={p.key} path={`/portal/${p.key}`} element={<p.C />} />)}
        <Route path="*" element={<Navigate to="/portal/dashboard" replace />} />
      </Routes>
    </Shell>
  )
}
