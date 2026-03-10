import type { ReactNode } from 'react'

interface Props {
    title: string
    subtitle: string
    children: ReactNode
}

export default function AuthLayout({ title, subtitle, children }: Props) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-[420px] flex flex-col animate-fade-in">
                <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
                    {title}
                </h1>
                <p className="text-slate-500 text-[15px] mt-1 mb-8">{subtitle}</p>
                {children}
            </div>
        </div>
    )
}
