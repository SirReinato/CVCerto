import React from "react";
import styled from "styled-components";
import { Building2 } from "lucide-react";
import type { ApplicationStatus } from "../../shared/types/database.types";
import type { ApplicationItem } from "../../infrastructure/supabase/JobApplicationsRepository";

interface ApplicationsKanbanProps {
  applications: ApplicationItem[];
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
}

const COLUMNS: Array<{ status: ApplicationStatus; label: string; color: string }> = [
  { status: "curriculo_gerado", label: "Currículo Gerado", color: "#607d8b" },
  { status: "curriculo_enviado", label: "Enviado", color: "#1976d2" },
  { status: "triagem_inicial", label: "Triagem RH", color: "#f57c00" },
  { status: "entrevista_tecnica", label: "Entrevista Técnica", color: "#7b1fa2" },
  { status: "entrevista_gestor", label: "Entrevista Gestor", color: "#00796b" },
  { status: "aguardando_retorno", label: "Aguardando", color: "#ffa000" },
  { status: "aprovado", label: "Aprovado 🎉", color: "#388e3c" },
  { status: "reprovado", label: "Reprovado", color: "#d32f2f" },
];

const Board = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
  min-height: 480px;

  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }
`;

const Column = styled.div`
  flex: 0 0 280px;
  background-color: #f4f4f4;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ColumnHeader = styled.div<{ $color: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 3px solid ${(props) => props.$color};
  padding-top: 8px;

  h3 {
    font-size: 0.88rem;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
  }

  span {
    background-color: #e0e0e0;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 12px;
    color: #444;
  }
`;

const Card = styled.div`
  background-color: #ffffff;
  border-radius: 6px;
  padding: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #e8e8e8;

  h4 {
    font-size: 0.9rem;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
  }

  .company {
    font-size: 0.8rem;
    color: #666;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: #777;
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px dashed #eee;
  }
`;

const StatusSelect = styled.select`
  font-size: 0.75rem;
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid #d0d0d0;
  background-color: #fafafa;
  outline: none;
  cursor: pointer;
`;

export const ApplicationsKanban: React.FC<ApplicationsKanbanProps> = ({
  applications,
  onStatusChange,
}) => {
  return (
    <Board>
      {COLUMNS.map((col) => {
        const items = applications.filter((app) => app.status === col.status);
        return (
          <Column key={col.status}>
            <ColumnHeader $color={col.color}>
              <h3>{col.label}</h3>
              <span>{items.length}</span>
            </ColumnHeader>

            {items.map((app) => (
              <Card key={app.id}>
                <h4>{app.jobs?.title || "Vaga Cadastrada"}</h4>
                <div className="company">
                  <Building2 size={14} />
                  <span>{app.jobs?.companies?.name || "Empresa Confidencial"}</span>
                </div>

                <div className="meta">
                  <span>Match: {app.match_overall || 85}%</span>
                  <StatusSelect
                    value={app.status}
                    onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.status} value={c.status}>
                        {c.label}
                      </option>
                    ))}
                  </StatusSelect>
                </div>
              </Card>
            ))}

            {items.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#999", fontSize: "0.8rem" }}>
                Nenhuma vaga
              </div>
            )}
          </Column>
        );
      })}
    </Board>
  );
};
