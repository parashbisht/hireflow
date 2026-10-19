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
    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{message}</p>
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        disabled={isConfirming}
        onClick={onCancel}
        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={isConfirming}
        onClick={onConfirm}
        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
      >
        {isConfirming ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
