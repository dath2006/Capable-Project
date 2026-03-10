import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import { login } from '../services/authApi'

export default function LoginPage() {
    const nav = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const data = await login({ username, password })
            localStorage.setItem('access_token', data.access_token)
            nav('/')
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed')
        } finally { setLoading(false) }
    }

    return (
        <AuthLayout title="Welcome back" subtitle="Log in to your account to continue">
            <form onSubmit={submit} className="flex flex-col gap-5">
                {error && <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

                <InputField id="username" label="Username" value={username} onChange={setUsername} placeholder="johndoe" required className="animate-fade-in stagger-1" />
                <InputField id="password" label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required className="animate-fade-in stagger-2" />

                <div className="flex justify-end -mt-2">
                    <Link to="/forgot-password" className="text-[13px] text-indigo-600 hover:text-indigo-700 font-medium">
                        Forgot password?
                    </Link>
                </div>

                <button type="submit" disabled={loading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition-all duration-200 text-[14px] disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-200">
                    {loading ? 'Logging in...' : 'Log In'}
                </button>

                <p className="text-center text-slate-500 text-[14px]">
                    Don&apos;t have an account?{' '}
                    <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-semibold">Sign up</Link>
                </p>
            </form>
        </AuthLayout>
    )
}
