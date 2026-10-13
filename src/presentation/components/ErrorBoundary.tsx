import { Component, type ErrorInfo, type ReactNode } from "react";
import styled from "styled-components";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f7f1de;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
`;

const ErrorCard = styled.div`
  max-width: 520px;
  width: 100%;
  background: #ffffff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0d8c3;
  text-align: center;

  .icon {
    width: 56px;
    height: 56px;
    background-color: #fee2e2;
    color: #ef4444;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 1.4rem;
    font-weight: 700;
    color: #1e1e1e;
    margin-bottom: 8px;
  }

  p {
    color: #666666;
    font-size: 0.92rem;
    line-height: 1.5;
    margin-bottom: 20px;
  }

  pre {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 12px;
    border-radius: 6px;
    font-size: 0.78rem;
    color: #b91c1c;
    text-align: left;
    overflow-x: auto;
    margin-bottom: 24px;
    max-height: 140px;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background-color: #1e1e1e;
    color: #ffffff;
    border: none;
    border-radius: 6px;
    padding: 12px 24px;
    font-size: 0.92rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #333333;
    }
  }
`;

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CV Certo ErrorBoundary] Erro capturado:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorCard>
            <div className="icon">
              <AlertTriangle size={28} />
            </div>
            <h2>Ops! Algo deu errado</h2>
            <p>
              Ocorreu uma falha inesperada na interface do CV Certo. Você pode tentar
              recarregar a página ou limpar os dados locais.
            </p>
            {this.state.error && (
              <pre>{this.state.error.message || String(this.state.error)}</pre>
            )}
            <button onClick={() => window.location.reload()}>
              <RefreshCw size={16} />
              Recarregar Aplicação
            </button>
          </ErrorCard>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
