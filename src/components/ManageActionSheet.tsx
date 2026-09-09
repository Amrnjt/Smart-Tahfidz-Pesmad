import React, { useEffect } from 'react';
import { School, Users } from 'lucide-react';
import type { ActiveTab } from '../types';

interface ManageActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tab: ActiveTab) => void;
}

const actions: Array<{
  tab: ActiveTab;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    tab: 'kelas',
    title: 'Kelola Kelas',
    icon: School
  },
  {
    tab: 'santri',
    title: 'Kelola Santri',
    icon: Users
  }
];

export const ManageActionSheet: React.FC<ManageActionSheetProps> = ({ isOpen, onClose, onSelect }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const chooseAction = (tab: ActiveTab) => {
    onSelect(tab);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="p2-manage-dropdown-backdrop"
          aria-label="Tutup menu Kelola"
          onClick={onClose}
        />
      )}

      <div
        id="manage-dropdown-menu"
        className={`p2-manage-dropdown ${isOpen ? 'is-open' : ''}`}
        role="menu"
        aria-label="Pilihan Kelola"
        aria-hidden={!isOpen}
      >
        <div className="p2-manage-dropdown-list">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                type="button"
                role="menuitem"
                key={action.tab}
                className="p2-manage-dropdown-link"
                onClick={() => chooseAction(action.tab)}
                tabIndex={isOpen ? 0 : -1}
              >
                <span className="p2-manage-dropdown-title">{action.title}</span>
                <span className="p2-manage-dropdown-icon" aria-hidden="true">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
