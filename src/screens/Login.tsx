import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, AlertCircle, ArrowRight, FileCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f7f1de;
  padding: 24px 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
`;

const Card = styled.div`
  width: 100%;
  max-width: 440px;
  background-color: #ffffff;
  border-radius: 12px;
  padding: 36px 32px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebe5d5;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 28px;

  .logo-icon {
    width: 48px;
    height: 48px;
    background-color: #1e1e1e;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    margin-bottom: 12px;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0 0 6px 0;
  }

  p {
    font-size: 0.85rem;
    color: #666666;
    margin: 0;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #333333;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;

    svg {
      position: absolute;
      left: 12px;
      color: #888888;
    }

    input {
      width: 100%;
      padding: 11px 12px 11px 38px;
      border: 1px solid #d0d0d0;
      border-radius: 6px;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
      background-color: #fafafa;

      &:focus {
        border-color: #1e1e1e;
        background-color: #ffffff;
      }
    }
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #1e1e1e;
  color: #ffffff;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.92rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 6px;

  &:hover {
    background-color: #333333;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ToggleMode = styled.button`
  background: none;
  border: none;
  color: #555555;
  font-size: 0.8rem;
  text-decoration: underline;
  cursor: pointer;
  margin-top: 14px;
  text-align: center;
  width: 100%;

  &:hover {
    color: #1e1e1e;
  }
`;

const ErrorAlert = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #ffebee;
  color: #c62828;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 0.82rem;
  margin-bottom: 16px;
`;

export const Login: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        const { error } = await signUp(email, password);
        if (error) {
          setErrorMessage(error.message || "Erro ao realizar cadastro.");
        } else {
          navigate("/");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMessage("E-mail ou senha incorretos.");
        } else {
          navigate("/");
        }
      }
    } catch {
      setErrorMessage("Ocorreu um erro inesperado ao autenticar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <Card>
        <Header>
          <div className="logo-icon">
            <FileCheck size={26} />
          </div>
          <h1>CV Certo</h1>
          <p>
            {isRegistering
              ? "Crie sua conta para gerenciar candidaturas"
              : "Entre para acessar seus currículos e candidaturas"}
          </p>
        </Header>

        {errorMessage && (
          <ErrorAlert>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </ErrorAlert>
        )}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <label htmlFor="email">E-mail</label>
            <div className="input-wrapper">
              <Mail size={16} />
              <input
                id="email"
                type="email"
                placeholder="seu.email@outlook.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </FormGroup>

          <FormGroup>
            <label htmlFor="password">Senha</label>
            <div className="input-wrapper">
              <Lock size={16} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </FormGroup>

          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Processando..."
              : isRegistering
              ? "Criar Conta"
              : "Entrar no Sistema"}
            <ArrowRight size={16} />
          </SubmitButton>
        </Form>

        <ToggleMode
          type="button"
          onClick={() => {
            setIsRegistering(!isRegistering);
            setErrorMessage(null);
          }}
        >
          {isRegistering
            ? "Já possui uma conta? Faça login"
            : "Primeiro acesso? Crie sua conta com e-mail e senha"}
        </ToggleMode>
      </Card>
    </PageContainer>
  );
};

export default Login;
