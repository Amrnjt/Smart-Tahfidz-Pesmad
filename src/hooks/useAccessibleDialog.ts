import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const dialogStack: symbol[] = [];
let bodyLockCount = 0;
let previousBodyOverflow = '';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    const style = window.getComputedStyle(element);
    return style.visibility !== 'hidden' && style.display !== 'none' && !element.hasAttribute('aria-hidden');
  });
}

/**
 * Shared modal behavior: initial focus, Escape, Tab trapping, body scroll lock,
 * and returning focus to the element that opened the dialog. A small stack
 * keeps nested dialogs from competing for keyboard events.
 */
export function useAccessibleDialog(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const tokenRef = useRef(Symbol('accessible-dialog'));

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const token = tokenRef.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogStack.push(token);

    if (bodyLockCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
    }
    bodyLockCount += 1;
    document.body.style.overflow = 'hidden';

    const focusFrame = window.requestAnimationFrame(() => {
      const focusable = getFocusableElements(dialog);
      (focusable[0] || dialog).focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (dialogStack[dialogStack.length - 1] !== token) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const activeInsideDialog = active instanceof Node && dialog.contains(active);

      if (event.shiftKey && (active === first || !activeInsideDialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !activeInsideDialog)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown, true);

      const stackIndex = dialogStack.lastIndexOf(token);
      if (stackIndex >= 0) dialogStack.splice(stackIndex, 1);

      bodyLockCount = Math.max(0, bodyLockCount - 1);
      if (bodyLockCount === 0) {
        document.body.style.overflow = previousBodyOverflow;
      }

      window.requestAnimationFrame(() => {
        if (trigger?.isConnected) trigger.focus();
      });
    };
  }, [isOpen]);

  return dialogRef;
}
