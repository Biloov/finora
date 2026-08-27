import React from 'react';
import { useNavigate } from 'react-router-dom';

interface QuickAddModalProps {
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const handleSelect = (type: 'EXPENSE' | 'INCOME' | 'TRANSFER') => {
    navigate(`/add-transaction?type=${type}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/45 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-surface-container-lowest rounded-t-2xl p-6 shadow-xl border-t border-surface-container-high animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline-md text-lg text-primary">Ajouter une opération</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Expense */}
          <button 
            onClick={() => handleSelect('EXPENSE')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-outline-variant/30 hover:bg-danger-red/10 group transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-full bg-danger-red/10 flex items-center justify-center text-danger-red group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[28px]">upload</span>
            </div>
            <span className="font-label-caps text-label-caps text-on-surface-variant group-hover:text-danger-red">Dépense</span>
          </button>

          {/* Income */}
          <button 
            onClick={() => handleSelect('INCOME')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-outline-variant/30 hover:bg-success-green/10 group transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-full bg-success-green/10 flex items-center justify-center text-success-green group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[28px]">download</span>
            </div>
            <span className="font-label-caps text-label-caps text-on-surface-variant group-hover:text-success-green">Revenu</span>
          </button>

          {/* Transfer */}
          <button 
            onClick={() => handleSelect('TRANSFER')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-outline-variant/30 hover:bg-secondary-container/10 group transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-full bg-secondary-container/10 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[28px]">sync_alt</span>
            </div>
            <span className="font-label-caps text-label-caps text-on-surface-variant group-hover:text-secondary">Transfert</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAddModal;
