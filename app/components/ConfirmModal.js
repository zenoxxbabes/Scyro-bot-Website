
'use client';
import Modal from './Modal';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDanger = false }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md w-full bg-[#2b2d31]">
            <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                <p className="text-gray-300 mb-6">{message}</p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded text-gray-300 hover:bg-[#1e1f22] transition-colors font-medium"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 rounded text-white font-bold transition-colors ${isDanger
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-[#6a0dad] hover:bg-[#720e9e]'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
