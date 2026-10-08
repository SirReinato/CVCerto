import React from "react";
import styled from "styled-components";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { ApplicationItem } from "../../infrastructure/supabase/JobApplicationsRepository";

interface DashboardMetricsProps {
  applications: ApplicationItem[];
}

const Grid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const KPIContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 800px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const KPICard = styled.div<{ $border: string }>`
  background-color: #ffffff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border-left: 4px solid ${(props) => props.$border};
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    font-size: 0.78rem;
    color: #666;
    font-weight: 600;
    text-transform: uppercase;
  }

  .value {
    font-size: 1.8rem;
    font-weight: 700;
    color: #1e1e1e;
  }
`;

const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 16px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

  h3 {
    margin: 0 0 16px 0;
    font-size: 0.95rem;
    color: #1e1e1e;
    font-weight: 700;
  }
`;

const COLORS = ["#1976D2", "#7B1FA2", "#388E3C", "#D32F2F", "#FFA000"];

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ applications }) => {
  const total = applications.length;
  const interviews = applications.filter((a) =>
    a.status.includes("entrevista") || a.status === "aprovado"
  ).length;
  const approved = applications.filter((a) => a.status === "aprovado").length;
  const conversionRate = total > 0 ? Math.round((interviews / total) * 100) : 0;

  // Distribuição por status
  const statusCounts = applications.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.keys(statusCounts).map((status) => ({
    name: status.replace("_", " "),
    total: statusCounts[status],
  }));

  const pieData = [
    { name: "Entrevistas", value: interviews || 1 },
    { name: "Outros", value: Math.max(0, total - interviews) || 1 },
  ];

  return (
    <Grid>
      <KPIContainer>
        <KPICard $border="#1976D2">
          <div className="label">Total de Candidaturas</div>
          <div className="value">{total}</div>
        </KPICard>

        <KPICard $border="#7B1FA2">
          <div className="label">Total de Entrevistas</div>
          <div className="value">{interviews}</div>
        </KPICard>

        <KPICard $border="#388E3C">
          <div className="label">Taxa de Conversão</div>
          <div className="value">{conversionRate}%</div>
        </KPICard>

        <KPICard $border="#FFA000">
          <div className="label">Aprovações</div>
          <div className="value">{approved}</div>
        </KPICard>
      </KPIContainer>

      <ChartsRow>
        <ChartCard>
          <h3>Candidaturas por Etapa do Processo</h3>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData.length > 0 ? barData : [{ name: "Rascunho", total: 1 }]}>
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="total" fill="#1E1E1E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard>
          <h3>Proporção de Avanço</h3>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </ChartsRow>
    </Grid>
  );
};
