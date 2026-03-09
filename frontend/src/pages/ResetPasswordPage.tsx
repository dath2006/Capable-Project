import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import { resetPassword } from '../services/authApi'

export default function ResetPasswordPage() {
    const nav = useNavigate()
    const [token, setToken] = useState('')
    const [newPw, setNewPw] = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (newPw !== confirmPw) return setError('Passwords do not match')
        setLoading(true)
        try {
            await resetPassword({ token, new_password: newPw, confirm_password: confirmPw })
            nav('/login')
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Reset failed')
        } finally { setLoading(false) }
    }

    return (
        <AuthLayout title="Reset password" subtitle="Enter your reset token and choose a new password">
            <form onSubmit={submit} className="flex flex-col gap-5">
                {error && <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

                <InputField id="token" label="Reset Token" value={token} onChange={setToken} placeholder="Paste your token here" required className="animate-fade-in stagger-1" />
                <InputField id="newpw" label="New Password" type="password" value={newPw} onChange={setNewPw} placeholder="••••••••" required className="animate-fade-in stagger-2" />
                <InputField id="confirmpw" label="Confirm Password" type="password" value={confirmPw} onChange={setConfirmPw} placeholder="••••••••" required className="animate-fade-in stagger-3" />

                <button type="submit" disabled={loading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition-all duration-200 text-[14px] disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-200">
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>

                <p className="text-center text-[14px]">
                    <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">← Back to Login</Link>
                </p>
            </form>
        </AuthLayout>
    )
}
