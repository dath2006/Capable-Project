interface Props {
    id: string
    label: string
    type?: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    required?: boolean
    error?: string
    className?: string
}

export default function InputField({
    id, label, type = 'text', value, onChange,
    placeholder, required = false, error, className = '',
}: Props) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label htmlFor={id} className="text-[13px] font-semibold text-slate-700 tracking-wide uppercase">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:border-indigo-400 focus:ring-[3px] focus:ring-indigo-100 hover:border-slate-300"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
    )
}
