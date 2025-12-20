import { X } from 'lucide-react';
import Button from './Button';
import './ConfirmationModal.css';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="icon-btn close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="danger" onClick={onConfirm}>Eliminar</Button>
                </div>
            </div>
        </div>
    );
}
