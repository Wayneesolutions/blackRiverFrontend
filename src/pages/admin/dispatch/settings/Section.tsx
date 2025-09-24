import { useState } from "react";
export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
}) => {
    const [open, setOpen] = useState(true);
    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Section Header */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex justify-between items-center px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                style={{ backgroundColor: '#f3f4f6' }}
            >
                {title}
                <span className="text-lg">{open ? "−" : "+"}</span>
            </button>
            {/* Section Body */}
            {open && <div className="p-4 space-y-4" style={{ backgroundColor: 'white' }}>{children}</div>}
        </div>
    );
};

export const Toggle = ({
    label,
    checked,
    onChange
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) => {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="hidden"
            />
            <span
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${checked ? "bg-green-500" : "bg-gray-300"
                    }`}
            >
                <span
                    className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${checked ? "translate-x-4" : "translate-x-0"
                        }`}
                />
            </span>
            <span className="text-gray-700">{label}</span>
        </label>
    );
};