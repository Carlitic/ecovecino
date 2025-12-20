import './Input.css';

export default function Input({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    required = false,
    icon: Icon,
    error,
    ...props
}) {
    return (
        <div className="input-group">
            {label && (
                <label className="input-label">
                    {label}
                    {required && <span className="required">*</span>}
                </label>
            )}
            <div className="input-wrapper">
                {Icon && <Icon className="input-icon" size={18} />}
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className={`input ${Icon ? 'input-with-icon' : ''} ${error ? 'input-error' : ''}`}
                    {...props}
                />
            </div>
            {error && <span className="error-message">{error}</span>}
        </div>
    );
}
