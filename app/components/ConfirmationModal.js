'use client';
import Modal from './Modal';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", confirmColor = "bg-[#6a0dad]" }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6 text-center">
                <h2 className="text-xl font-bold mb-2">{title}</h2>
                <p className="text-gray-400 mb-6">{message}</p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded text-gray-300 hover:bg-[#3f4147] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-6 py-2 rounded text-white hover:opacity-90 transition-opacity ${confirmColor}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
