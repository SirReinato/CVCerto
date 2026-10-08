import React, { useState } from "react";
import styled from "styled-components";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, FileText, CheckCircle2, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { MASTER_PROFILE } from "../shared/constants/masterProfile";
import type { ResumeData } from "../domain/entities/Resume";
import { ResumeWebPreview } from "../presentation/components/ResumeWebPreview";
import { ResumePDFTemplate } from "../presentation/templates/ResumePDFTemplate";

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
  gap: 16px;

  h1 {
    font-size: 1.4rem;
    color: #1e1e1e;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const ActionsGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const Button = styled.button<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: 1px solid ${(props) => (props.$primary ? "#1E1E1E" : "#d0d0d0")};
  background-color: ${(props) => (props.$primary ? "#1E1E1E" : "#ffffff")};
  color: ${(props) => (props.$primary ? "#ffffff" : "#1E1E1E")};
  transition: all 0.2s ease;
  text-decoration: none;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const MainContent = styled.div`
  display: flex;
  gap: 24px;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

const Sidebar = styled.div`
  flex: 1;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: fit-content;

  h2 {
    font-size: 1.1rem;
    color: #1e1e1e;
    margin: 0 0 12px 0;
  }

  p {
    font-size: 0.85rem;
    color: #555555;
    line-height: 1.5;
  }

  ul {
    padding-left: 20px;
    margin: 12px 0;
    font-size: 0.85rem;
    color: #444444;

    li {
      margin-bottom: 6px;
    }
  }
`;

const PreviewArea = styled.div`
  flex: 2.2;
`;

export const Home: React.FC = () => {
  const { user, signOut } = useAuth();
  const [resumeData] = useState<ResumeData>(MASTER_PROFILE);

  return (
    <Container>
      <TopBar>
        <div>
          <h1>
            <FileText size={24} /> CV Certo - Template Oficial
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#666" }}>
            Design System idêntico aos currículos oficiais de Renato de França Lima.
          </p>
        </div>

        <ActionsGroup>
          {user?.email && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.82rem",
                color: "#555",
                fontWeight: 500,
              }}
            >
              <UserIcon size={16} />
              <span>{user.email}</span>
            </div>
          )}

          <Badge>
            <CheckCircle2 size={16} /> 100% Compatível com ATS
          </Badge>

          <PDFDownloadLink
            document={<ResumePDFTemplate data={resumeData} />}
            fileName="Curriculo_Renato_Franca_Lima.pdf"
            style={{ textDecoration: "none" }}
          >
            {({ loading }) => (
              <Button $primary disabled={loading}>
                <Download size={16} />
                {loading ? "Preparando PDF..." : "Baixar PDF Oficial"}
              </Button>
            )}
          </PDFDownloadLink>

          <Button onClick={signOut} title="Encerrar Sessão">
            <LogOut size={16} />
            Sair
          </Button>
        </ActionsGroup>
      </TopBar>

      <MainContent>
        <Sidebar>
          <h2>Especificações do Template</h2>
          <p>
            Este template reproduz com fidelidade milimétrica a tipografia, proporções,
            linhas e marcadores geométricos presentes nos seus 3 modelos de currículo.
          </p>
          <ul>
            <li>
              <strong>Tipografia:</strong> Helvetica / Sans-serif de alta legibilidade.
            </li>
            <li>
              <strong>Header:</strong> Quadrados pretos decorativos e nome em caixa alta
              espaçado.
            </li>
            <li>
              <strong>Padrão ATS:</strong> O arquivo PDF é gerado via código vetorial,
              permitindo que recrutadores e robôs extraiam cada palavra-chave sem erros.
            </li>
            <li>
              <strong>Fonte da Verdade:</strong> Carregado com o Perfil Mestre real
              (Brasfort, Truly Informática, UCB, UniCesumar, ITIL, Azure).
            </li>
          </ul>
        </Sidebar>

        <PreviewArea>
          <ResumeWebPreview data={resumeData} />
        </PreviewArea>
      </MainContent>
    </Container>
  );
};
export default Home;