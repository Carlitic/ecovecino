import './Button.css';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    onClick,
    type = 'button',
    disabled = false,
    className = ''
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`btn btn-${variant} btn-${size} ${className}`}
        >
            {children}
        </button>
    );
}
