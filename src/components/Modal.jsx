import { RiCloseLine } from 'react-icons/ri';

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`bg-bg-card border border-border rounded-card w-full shadow-card max-h-[90vh] flex flex-col ${sizes[size] || sizes.md}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-white font-bold text-lg">{title}</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-white transition-colors text-xl" aria-label="Close modal">
            <RiCloseLine />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
