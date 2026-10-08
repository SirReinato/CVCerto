import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext";

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f7f1de;
  color: #1e1e1e;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  .spinner {
    width: 40px;
    height: 40px;
    border: 3.5px solid #d0d0d0;
    border-top-color: #1e1e1e;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <LoadingWrapper>
        <div className="spinner" />
        <p style={{ fontWeight: 500, fontSize: "0.9rem" }}>Carregando sessão...</p>
      </LoadingWrapper>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
