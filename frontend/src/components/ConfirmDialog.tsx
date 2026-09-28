import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  isConfirming = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) => (
  <Modal isOpen={isOpen} onClose={onCancel} title={title}>
    <p className="text-sm text-gray-600">{message}</p>
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        disabled={isConfirming}
        onClick={onCancel}
        className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={isConfirming}
        onClick={onConfirm}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {isConfirming ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
