import { useState } from 'react'

const tone = s => {
  s = String(s || '').toLowerCase()
  if (/paid$|^paid|active|open|hired|employed|completed|passed|confirmed/.test(s) && !/partial|un/.test(s)) return 'bg-green-100 text-green-700'
  if (/pending|draft|registered|partial|scheduled|searching|referred|interview/.test(s)) return 'bg-amber-100 text-amber-700'
  if (/closed|inactive|failed|rejected|disputed|suspended|unpaid/.test(s)) return 'bg-red-100 text-red-700'
  return 'bg-slate-100 text-slate-700'
}
export const Badge = ({ v }) => v ? <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone(v)}`}>{v}</span> : null

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className={`mt-8 w-full rounded-xl bg-white p-5 shadow-xl ${wide ? 'max-w-3xl' : 'max-w-2xl'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-700">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Generic list page: search + filter + pagination + add/edit form.
export default function DataPage({ title, subtitle, columns, rows, fields, canAdd = true, canEdit = true, addLabel = 'Add new', defaults = {}, validate, onSave, actions, filterKey, extraTop }) {
  const [q, setQ] = useState('')
  const [f, setF] = useState('All')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(null) // {values, editing}
  const [msg, setMsg] = useState({})
  const per = 8

  const filterVals = filterKey ? ['All', ...new Set(rows.map(r => r[filterKey]).filter(Boolean))] : []
  const list = rows.filter(r => (f === 'All' || r[filterKey] === f) && JSON.stringify(Object.values(r)).toLowerCase().includes(q.toLowerCase()))
  const pages = Math.max(1, Math.ceil(list.length / per))
  const shown = list.slice((page - 1) * per, page * per)

  const open = (row) => { setMsg({}); setForm({ values: row ? { ...row } : { ...defaults }, editing: !!row }) }
  const set = (k, v) => setForm(s => ({ ...s, values: { ...s.values, [k]: v } }))
  const submit = e => {
    e.preventDefault()
    const r = validate ? validate(form.values, form.editing) : {}
    if (r?.error) return setMsg({ error: r.error })
    if (r?.warning && !msg.confirmed) return setMsg({ warning: r.warning, confirmed: true })
    onSave(form.values, form.editing)
    setForm(null)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">{title}</h1>{subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}</div>
        {canAdd && fields && <button className="btn" onClick={() => open()}>+ {addLabel}</button>}
      </div>
      {extraTop}
      <div className="mb-3 flex flex-wrap gap-2">
        <input className="inp max-w-xs" placeholder="Search..." value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
        {filterKey && <select className="inp max-w-[200px]" value={f} onChange={e => { setF(e.target.value); setPage(1) }}>{filterVals.map(v => <option key={v}>{v}</option>)}</select>}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>{columns.map(c => <th key={c.key} className="px-4 py-3">{c.label}</th>)}{(actions || (canEdit && fields)) && <th className="px-4 py-3">Actions</th>}</tr>
          </thead>
          <tbody>
            {shown.map(r => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                {columns.map(c => <td key={c.key} className="px-4 py-3">{c.badge ? <Badge v={r[c.key]} /> : c.money ? '₦' + Number(r[c.key] || 0).toLocaleString() : r[c.key]}</td>)}
                {(actions || (canEdit && fields)) && <td className="flex gap-2 px-4 py-3">{canEdit && fields && <button className="btn2" onClick={() => open(r)}>Edit</button>}{actions?.(r)}</td>}
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-slate-400">Nothing here yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
        <span>{list.length} record(s)</span>
        <div className="flex items-center gap-2">
          <button className="btn2" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>{page} / {pages}</span>
          <button className="btn2" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>

      {form && (
        <Modal title={form.editing ? `Edit ${title}` : addLabel} onClose={() => setForm(null)}>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            {fields.map(fd => {
              const opts = (fd.options || []).map(o => typeof o === 'string' ? { value: o, label: o } : o)
              const common = { className: 'inp', required: fd.required, value: form.values[fd.key] ?? '', onChange: e => set(fd.key, e.target.value), disabled: fd.lockOnEdit && form.editing }
              return (
                <label key={fd.key} className={`text-sm ${fd.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                  <span className="mb-1 block font-medium text-slate-600">{fd.label}{fd.required && ' *'}</span>
                  {fd.type === 'select' ? <select {...common}><option value="">Select...</option>{opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                    : fd.type === 'textarea' ? <textarea rows={2} {...common} />
                    : <input type={fd.type || 'text'} min={fd.type === 'number' ? 0 : undefined} {...common} />}
                </label>
              )
            })}
            {msg.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{msg.error}</p>}
            {msg.warning && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 sm:col-span-2">⚠ {msg.warning} Click "Save anyway" if this is a different record.</p>}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" className="btn2" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn">{msg.warning ? 'Save anyway' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
