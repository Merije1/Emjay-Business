// FRONT-END ONLY: all data lives in React state (saved in localStorage for the demo).
// Later, replace these functions with Supabase calls. The serial number and IDs
// will then be made by PostgreSQL, not the browser.
import { createContext, useContext, useEffect, useState } from 'react'

export const naira = n => '₦' + Number(n || 0).toLocaleString()
export const uid = () => Math.random().toString(36).slice(2, 10)
const today = () => new Date().toISOString().slice(0, 10)

const seed = {
  settings: { fee: 5000, pct: 50, empPrefix: 'EMR', nextSerial: 484, agency: 'Emjay Business', phone: '+234 800 000 0000', email: 'info@emjaybusiness.com', address: 'Enugu, Nigeria' },
  candidates: [
    { id: 'c1', publicId: 'EMP 2026/09/481', name: 'Chioma Okafor', phone: '08031234567', email: 'chioma@mail.com', address: 'Independence Layout, Enugu', dob: '1998-04-12', gender: 'Female', qualifications: 'B.Sc Accounting', skills: 'Excel, Bookkeeping', experience: '2 years', desiredPosition: 'Accountant', preferredLocation: 'Enugu', feeAmount: 5000, payStatus: 'Paid', payRef: 'TRF-1001', status: 'Interviewing', notes: '', regDate: '2026-09-02' },
    { id: 'c2', publicId: 'EMP 2026/09/482', name: 'Emeka Nwosu', phone: '08029876543', email: 'emeka@mail.com', address: 'Nsukka', dob: '1996-11-03', gender: 'Male', qualifications: 'HND Computer Science', skills: 'IT Support', experience: '3 years', desiredPosition: 'IT Officer', preferredLocation: 'Enugu', feeAmount: 5000, payStatus: 'Paid', payRef: 'CASH-22', status: 'Employed', notes: '', regDate: '2026-09-10' },
    { id: 'c3', publicId: 'EMP 2026/09/483', name: 'Amaka Eze', phone: '07011122233', email: 'amaka@mail.com', address: 'Abakpa, Enugu', dob: '2000-01-25', gender: 'Female', qualifications: 'OND Business Admin', skills: 'Customer service', experience: '1 year', desiredPosition: 'Receptionist', preferredLocation: 'Enugu', feeAmount: 5000, payStatus: 'Pending', payRef: '', status: 'Registered', notes: 'Promised to pay Friday', regDate: '2026-10-01' },
  ],
  employers: [
    { id: 'e1', publicId: 'EMR-001', company: 'ABC Limited', contact: 'Mr. Ade Bello', phone: '08055550001', email: 'hr@abc.com', address: 'Enugu', industry: 'Finance', description: 'Accounting & audit firm', status: 'Active', notes: '' },
    { id: 'e2', publicId: 'EMR-002', company: 'Zenith Logistics', contact: 'Mrs. Ngozi Uche', phone: '08055550002', email: 'jobs@zenithlog.com', address: 'Onitsha', industry: 'Logistics', description: '', status: 'Active', notes: '' },
  ],
  vacancies: [
    { id: 'v1', publicId: 'VAC-001', employerId: 'e1', title: 'Accountant', openings: 2, description: 'Handle company books', qualifications: 'Relevant accounting qualification', skills: 'Excel', experience: '2 years', salary: 200000, location: 'Enugu', type: 'Full-time', deadline: '2026-11-30', status: 'Open' },
    { id: 'v2', publicId: 'VAC-002', employerId: 'e2', title: 'Receptionist', openings: 1, description: 'Front desk', qualifications: 'OND/HND', skills: 'Communication', experience: '1 year', salary: 90000, location: 'Onitsha', type: 'Full-time', deadline: '2026-11-15', status: 'Open' },
    { id: 'v3', publicId: 'VAC-003', employerId: 'e1', title: 'IT Officer', openings: 1, description: '', qualifications: 'HND/B.Sc', skills: 'Networking', experience: '3 years', salary: 180000, location: 'Enugu', type: 'Full-time', deadline: '2026-09-30', status: 'Filled' },
  ],
  applications: [
    { id: 'a1', candidateId: 'c1', vacancyId: 'v1', status: 'Interview Scheduled', date: '2026-10-05', notes: '' },
    { id: 'a2', candidateId: 'c2', vacancyId: 'v3', status: 'Hired', date: '2026-09-15', notes: '' },
  ],
  interviews: [
    { id: 'i1', applicationId: 'a1', date: '2026-10-20T10:00', mode: 'In person', venue: 'ABC Limited, Enugu', result: 'Pending', notes: '' },
  ],
  placements: [
    { id: 'p1', candidateId: 'c2', applicationId: 'a2', employerId: 'e1', position: 'IT Officer', salary: 180000, pct: 50, startDate: '2026-09-25', status: 'Partially Paid' },
  ],
  letters: [
    { id: 'l1', applicationId: 'a2', ref: 'EMJ/REC/0001', date: '2026-09-18' },
  ],
  payments: [
    { id: 'y1', type: 'Registration', candidateId: 'c1', placementId: '', expected: 5000, amount: 5000, method: 'Bank transfer', ref: 'TRF-1001', date: '2026-09-02', status: 'Paid' },
    { id: 'y2', type: 'Registration', candidateId: 'c2', placementId: '', expected: 5000, amount: 5000, method: 'Cash', ref: 'CASH-22', date: '2026-09-10', status: 'Paid' },
    { id: 'y3', type: 'Placement', candidateId: 'c2', placementId: 'p1', expected: 90000, amount: 50000, method: 'Bank transfer', ref: 'TRF-2001', date: '2026-10-05', status: 'Partially Paid' },
  ],
}

const Ctx = createContext()
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }) {
  const [db, setDb] = useState(() => {
    try { return JSON.parse(localStorage.getItem('emjay_db')) || seed } catch { return seed }
  })
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('emjay_user')) } catch { return null }
  })
  useEffect(() => localStorage.setItem('emjay_db', JSON.stringify(db)), [db])
  useEffect(() => localStorage.setItem('emjay_user', JSON.stringify(user)), [user])

  const add = (col, item) => setDb(d => ({ ...d, [col]: [{ id: uid(), ...item }, ...d[col]] }))
  const update = (col, id, patch) => setDb(d => ({ ...d, [col]: d[col].map(r => r.id === id ? { ...r, ...patch } : r) }))
  const setSettings = s => setDb(d => ({ ...d, settings: { ...d.settings, ...s } }))
  const reset = () => { localStorage.removeItem('emjay_db'); setDb(seed) }

  // Next candidate ID. Serial NEVER resets (month/year change only the middle parts).
  const registerCandidate = values => {
    const d = new Date(), serial = db.settings.nextSerial
    const publicId = `EMP ${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(serial).padStart(3, '0')}`
    setDb(x => ({ ...x, settings: { ...x.settings, nextSerial: serial + 1 }, candidates: [{ id: uid(), publicId, regDate: today(), ...values }, ...x.candidates] }))
  }
  const addEmployer = values => {
    const n = db.employers.length + 1
    add('employers', { publicId: `${db.settings.empPrefix}-${String(n).padStart(3, '0')}`, ...values })
  }
  const addVacancy = values => add('vacancies', { publicId: `VAC-${String(db.vacancies.length + 1).padStart(3, '0')}`, ...values })

  const by = (col, id) => db[col].find(r => r.id === id)
  const paidFor = pid => db.payments.filter(p => p.placementId === pid).reduce((s, p) => s + Number(p.amount), 0)
  const expectedFor = p => (Number(p.salary) * Number(p.pct)) / 100

  return <Ctx.Provider value={{ db, user, setUser, add, update, setSettings, reset, registerCandidate, addEmployer, addVacancy, by, paidFor, expectedFor }}>{children}</Ctx.Provider>
}
