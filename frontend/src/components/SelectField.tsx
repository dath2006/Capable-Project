interface Props {
    id: string
    label: string
    value: string
    onChange: (v: string) => void
    options: { value: string; label: string }[]
    required?: boolean
    className?: string
}

export default function SelectField({
    id, label, value, onChange, options,
    required = false, className = '',
}: Props) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label htmlFor={id} className="text-[13px] font-semibold text-slate-700 tracking-wide uppercase">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 outline-none transition-all duration-200 focus:bg-white focus:border-indigo-400 focus:ring-[3px] focus:ring-indigo-100 hover:border-slate-300 appearance-none cursor-pointer"
            >
                <option value="">Select an option</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    )
}
