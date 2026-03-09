const API = 'http://localhost:8000'

export async function signup(data: {
    username: string; email: string; password: string;
    confirm_password: string; study_field: string;
    semester?: string; college_name?: string; phone?: string;
}) {
    const res = await fetch(`${API}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Signup failed')
    }
    return res.json()
}

export async function login(data: {
    username: string; password: string;
}) {
    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Login failed')
    }
    return res.json()
}

export async function forgotPassword(email: string) {
    const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Request failed')
    }
    return res.json()
}

export async function resetPassword(data: {
    token: string; new_password: string; confirm_password: string;
}) {
    const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Reset failed')
    }
    return res.json()
}
