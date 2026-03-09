import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import { forgotPassword } from '../services/authApi'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(''); setSuccess('')
        setLoading(true)
        try {
            const data = await forgotPassword(email)
            setSuccess(`Reset token: ${data.token}`)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Request failed')
        } finally { setLoading(false) }
    }

    return (
        <AuthLayout title="Forgot password?" subtitle="No worries, we'll help you reset it">
            <form onSubmit={submit} className="flex flex-col gap-5">
                {error && <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
                {success && <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm break-all">{success}</div>}

                <InputField id="email" label="Email address" type="email" value={email} onChange={setEmail} placeholder="john@example.com" required className="animate-fade-in stagger-1" />

                <button type="submit" disabled={loading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition-all duration-200 text-[14px] disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-200">
                    {loading ? 'Sending...' : 'Send Reset Token'}
                </button>

                <div className="flex justify-between text-[14px]">
                    <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">← Back to Login</Link>
                    <Link to="/reset-password" className="text-indigo-600 hover:text-indigo-700 font-semibold">Have a token? →</Link>
                </div>
            </form>
        </AuthLayout>
    )
}
