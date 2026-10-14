import { useState } from 'react'
import { useStore, naira } from './store.jsx'
import DataPage, { Badge, Modal } from './DataPage.jsx'

const opt = (arr, label) => arr.map(r => ({ value: r.id, label: label(r) }))
const Card = ({ label, value, sub }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <div className="text-xs uppercase text-slate-500">{label}</div>
    <div className="mt-1 text-2xl font-bold text-brand-900">{value}</div>
    {sub && <div className="text-xs text-slate-400">{sub}</div>}
  </div>
)
const today = () => new Date().toISOString().slice(0, 10)

/* ---------------- ADMIN ---------------- */
function Dashboard() {
  const { db, paidFor, expectedFor } = useStore()
  const expected = db.placements.reduce((s, p) => s + expectedFor(p), 0)
  const received = db.placements.reduce((s, p) => s + paidFor(p.id), 0)
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Candidates" value={db.candidates.length} />
        <Card label="Employers" value={db.employers.length} />
        <Card label="Open vacancies" value={db.vacancies.filter(v => v.status === 'Open').length} />
        <Card label="Applications" value={db.applications.length} />
        <Card label="Placements" value={db.placements.length} />
        <Card label="Agency share expected" value={naira(expected)} />
        <Card label="Received" value={naira(received)} />
        <Card label="Outstanding" value={naira(expected - received)} />
      </div>
      <div className="mt-6 rounded-xl border bg-white p-4">
        <h2 className="mb-2 font-semibold">Latest candidates</h2>
        {db.candidates.slice(0, 5).map(c => (
          <div key={c.id} className="flex justify-between border-t py-2 text-sm first:border-0"><span>{c.name} <span className="text-slate-400">{c.publicId}</span></span><Badge v={c.status} /></div>
        ))}
      </div>
    </div>
  )
}

const G = ['Male', 'Female', 'Other']
function Candidates({ write }) {
  const { db, registerCandidate, update } = useStore()
  const fields = [
    { key: 'name', label: 'Full name', required: true }, { key: 'phone', label: 'Phone number', type: 'tel', required: true },
    { key: 'email', label: 'Email', type: 'email' }, { key: 'address', label: 'Residential address' },
    { key: 'dob', label: 'Date of birth', type: 'date' }, { key: 'gender', label: 'Gender', type: 'select', options: G },
    { key: 'qualifications', label: 'Qualifications' }, { key: 'skills', label: 'Skills' },
    { key: 'experience', label: 'Work experience' }, { key: 'desiredPosition', label: 'Desired position' },
    { key: 'preferredLocation', label: 'Preferred work location' }, { key: 'feeAmount', label: 'Registration fee (₦)', type: 'number' },
    { key: 'payStatus', label: 'Payment status', type: 'select', options: ['Pending', 'Partially Paid', 'Paid', 'Waived', 'Disputed'] },
    { key: 'payRef', label: 'Payment reference' },
    { key: 'status', label: 'Candidate status', type: 'select', options: ['Registered', 'Active', 'Job Searching', 'Referred', 'Interviewing', 'Employed', 'Inactive'] },
    { key: 'notes', label: 'Registration notes', type: 'textarea' },
  ]
  const validate = (v, editing) => {
    if (!/^(\+?\d[\d\s-]{7,15})$/.test(v.phone || '')) return { error: 'Enter a valid phone number.' }
    if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) return { error: 'Enter a valid email address.' }
    if (Number(v.feeAmount) < 0) return { error: 'Fee cannot be negative.' }
    if (!editing) {
      const dup = db.candidates.find(c => c.phone === v.phone || (v.email && c.email === v.email) || c.name.toLowerCase() === v.name.toLowerCase())
      if (dup) return { warning: `Possible duplicate: ${dup.name} (${dup.publicId}).` }
    }
  }
  return <DataPage title="Candidates" subtitle="Each candidate gets a permanent ID: EMP YYYY/MM/SSS" addLabel="Register candidate"
    canAdd={write} canEdit={write} rows={db.candidates} fields={fields} filterKey="status" validate={validate}
    defaults={{ feeAmount: db.settings.fee, payStatus: 'Pending', status: 'Registered' }}
    columns={[{ key: 'publicId', label: 'Candidate ID' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }, { key: 'desiredPosition', label: 'Desired position' }, { key: 'payStatus', label: 'Fee', badge: true }, { key: 'status', label: 'Status', badge: true }]}
    onSave={(v, editing) => editing ? update('candidates', v.id, v) : registerCandidate(v)} />
}

function Employers({ write }) {
  const { db, addEmployer, update } = useStore()
  const fields = [
    { key: 'company', label: 'Company name', required: true }, { key: 'contact', label: 'Contact person', required: true },
    { key: 'phone', label: 'Phone', type: 'tel' }, { key: 'email', label: 'Email', type: 'email' },
    { key: 'address', label: 'Address' }, { key: 'industry', label: 'Industry' },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    { key: 'description', label: 'Description', type: 'textarea' }, { key: 'notes', label: 'Notes', type: 'textarea' },
  ]
  const rows = db.employers.map(e => ({ ...e, vacancies: db.vacancies.filter(v => v.employerId === e.id).length, hires: db.placements.filter(p => p.employerId === e.id).length }))
  const validate = (v, editing) => {
    if (!editing && db.employers.find(e => e.company.toLowerCase() === v.company.toLowerCase())) return { warning: 'An employer with this name already exists.' }
  }
  return <DataPage title="Employers" canAdd={write} canEdit={write} rows={rows} fields={fields} defaults={{ status: 'Active' }} validate={validate} addLabel="Add employer"
    columns={[{ key: 'publicId', label: 'ID' }, { key: 'company', label: 'Company' }, { key: 'contact', label: 'Contact' }, { key: 'industry', label: 'Industry' }, { key: 'vacancies', label: 'Vacancies' }, { key: 'hires', label: 'Placements' }, { key: 'status', label: 'Status', badge: true }]}
    onSave={(v, editing) => editing ? update('employers', v.id, v) : addEmployer(v)} />
}

function Vacancies({ write }) {
  const { db, addVacancy, update, by } = useStore()
  const fields = [
    { key: 'employerId', label: 'Employer', type: 'select', required: true, options: opt(db.employers, e => e.company) },
    { key: 'title', label: 'Job title', required: true }, { key: 'openings', label: 'Number of openings', type: 'number', required: true },
    { key: 'salary', label: 'Salary (₦/month)', type: 'number' }, { key: 'location', label: 'Work location' },
    { key: 'type', label: 'Employment type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Internship'] },
    { key: 'deadline', label: 'Application deadline', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Open', 'Closed', 'Filled', 'Suspended'] },
    { key: 'qualifications', label: 'Required qualifications' }, { key: 'skills', label: 'Required skills' },
    { key: 'experience', label: 'Required experience' }, { key: 'description', label: 'Job description', type: 'textarea' },
  ]
  const rows = db.vacancies.map(v => {
    const filled = db.placements.filter(p => db.applications.find(a => a.id === p.applicationId)?.vacancyId === v.id).length
    return { ...v, employer: by('employers', v.employerId)?.company, remaining: Math.max(0, v.openings - filled) }
  })
  return <DataPage title="Job Vacancies" canAdd={write} canEdit={write} rows={rows} fields={fields} filterKey="status" defaults={{ status: 'Draft', openings: 1, type: 'Full-time' }} addLabel="New vacancy"
    columns={[{ key: 'publicId', label: 'ID' }, { key: 'title', label: 'Position' }, { key: 'employer', label: 'Employer' }, { key: 'location', label: 'Location' }, { key: 'salary', label: 'Salary', money: true }, { key: 'remaining', label: 'Openings left' }, { key: 'status', label: 'Status', badge: true }]}
    onSave={(v, editing) => editing ? update('vacancies', v.id, v) : addVacancy(v)} />
}

function Applications({ write }) {
  const { db, add, update, by } = useStore()
  const fields = [
    { key: 'candidateId', label: 'Candidate', type: 'select', required: true, lockOnEdit: true, options: opt(db.candidates, c => `${c.name} (${c.publicId})`) },
    { key: 'vacancyId', label: 'Vacancy', type: 'select', required: true, lockOnEdit: true, options: opt(db.vacancies, v => `${v.publicId} ${v.title} - ${by('employers', v.employerId)?.company}`) },
    { key: 'status', label: 'Status', type: 'select', options: ['Applied', 'Referred', 'Interview Scheduled', 'Interviewed', 'Hired', 'Rejected', 'Withdrawn'] },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ]
  const rows = db.applications.map(a => ({ ...a, candidate: by('candidates', a.candidateId)?.name, position: by('vacancies', a.vacancyId)?.title, employer: by('employers', by('vacancies', a.vacancyId)?.employerId)?.company }))
  const validate = (v, editing) => {
    if (editing) return
    const c = by('candidates', v.candidateId), vac = by('vacancies', v.vacancyId)
    if (!['Paid', 'Waived'].includes(c.payStatus)) return { error: 'This candidate has not paid the registration fee yet.' }
    if (vac.status !== 'Open') return { error: 'This vacancy is not open for applications.' }
  }
  return <DataPage title="Applications" canAdd={write} canEdit={write} rows={rows} fields={fields} filterKey="status" validate={validate} defaults={{ status: 'Applied' }} addLabel="New application"
    columns={[{ key: 'candidate', label: 'Candidate' }, { key: 'position', label: 'Position' }, { key: 'employer', label: 'Employer' }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status', badge: true }]}
    onSave={(v, editing) => editing ? update('applications', v.id, v) : add('applications', { ...v, date: today() })} />
}

const appLabel = (db, by) => a => `${by('candidates', a.candidateId)?.name} → ${by('vacancies', a.vacancyId)?.title}`
function Interviews({ write }) {
  const { db, add, update, by } = useStore()
  const fields = [
    { key: 'applicationId', label: 'Application', type: 'select', required: true, options: opt(db.applications, appLabel(db, by)) },
    { key: 'date', label: 'Date & time', type: 'datetime-local', required: true },
    { key: 'mode', label: 'Mode', type: 'select', options: ['In person', 'Phone', 'Video'] },
    { key: 'venue', label: 'Venue / link' },
    { key: 'result', label: 'Result', type: 'select', options: ['Pending', 'Passed', 'Failed', 'No show', 'Rescheduled'] },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ]
  const rows = db.interviews.map(i => { const a = by('applications', i.applicationId); return { ...i, candidate: by('candidates', a?.candidateId)?.name, position: by('vacancies', a?.vacancyId)?.title, when: i.date?.replace('T', ' ') } })
  return <DataPage title="Interviews" canAdd={write} canEdit={write} rows={rows} fields={fields} filterKey="result" defaults={{ mode: 'In person', result: 'Pending' }} addLabel="Schedule interview"
    columns={[{ key: 'candidate', label: 'Candidate' }, { key: 'position', label: 'Position' }, { key: 'when', label: 'When' }, { key: 'mode', label: 'Mode' }, { key: 'result', label: 'Result', badge: true }]}
    onSave={(v, editing) => editing ? update('interviews', v.id, v) : add('interviews', v)} />
}

function Placements({ write }) {
  const { db, add, update, by, paidFor, expectedFor } = useStore()
  const fields = [
    { key: 'applicationId', label: 'Application', type: 'select', required: true, lockOnEdit: true, options: opt(db.applications, appLabel(db, by)) },
    { key: 'position', label: 'Position', required: true }, { key: 'salary', label: 'First-month salary (₦)', type: 'number', required: true },
    { key: 'pct', label: 'Agency percentage (%)', type: 'number', required: true }, { key: 'startDate', label: 'Employment date', type: 'date' },
    { key: 'status', label: 'Cycle status', type: 'select', options: ['Active', 'Partially Paid', 'Paid', 'Disputed', 'Cancelled'] },
  ]
  const rows = db.placements.map(p => ({ ...p, candidate: by('candidates', p.candidateId)?.name, employer: by('employers', p.employerId)?.company, expected: expectedFor(p), paid: paidFor(p.id), balance: expectedFor(p) - paidFor(p.id) }))
  const onSave = (v, editing) => {
    if (editing) return update('placements', v.id, v)
    const a = by('applications', v.applicationId), vac = by('vacancies', a.vacancyId)
    add('placements', { ...v, candidateId: a.candidateId, employerId: vac.employerId })
    update('applications', a.id, { status: 'Hired' }); update('candidates', a.candidateId, { status: 'Employed' })
  }
  return <DataPage title="Placements" subtitle="Each job is a separate employment cycle. Old ones are never changed." canAdd={write} canEdit={write} rows={rows} fields={fields} filterKey="status" onSave={onSave} addLabel="New placement"
    defaults={{ pct: db.settings.pct, status: 'Active' }}
    columns={[{ key: 'candidate', label: 'Candidate' }, { key: 'employer', label: 'Employer' }, { key: 'position', label: 'Position' }, { key: 'salary', label: 'Salary', money: true }, { key: 'pct', label: '%' }, { key: 'expected', label: 'Agency share', money: true }, { key: 'paid', label: 'Paid', money: true }, { key: 'balance', label: 'Balance', money: true }, { key: 'status', label: 'Status', badge: true }]} />
}

export function LetterView({ letter, onClose }) {
  const { db, by } = useStore()
  const a = by('applications', letter.applicationId), c = by('candidates', a?.candidateId), v = by('vacancies', a?.vacancyId), e = by('employers', v?.employerId), s = db.settings
  return (
    <Modal title={`Recommendation Letter ${letter.ref}`} onClose={onClose} wide>
      <div id="letter" className="bg-white p-6 text-sm leading-relaxed">
        <div className="mb-4 border-b pb-3"><div className="text-xl font-bold text-brand-900">{s.agency}</div><div className="text-slate-500">{s.address} · {s.phone} · {s.email}</div></div>
        <p>Date: {letter.date}<br />Ref: {letter.ref}</p>
        <p className="mt-3">The Human Resources Manager,<br />{e?.company}<br />{e?.address}</p>
        <p className="mt-3 font-semibold">RE: RECOMMENDATION FOR THE POSITION OF {v?.title?.toUpperCase()}</p>
        <p className="mt-3">We are pleased to recommend <b>{c?.name}</b> (Candidate ID: <b>{c?.publicId}</b>), who is registered with {s.agency}, for the position of {v?.title} at your organization.</p>
        <p className="mt-3">The candidate holds {c?.qualifications || 'relevant qualifications'} and has experience in {c?.skills || 'the required field'}. We believe the candidate is a good fit and look forward to your kind consideration.</p>
        <p className="mt-6">Yours faithfully,<br /><b>{s.agency}</b></p>
      </div>
      <div className="mt-3 flex justify-end"><button className="btn" onClick={() => window.print()}>Print / Save as PDF</button></div>
    </Modal>
  )
}
function Letters({ write }) {
  const { db, add, by } = useStore()
  const [view, setView] = useState(null)
  const rows = db.letters.map(l => { const a = by('applications', l.applicationId); return { ...l, candidate: by('candidates', a?.candidateId)?.name, position: by('vacancies', a?.vacancyId)?.title } })
  const validate = v => {
    const c = by('candidates', by('applications', v.applicationId)?.candidateId)
    if (!['Paid', 'Waived'].includes(c?.payStatus)) return { error: 'Registration fee is unpaid. Letter cannot be made.' }
  }
  return <>
    <DataPage title="Recommendation Letters" canAdd={write} canEdit={false} rows={rows} addLabel="Generate letter" validate={validate}
      fields={[{ key: 'applicationId', label: 'Application', type: 'select', required: true, options: opt(db.applications, appLabel(db, by)) }]}
      columns={[{ key: 'ref', label: 'Reference' }, { key: 'candidate', label: 'Candidate' }, { key: 'position', label: 'Position' }, { key: 'date', label: 'Date' }]}
      onSave={v => add('letters', { applicationId: v.applicationId, ref: `EMJ/REC/${String(db.letters.length + 1).padStart(4, '0')}`, date: today() })}
      actions={r => <button className="btn2" onClick={() => setView(r)}>View</button>} />
    {view && <LetterView letter={view} onClose={() => setView(null)} />}
  </>
}

function Payments({ write }) {
  const { db, add, update, by, paidFor } = useStore()
  const fields = [
    { key: 'type', label: 'Payment type', type: 'select', required: true, options: ['Registration', 'Placement'] },
    { key: 'candidateId', label: 'Candidate', type: 'select', required: true, options: opt(db.candidates, c => `${c.name} (${c.publicId})`) },
    { key: 'placementId', label: 'Placement (if placement payment)', type: 'select', options: opt(db.placements, p => `${by('candidates', p.candidateId)?.name} - ${p.position}`) },
    { key: 'expected', label: 'Amount expected (₦)', type: 'number' }, { key: 'amount', label: 'Amount received (₦)', type: 'number', required: true },
    { key: 'method', label: 'Method', type: 'select', options: ['Bank transfer', 'Cash', 'POS', 'Online'] },
    { key: 'ref', label: 'Payment reference', required: true }, { key: 'date', label: 'Payment date', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Partially Paid', 'Paid', 'Waived', 'Disputed'] },
  ]
  const rows = db.payments.map(p => ({ ...p, candidate: by('candidates', p.candidateId)?.name }))
  const validate = (v, editing) => {
    if (Number(v.amount) < 0) return { error: 'Amount cannot be negative.' }
    if (v.type === 'Placement' && !v.placementId) return { error: 'Pick the placement for this payment.' }
    if (!editing && db.payments.find(p => p.ref.toLowerCase() === v.ref.toLowerCase())) return { error: 'This payment reference was already used.' }
  }
  const onSave = (v, editing) => {
    if (editing) return update('payments', v.id, v)
    add('payments', v)
    if (v.type === 'Registration') update('candidates', v.candidateId, { payStatus: v.status, payRef: v.ref })
    else {
      const p = by('placements', v.placementId), total = paidFor(p.id) + Number(v.amount), exp = (p.salary * p.pct) / 100
      update('placements', p.id, { status: total >= exp ? 'Paid' : 'Partially Paid' })
    }
  }
  return <DataPage title="Payments" canAdd={write} canEdit={write} rows={rows} fields={fields} filterKey="type" validate={validate} onSave={onSave} addLabel="Record payment"
    defaults={{ type: 'Registration', expected: db.settings.fee, method: 'Bank transfer', date: today(), status: 'Paid' }}
    columns={[{ key: 'date', label: 'Date' }, { key: 'candidate', label: 'Candidate' }, { key: 'type', label: 'Type' }, { key: 'amount', label: 'Amount', money: true }, { key: 'method', label: 'Method' }, { key: 'ref', label: 'Reference' }, { key: 'status', label: 'Status', badge: true }]} />
}

function Reports() {
  const { db, paidFor, expectedFor } = useStore()
  const regIncome = db.payments.filter(p => p.type === 'Registration').reduce((s, p) => s + Number(p.amount), 0)
  const exp = db.placements.reduce((s, p) => s + expectedFor(p), 0), rec = db.placements.reduce((s, p) => s + paidFor(p.id), 0)
  const count = (arr, k) => Object.entries(arr.reduce((m, r) => ({ ...m, [r[k]]: (m[r[k]] || 0) + 1 }), {}))
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Reports</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Registration income" value={naira(regIncome)} /><Card label="Placement expected" value={naira(exp)} />
        <Card label="Placement received" value={naira(rec)} /><Card label="Outstanding" value={naira(exp - rec)} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[['Candidates by status', count(db.candidates, 'status')], ['Applications by status', count(db.applications, 'status')], ['Vacancies by status', count(db.vacancies, 'status')]].map(([t, rows]) => (
          <div key={t} className="rounded-xl border bg-white p-4"><h2 className="mb-2 font-semibold">{t}</h2>
            {rows.map(([k, n]) => <div key={k} className="flex justify-between border-t py-1.5 text-sm"><span>{k}</span><b>{n}</b></div>)}</div>
        ))}
      </div>
    </div>
  )
}

function Settings({ write }) {
  const { db, setSettings, reset } = useStore()
  const [s, setS] = useState(db.settings), [ok, setOk] = useState(false)
  const F = (k, l, t = 'text') => <label className="text-sm"><span className="mb-1 block font-medium text-slate-600">{l}</span><input type={t} className="inp" value={s[k]} onChange={e => setS({ ...s, [k]: e.target.value })} /></label>
  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">Settings</h1>
      <div className="grid gap-3 rounded-xl border bg-white p-5 sm:grid-cols-2">
        {F('agency', 'Agency name')}{F('phone', 'Phone')}{F('email', 'Email', 'email')}{F('address', 'Address')}
        {F('fee', 'Registration fee (₦)', 'number')}{F('pct', 'Default agency percentage (%)', 'number')}{F('empPrefix', 'Employer ID prefix')}
        <div className="flex items-center gap-3 sm:col-span-2">
          <button className="btn" disabled={!write} onClick={() => { setSettings({ ...s, fee: Number(s.fee), pct: Number(s.pct) }); setOk(true) }}>Save settings</button>
          <button className="btn2" disabled={!write} onClick={() => { if (confirm('Reset all demo data?')) reset() }}>Reset demo data</button>
          {ok && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </div>
    </div>
  )
}

export const ADMIN_PAGES = [
  { key: 'dashboard', label: 'Dashboard', C: Dashboard }, { key: 'candidates', label: 'Candidates', C: Candidates },
  { key: 'employers', label: 'Employers', C: Employers }, { key: 'vacancies', label: 'Job Vacancies', C: Vacancies },
  { key: 'applications', label: 'Applications', C: Applications }, { key: 'interviews', label: 'Interviews', C: Interviews },
  { key: 'placements', label: 'Placements', C: Placements }, { key: 'letters', label: 'Recommendation Letters', C: Letters },
  { key: 'payments', label: 'Payments', C: Payments }, { key: 'reports', label: 'Reports', C: Reports }, { key: 'settings', label: 'Settings', C: Settings },
]

/* ---------------- CANDIDATE PORTAL ---------------- */
const useMe = () => { const s = useStore(); return { ...s, me: s.by('candidates', s.user.candidateId) } }
const paidOk = c => ['Paid', 'Waived'].includes(c?.payStatus)

function PDash() {
  const { db, me } = useMe()
  const mine = db.applications.filter(a => a.candidateId === me.id)
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Welcome, {me.name}</h1>
      <p className="mb-4 text-sm text-slate-500">Candidate ID: <b>{me.publicId}</b></p>
      {!paidOk(me) && <div className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Your registration fee ({naira(db.settings.fee)}) is not confirmed yet. Please pay at the agency office to apply for jobs and get recommendation letters.</div>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card label="Registration fee" value={me.payStatus} /><Card label="My applications" value={mine.length} /><Card label="Status" value={me.status} />
      </div>
    </div>
  )
}
function PProfile() {
  const { me } = useMe()
  const items = [['Full name', me.name], ['Candidate ID', me.publicId], ['Phone', me.phone], ['Email', me.email], ['Address', me.address], ['Qualifications', me.qualifications], ['Skills', me.skills], ['Desired position', me.desiredPosition], ['Preferred location', me.preferredLocation]]
  return <div><h1 className="mb-4 text-2xl font-bold">My Profile</h1><div className="grid gap-3 rounded-xl border bg-white p-5 sm:grid-cols-2">{items.map(([k, v]) => <div key={k}><div className="text-xs uppercase text-slate-500">{k}</div><div>{v || '-'}</div></div>)}</div></div>
}
function PJobs() {
  const { db, me, add, by } = useMe()
  const [msg, setMsg] = useState('')
  const rows = db.vacancies.filter(v => v.status === 'Open').map(v => ({ ...v, employer: by('employers', v.employerId)?.company, applied: db.applications.some(a => a.candidateId === me.id && a.vacancyId === v.id) ? 'Applied' : '' }))
  const apply = v => {
    if (!paidOk(me)) return setMsg('You must pay the registration fee before applying.')
    add('applications', { candidateId: me.id, vacancyId: v.id, status: 'Applied', date: today(), notes: '' }); setMsg(`Applied for ${v.title}.`)
  }
  return <DataPage title="Available Jobs" canAdd={false} canEdit={false} rows={rows}
    extraTop={msg && <p className="mb-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{msg}</p>}
    columns={[{ key: 'title', label: 'Position' }, { key: 'employer', label: 'Employer' }, { key: 'location', label: 'Location' }, { key: 'salary', label: 'Salary', money: true }, { key: 'deadline', label: 'Deadline' }]}
    actions={r => r.applied ? <Badge v="Applied" /> : <button className="btn2" onClick={() => apply(r)}>Apply</button>} />
}
function PApps() {
  const { db, me, by } = useMe()
  const rows = db.applications.filter(a => a.candidateId === me.id).map(a => ({ ...a, position: by('vacancies', a.vacancyId)?.title, employer: by('employers', by('vacancies', a.vacancyId)?.employerId)?.company }))
  return <DataPage title="My Applications" canAdd={false} canEdit={false} rows={rows} columns={[{ key: 'position', label: 'Position' }, { key: 'employer', label: 'Employer' }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status', badge: true }]} />
}
function PInt() {
  const { db, me, by } = useMe()
  const mine = db.applications.filter(a => a.candidateId === me.id).map(a => a.id)
  const rows = db.interviews.filter(i => mine.includes(i.applicationId)).map(i => ({ ...i, position: by('vacancies', by('applications', i.applicationId)?.vacancyId)?.title, when: i.date.replace('T', ' ') }))
  return <DataPage title="My Interviews" canAdd={false} canEdit={false} rows={rows} columns={[{ key: 'position', label: 'Position' }, { key: 'when', label: 'When' }, { key: 'mode', label: 'Mode' }, { key: 'venue', label: 'Venue' }, { key: 'result', label: 'Result', badge: true }]} />
}
function PLet() {
  const { db, me, by } = useMe()
  const [view, setView] = useState(null)
  const mine = db.applications.filter(a => a.candidateId === me.id).map(a => a.id)
  const rows = db.letters.filter(l => mine.includes(l.applicationId)).map(l => ({ ...l, position: by('vacancies', by('applications', l.applicationId)?.vacancyId)?.title }))
  return <><DataPage title="My Recommendation Letters" canAdd={false} canEdit={false} rows={rows} columns={[{ key: 'ref', label: 'Reference' }, { key: 'position', label: 'Position' }, { key: 'date', label: 'Date' }]} actions={r => <button className="btn2" onClick={() => setView(r)}>View</button>} />{view && <LetterView letter={view} onClose={() => setView(null)} />}</>
}
function PEmp() {
  const { db, me, by, paidFor, expectedFor } = useMe()
  const rows = db.placements.filter(p => p.candidateId === me.id).map(p => ({ ...p, employer: by('employers', p.employerId)?.company }))
  return <DataPage title="My Employment History" canAdd={false} canEdit={false} rows={rows} columns={[{ key: 'employer', label: 'Employer' }, { key: 'position', label: 'Position' }, { key: 'startDate', label: 'Start date' }, { key: 'salary', label: 'Salary', money: true }, { key: 'status', label: 'Status', badge: true }]} />
}
function PPay() {
  const { db, me } = useMe()
  const rows = db.payments.filter(p => p.candidateId === me.id)
  return <DataPage title="My Payments" canAdd={false} canEdit={false} rows={rows} columns={[{ key: 'date', label: 'Date' }, { key: 'type', label: 'Type' }, { key: 'amount', label: 'Amount', money: true }, { key: 'ref', label: 'Reference' }, { key: 'status', label: 'Status', badge: true }]} />
}
function PSet() {
  return <div className="max-w-md"><h1 className="mb-4 text-2xl font-bold">Account Settings</h1><div className="grid gap-3 rounded-xl border bg-white p-5"><input className="inp" type="password" placeholder="New password" /><button className="btn" onClick={() => alert('Password change will work when the backend is added.')}>Change password</button></div></div>
}

export const PORTAL_PAGES = [
  { key: 'dashboard', label: 'Dashboard', C: PDash }, { key: 'profile', label: 'My Profile', C: PProfile },
  { key: 'jobs', label: 'Available Jobs', C: PJobs }, { key: 'applications', label: 'My Applications', C: PApps },
  { key: 'interviews', label: 'My Interviews', C: PInt }, { key: 'letters', label: 'My Recommendation Letters', C: PLet },
  { key: 'employment', label: 'My Employment History', C: PEmp }, { key: 'payments', label: 'My Payments', C: PPay },
  { key: 'settings', label: 'Account Settings', C: PSet },
]
