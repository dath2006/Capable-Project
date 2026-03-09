import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import SelectField from '../components/SelectField'
import { signup } from '../services/authApi'

const STUDY_OPTIONS = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'medical', label: 'Medical' },
]

export default function SignupPage() {
    const nav = useNavigate()
    const [f, setF] = useState({
        username: '', email: '', password: '', confirm_password: '',
        study_field: '', semester: '', college_name: '', phone: '',
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }))

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (f.password !== f.confirm_password) return setError('Passwords do not match')
        setLoading(true)
        try { await signup(f); nav('/login') }
        catch (err: unknown) { setError(err instanceof Error ? err.message : 'Signup failed') }
        finally { setLoading(false) }
    }

    return (
        <AuthLayout title="Create your account" subtitle="Start your learning journey today">
            <form onSubmit={submit} className="flex flex-col gap-5">
                {error && <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

                <div className="flex gap-4">
                    <InputField id="username" label="Username" value={f.username} onChange={set('username')} placeholder="johndoe" required className="flex-1 animate-fade-in stagger-1" />
                    <InputField id="email" label="Email" type="email" value={f.email} onChange={set('email')} placeholder="john@example.com" required className="flex-1 animate-fade-in stagger-2" />
                </div>

                <div className="flex gap-4">
                    <InputField id="password" label="Password" type="password" value={f.password} onChange={set('password')} placeholder="••••••••" required className="flex-1 animate-fade-in stagger-3" />
                    <InputField id="confirm" label="Confirm Password" type="password" value={f.confirm_password} onChange={set('confirm_password')} placeholder="••••••••" required className="flex-1 animate-fade-in stagger-4" />
                </div>

                <SelectField id="study" label="Studying in" value={f.study_field} onChange={set('study_field')} options={STUDY_OPTIONS} required className="animate-fade-in stagger-5" />

                <div className="flex gap-4">
                    <InputField id="semester" label="Semester" value={f.semester} onChange={set('semester')} placeholder="e.g. 4th" className="flex-1 animate-fade-in stagger-5" />
                    <InputField id="college" label="College" value={f.college_name} onChange={set('college_name')} placeholder="e.g. RVCE" className="flex-1 animate-fade-in stagger-6" />
                </div>

                <InputField id="phone" label="Phone" value={f.phone} onChange={set('phone')} placeholder="+91 9876543210" className="animate-fade-in stagger-6" />

                <button type="submit" disabled={loading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition-all duration-200 text-[14px] disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-200">
                    {loading ? 'Creating account...' : 'Create Account'}
                </button>

                <p className="text-center text-slate-500 text-[14px]">
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">Log in</Link>
                </p>
            </form>
        </AuthLayout>
    )
}
