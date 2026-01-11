import { AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Alert.css';

export default function Alert({ title, message, type = 'error', onClose }) {
    if (!message) return null;

    const variants = {
        error: { bg: 'var(--bg-danger-light)', border: 'var(--text-danger)', icon: 'var(--text-danger)' },
        success: { bg: 'var(--bg-success-light)', border: 'var(--text-success)', icon: 'var(--text-success)' },
        warning: { bg: 'var(--bg-warning-light)', border: 'var(--text-warning)', icon: 'var(--text-warning)' }
    };

    const style = variants[type] || variants.error;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`alert-box alert-${type}`}
            >
                <div className="alert-content">
                    <AlertCircle size={20} className="alert-icon" />
                    <div>
                        {title && <strong>{title}</strong>}
                        <p>{message}</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="alert-close">
                        <X size={18} />
                    </button>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
