import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, FolderCog, School, Users } from 'lucide-react';
import type { ActiveTab } from '../types';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

interface ManageActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tab: ActiveTab) => void;
}

const actions: Array<{
  tab: ActiveTab;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    tab: 'kelas',
    title: 'Kelola Kelas',
    subtitle: 'Kelas, musyrif, dan pembagian santri',
    icon: School
  },
  {
    tab: 'santri',
    title: 'Kelola Santri',
    subtitle: 'Data santri dan akun terkait',
    icon: Users
  }
];

export const ManageActionSheet: React.FC<ManageActionSheetProps> = ({ isOpen, onClose, onSelect }) => {
  const dialogRef = useAccessibleDialog(isOpen, onClose);

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
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            className="p2-manage-folder-backdrop"
            aria-label="Tutup menu Kelola"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
          />

          <motion.div
            ref={dialogRef}
            className="p2-manage-folder"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-folder-title"
            aria-describedby="manage-folder-description"
            tabIndex={-1}
            initial={{ opacity: 0, y: 18, scale: 0.9, rotateX: -4 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 12, scale: 0.94, rotateX: -3 }}
            transition={{ type: 'spring', stiffness: 390, damping: 28, mass: 0.72 }}
          >
            <div className="p2-manage-folder-tab" aria-hidden="true">
              <FolderCog className="h-3.5 w-3.5" />
              <span>Kelola</span>
            </div>

            <div className="p2-manage-folder-body">
              <div className="p2-manage-folder-heading">
                <h2 id="manage-folder-title">Kelola Data</h2>
                <p id="manage-folder-description">Pilih data operasional yang ingin dikelola</p>
              </div>

              <div className="p2-manage-folder-actions">
                {actions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      type="button"
                      key={action.tab}
                      className="p2-manage-folder-item"
                      onClick={() => chooseAction(action.tab)}
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{
                        type: 'spring',
                        stiffness: 430,
                        damping: 28,
                        mass: 0.62,
                        delay: 0.04 + index * 0.055
                      }}
                    >
                      <span className="p2-manage-folder-icon" aria-hidden="true">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="p2-manage-folder-copy">
                        <span className="p2-manage-folder-title">{action.title}</span>
                        <span className="p2-manage-folder-subtitle">{action.subtitle}</span>
                      </span>
                      <ChevronRight className="p2-manage-folder-chevron" aria-hidden="true" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
