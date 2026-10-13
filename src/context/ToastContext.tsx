import React, { createContext, useContext, useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextData {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const ToastViewport = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 420px;
  width: calc(100vw - 32px);
  pointer-events: none;

  @media print {
    display: none !important;
  }
`;

const ToastCard = styled.div<{ $type: ToastType }>`
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  animation: ${slideIn} 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid
    ${(props) => {
      switch (props.$type) {
        case "success":
          return "#bbf7d0";
        case "error":
          return "#fecaca";
        case "warning":
          return "#fde68a";
        case "info":
        default:
          return "#bfdbfe";
      }
    }};
  background-color: ${(props) => {
    switch (props.$type) {
      case "success":
        return "#f0fdf4";
      case "error":
        return "#fef2f2";
      case "warning":
        return "#fffbeb";
      case "info":
      default:
        return "#eff6ff";
    }
  }};
  color: #0f172a;

  .toast-icon {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${(props) => {
      switch (props.$type) {
        case "success":
          return "#16a34a";
        case "error":
          return "#dc2626";
        case "warning":
          return "#d97706";
        case "info":
        default:
          return "#2563eb";
      }
    }};
  }

  .toast-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;

    .toast-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #0f172a;
    }

    .toast-message {
      font-size: 0.82rem;
      color: #334155;
      line-height: 1.45;
      word-break: break-word;
    }
  }

  .toast-close {
    flex-shrink: 0;
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      color: #0f172a;
      background: rgba(0, 0, 0, 0.05);
    }
  }
`;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", title?: string, duration: number = 4000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (message: string, title?: string) => {
      showToast(message, "success", title || "Sucesso!");
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, title?: string) => {
      showToast(message, "error", title || "Erro");
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, title?: string) => {
      showToast(message, "info", title || "Informação");
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, title?: string) => {
      showToast(message, "warning", title || "Atenção");
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showInfo, showWarning, removeToast }}
    >
      {children}
      <ToastViewport>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} $type={toast.type}>
            <div className="toast-icon">
              {toast.type === "success" && <CheckCircle2 size={18} />}
              {toast.type === "error" && <AlertCircle size={18} />}
              {toast.type === "warning" && <AlertTriangle size={18} />}
              {toast.type === "info" && <Info size={18} />}
            </div>

            <div className="toast-content">
              {toast.title && <div className="toast-title">{toast.title}</div>}
              <div className="toast-message">{toast.message}</div>
            </div>

            <button
              className="toast-close"
              type="button"
              onClick={() => removeToast(toast.id)}
              title="Fechar"
            >
              <X size={15} />
            </button>
          </ToastCard>
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser utilizado dentro de um ToastProvider");
  }
  return context;
};
