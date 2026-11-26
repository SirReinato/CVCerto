import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  BookmarkPlus,
  CheckCircle2,
  Trash2,
  FileSearch,
  AlertTriangle,
  MapPin,
  Laptop,
  Info,
} from "lucide-react";
import type {
  DailyRadarItem,
  DailyRadarRun,
  RadarJobDraft,
  RadarTriggerStatus,
} from "../../domain/entities/DailyJobRadar";
import { DailyJobRadarRepository } from "../../infrastructure/supabase/DailyJobRadarRepository";
import { isSafeHttpUrl, openSideBrowser } from "../../shared/utils/popupLauncher";
import { useToast } from "../../context/ToastContext";

interface DailyAiJobsRadarProps {
  userId: string;
  onSaveToKanban: (item: DailyRadarItem) => Promise<string>;
  onSendToAnalyzer: (draft: RadarJobDraft) => void;
  onGoToProfile?: () => void;
}

type RadarFilterKey = "all" | "aderente" | "adaptavel" | "remoto" | "brasilia";

const RadarSectionStl = styled.section`
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const RadarHeaderStl = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
`;

const RadarTitleGroupStl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  p {
    margin: 0;
    font-size: 0.82rem;
    color: ${(props) => props.theme.colors.textSecondary};
    line-height: 1.45;
  }
`;

const RadarHeaderActionsStl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const RadarBadgeStl = styled.span<{ $tone?: "info" | "success" | "warning" | "danger" }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: ${(props) => props.theme.borderRadius.full};
  background-color: ${(props) => {
    if (props.$tone === "success") return "#dcfce7";
    if (props.$tone === "warning") return "#fef3c7";
    if (props.$tone === "danger") return "#fee2e2";
    return "#e0f2fe";
  }};
  color: ${(props) => {
    if (props.$tone === "success") return "#166534";
    if (props.$tone === "warning") return "#92400e";
    if (props.$tone === "danger") return "#991b1b";
    return "#0369a1";
  }};
`;

const ToggleCollapseBtnStl = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: ${(props) => props.theme.borderRadius.md};
  border: 1px solid ${(props) => props.theme.colors.border};
  background-color: #f8fafc;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background-color: #f1f5f9;
  }
`;

const RadarNoticeStl = styled.div<{ $variant?: "info" | "warning" | "danger" }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  border-radius: ${(props) => props.theme.borderRadius.md};
  font-size: 0.8rem;
  line-height: 1.4;
  background-color: ${(props) => {
    if (props.$variant === "danger") return "#fef2f2";
    if (props.$variant === "warning") return "#fffbeb";
    return "#f8fafc";
  }};
  border: 1px solid
    ${(props) => {
      if (props.$variant === "danger") return "#fecaca";
      if (props.$variant === "warning") return "#fde68a";
      return "#e2e8f0";
    }};
  color: ${(props) => {
    if (props.$variant === "danger") return "#991b1b";
    if (props.$variant === "warning") return "#92400e";
    return "#475569";
  }};

  .notice-text {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 240px;
  }
`;

const RadarControlsStl = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const FilterGroupStl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const FilterChipStl = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: ${(props) => props.theme.borderRadius.full};
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${(props) => (props.$active ? "#0f172a" : props.theme.colors.border)};
  background-color: ${(props) => (props.$active ? "#0f172a" : "#ffffff")};
  color: ${(props) => (props.$active ? "#ffffff" : "#475569")};
  transition: all 0.15s ease;

  &:hover {
    background-color: ${(props) => (props.$active ? "#1e293b" : "#f8fafc")};
  }
`;

const RadarGridStl = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 14px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const RadarCardStl = styled.article`
  background-color: #ffffff;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
`;

const CardTopStl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  .badges-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  h4 {
    margin: 0;
    font-size: 0.96rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
  }

  .meta {
    font-size: 0.78rem;
    color: ${(props) => props.theme.colors.textSecondary};
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
`;

const ScoresRowStl = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ScorePillStl = styled.div<{ $score: number }>`
  flex: 1;
  min-width: 130px;
  padding: 8px 10px;
  border-radius: ${(props) => props.theme.borderRadius.md};
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    font-size: 0.7rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
  }

  strong {
    font-size: 0.95rem;
    color: ${(props) =>
      props.$score >= 70 ? "#15803d" : props.$score >= 50 ? "#b45309" : "#475569"};
  }
`;

const SnippetTextStl = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #475569;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const FactsBoxStl = styled.div`
  background-color: #f8fafc;
  border-left: 3px solid #0284c7;
  padding: 8px 10px;
  border-radius: 0 6px 6px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .notes {
    margin: 0;
    font-size: 0.76rem;
    color: #334155;
    line-height: 1.4;
  }
`;

const FactsListStl = styled.ul`
  margin: 0;
  padding-left: 16px;
  list-style: disc;
  font-size: 0.74rem;
  color: #475569;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CardActionsStl = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionButtonStl = styled.button<{
  $variant?: "primary" | "secondary" | "outline" | "danger";
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 11px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  background-color: ${(props) => {
    if (props.$variant === "primary") return "#0f172a";
    if (props.$variant === "secondary") return "#f1f5f9";
    if (props.$variant === "danger") return "#fef2f2";
    return "#ffffff";
  }};
  color: ${(props) => {
    if (props.$variant === "primary") return "#ffffff";
    if (props.$variant === "secondary") return "#334155";
    if (props.$variant === "danger") return "#b91c1c";
    return "#0369a1";
  }};
  border: 1px solid
    ${(props) => {
      if (props.$variant === "primary") return "#0f172a";
      if (props.$variant === "danger") return "#fecaca";
      if (props.$variant === "outline") return "#bae6fd";
      return "#e2e8f0";
    }};

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    filter: brightness(0.96);
  }
`;

const EmptyStateStl = styled.div`
  padding: 20px;
  border-radius: ${(props) => props.theme.borderRadius.md};
  border: 1px dashed #cbd5e1;
  background-color: #f8fafc;
  text-align: center;
  font-size: 0.84rem;
  color: #64748b;
`;

function formatWorkModelLabel(item: DailyRadarItem): string {
  if (item.work_model === "remoto") return "Remoto";
  if (item.work_model === "hibrido") {
    return item.is_brasilia_df ? "Híbrido · Brasília-DF" : "Híbrido";
  }
  return item.is_brasilia_df ? "Presencial · Brasília-DF" : "Presencial";
}

function formatFitLabel(category: DailyRadarItem["fit_category"]): string {
  if (category === "aderente") return "Aderente";
  if (category === "adaptavel") return "Adaptável";
  return "Baixa Aderência";
}

export const DailyAiJobsRadar: React.FC<DailyAiJobsRadarProps> = ({
  userId,
  onSaveToKanban,
  onSendToAnalyzer,
  onGoToProfile,
}) => {
  const { showSuccess, showError, showInfo } = useToast();
  const [isExpanded, setIsExpanded] = useState(true);
  const [items, setItems] = useState<DailyRadarItem[]>([]);
  const [todayRun, setTodayRun] = useState<DailyRadarRun | null>(null);
  const [triggerStatus, setTriggerStatus] = useState<RadarTriggerStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<RadarFilterKey>("all");
  const [savingItemIds, setSavingItemIds] = useState<Set<string>>(new Set());
  const autoTriggeredUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let isCancelled = false;

    const loadCacheAndTriggerDaily = async () => {
      try {
        const [cachedItems, cachedRun] = await Promise.all([
          DailyJobRadarRepository.listActiveItems(userId),
          DailyJobRadarRepository.getTodayRun(userId),
        ]);

        if (isCancelled) return;
        setItems(cachedItems);
        setTodayRun(cachedRun);
      } catch {
        // Falha silenciosa ao ler cache inicial; atualização tentará recuperar
      }

      if (autoTriggeredUserRef.current === userId) return;
      autoTriggeredUserRef.current = userId;

      setIsRefreshing(true);
      setErrorMessage(null);

      try {
        const response = await DailyJobRadarRepository.triggerDailyRadar("auto");
        if (isCancelled) return;

        setTriggerStatus(response.status);
        setTodayRun(response.run);
        setItems(response.items);
        if (response.status === "failed" && response.error) {
          setErrorMessage(response.error);
        }
      } catch (err) {
        if (isCancelled) return;
        const message =
          err instanceof Error ? err.message : "Erro ao atualizar Radar Diário IA.";
        setErrorMessage(message);
      } finally {
        if (!isCancelled) {
          setIsRefreshing(false);
        }
      }
    };

    void loadCacheAndTriggerDaily();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  const handleRetryToday = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const response = await DailyJobRadarRepository.triggerDailyRadar("retry");
      setTriggerStatus(response.status);
      setTodayRun(response.run);
      setItems(response.items);
      if (response.status === "completed") {
        showSuccess("Radar diário atualizado com sucesso!", "Radar IA");
      } else if (response.error) {
        setErrorMessage(response.error);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível reexecutar o Radar hoje.";
      setErrorMessage(message);
      showError(message, "Erro no Radar IA");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDiscardItem = async (itemId: string) => {
    try {
      await DailyJobRadarRepository.updateTriageStatus(itemId, "descartada");
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      showInfo("Vaga descartada e removida das próximas buscas.", "Vaga Descartada");
    } catch {
      showError("Não foi possível descartar a vaga.", "Erro ao Descartar");
    }
  };

  const handleSaveItemToKanban = async (item: DailyRadarItem) => {
    if (savingItemIds.has(item.id) || item.triage_status === "salva_kanban") return;

    setSavingItemIds((prev) => new Set(prev).add(item.id));
    try {
      const createdAppId = await onSaveToKanban(item);
      await DailyJobRadarRepository.linkApplication(item.id, createdAppId);
      setItems((prev) =>
        prev.map((current) =>
          current.id === item.id
            ? {
                ...current,
                triage_status: "salva_kanban",
                linked_application_id: createdAppId,
              }
            : current
        )
      );
    } catch {
      showError("Falha ao salvar vaga do Radar no Kanban.", "Erro ao Salvar");
    } finally {
      setSavingItemIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleAnalyzeItem = (item: DailyRadarItem) => {
    onSendToAnalyzer({
      radarItemId: item.id,
      jobTitle: item.title,
      companyName: item.company_name,
      sourceUrl: item.source_url,
      jobDescription: `[Resumo preliminar da API — cole a descrição completa da vaga abaixo antes de analisar]\n\n${item.summary_snippet}`,
      workModel: item.work_model,
    });
  };

  const handleOpenExternal = (item: DailyRadarItem) => {
    if (!isSafeHttpUrl(item.source_url)) {
      showError("Link externo inválido ou inseguro.", "URL Bloqueada");
      return;
    }
    openSideBrowser(item.source_url, item.title);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeFilter === "aderente") return item.fit_category === "aderente";
      if (activeFilter === "adaptavel") return item.fit_category === "adaptavel";
      if (activeFilter === "remoto") return item.work_model === "remoto";
      if (activeFilter === "brasilia") return item.is_brasilia_df;
      return true;
    });
  }, [items, activeFilter]);

  const isFailedRun = todayRun?.status === "failed" || triggerStatus === "failed";

  return (
    <RadarSectionStl data-testid="daily-ai-jobs-radar">
      <RadarHeaderStl>
        <RadarTitleGroupStl>
          <h3>
            <Sparkles size={19} color="#0284c7" />
            Radar Diário de Vagas IA (PT-BR · Remoto ou Brasília-DF)
          </h3>
          <p>
            Atualização automática 1x por dia civil (America/Sao_Paulo) sobre vagas de IA e
            Desenvolvimento com IA, com triagem ancorada na sua Base da Verdade.
          </p>
        </RadarTitleGroupStl>

        <RadarHeaderActionsStl>
          {isRefreshing && (
            <RadarBadgeStl $tone="info">
              <RefreshCw size={12} /> Atualizando radar hoje...
            </RadarBadgeStl>
          )}
          {!isRefreshing && todayRun?.status === "completed" && (
            <RadarBadgeStl $tone="success">
              Atualizado em {todayRun.run_date} ({items.length} ativas)
            </RadarBadgeStl>
          )}
          <ToggleCollapseBtnStl
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={15} /> Recolher
              </>
            ) : (
              <>
                <ChevronDown size={15} /> Expandir ({items.length})
              </>
            )}
          </ToggleCollapseBtnStl>
        </RadarHeaderActionsStl>
      </RadarHeaderStl>

      {isExpanded && (
        <>
          <RadarNoticeStl $variant="info">
            <div className="notice-text">
              <Info size={16} />
              <span>
                <strong>Triagem preliminar:</strong> Os scores abaixo avaliam apenas o resumo
                retornado pela API. Para gerar currículo sem alucinação, abra a vaga e cole a
                descrição completa no <strong>JobAnalyzer</strong>.
              </span>
            </div>
          </RadarNoticeStl>

          {triggerStatus === "missing_profile" && (
            <RadarNoticeStl $variant="warning">
              <div className="notice-text">
                <AlertTriangle size={16} />
                <span>
                  Seu Perfil Mestre ainda não possui fatos salvos no banco. Salve sua Base da
                  Verdade antes de ativar a triagem diária do Radar.
                </span>
              </div>
              {onGoToProfile && (
                <ActionButtonStl type="button" $variant="primary" onClick={onGoToProfile}>
                  Ir para Perfil Mestre
                </ActionButtonStl>
              )}
            </RadarNoticeStl>
          )}

          {(isFailedRun || errorMessage) && (
            <RadarNoticeStl $variant="danger">
              <div className="notice-text">
                <AlertTriangle size={16} />
                <span>
                  {errorMessage ||
                    todayRun?.error_message ||
                    "Falha na atualização diária do Radar."}
                </span>
              </div>
              {isFailedRun && (
                <ActionButtonStl
                  type="button"
                  $variant="primary"
                  disabled={isRefreshing}
                  onClick={handleRetryToday}
                >
                  <RefreshCw size={13} /> Tentar novamente hoje
                </ActionButtonStl>
              )}
            </RadarNoticeStl>
          )}

          <RadarControlsStl>
            <FilterGroupStl>
              <FilterChipStl
                type="button"
                $active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
              >
                Todas ({items.length})
              </FilterChipStl>
              <FilterChipStl
                type="button"
                $active={activeFilter === "aderente"}
                onClick={() => setActiveFilter("aderente")}
              >
                Aderentes ({items.filter((i) => i.fit_category === "aderente").length})
              </FilterChipStl>
              <FilterChipStl
                type="button"
                $active={activeFilter === "adaptavel"}
                onClick={() => setActiveFilter("adaptavel")}
              >
                Adaptáveis ({items.filter((i) => i.fit_category === "adaptavel").length})
              </FilterChipStl>
              <FilterChipStl
                type="button"
                $active={activeFilter === "remoto"}
                onClick={() => setActiveFilter("remoto")}
              >
                Remoto ({items.filter((i) => i.work_model === "remoto").length})
              </FilterChipStl>
              <FilterChipStl
                type="button"
                $active={activeFilter === "brasilia"}
                onClick={() => setActiveFilter("brasilia")}
              >
                Brasília-DF ({items.filter((i) => i.is_brasilia_df).length})
              </FilterChipStl>
            </FilterGroupStl>
          </RadarControlsStl>

          {filteredItems.length === 0 ? (
            <EmptyStateStl>
              {isRefreshing
                ? "Buscando e classificando novas vagas de IA..."
                : "Nenhuma nova vaga aderente encontrada hoje para os filtros selecionados."}
            </EmptyStateStl>
          ) : (
            <RadarGridStl>
              {filteredItems.map((item) => {
                const isSaving = savingItemIds.has(item.id);
                const isSavedInKanban = item.triage_status === "salva_kanban";

                return (
                  <RadarCardStl key={item.id} data-testid={`radar-card-${item.id}`}>
                    <CardTopStl>
                      <div className="badges-row">
                        <RadarBadgeStl
                          $tone={
                            item.fit_category === "aderente"
                              ? "success"
                              : item.fit_category === "adaptavel"
                                ? "warning"
                                : "info"
                          }
                        >
                          {formatFitLabel(item.fit_category)}
                        </RadarBadgeStl>
                        <RadarBadgeStl $tone="info">
                          {item.work_model === "remoto" ? (
                            <Laptop size={11} />
                          ) : (
                            <MapPin size={11} />
                          )}
                          {formatWorkModelLabel(item)}
                        </RadarBadgeStl>
                        <RadarBadgeStl $tone="warning">Triagem Preliminar</RadarBadgeStl>
                      </div>

                      <h4>{item.title}</h4>
                      <div className="meta">
                        <strong>{item.company_name}</strong>
                        <span>•</span>
                        <span>{item.location_raw}</span>
                      </div>
                    </CardTopStl>

                    <ScoresRowStl>
                      <ScorePillStl $score={item.direct_fit_score}>
                        <span>Aderência Direta</span>
                        <strong>{item.direct_fit_score}%</strong>
                      </ScorePillStl>
                      <ScorePillStl $score={item.adaptability_score}>
                        <span>Adaptabilidade</span>
                        <strong>{item.adaptability_score}%</strong>
                      </ScorePillStl>
                    </ScoresRowStl>

                    <SnippetTextStl>{item.summary_snippet}</SnippetTextStl>

                    {(item.matched_facts.length > 0 || item.adaptability_notes) && (
                      <FactsBoxStl>
                        {item.adaptability_notes && (
                          <p className="notes">{item.adaptability_notes}</p>
                        )}
                        {item.matched_facts.length > 0 && (
                          <FactsListStl>
                            {item.matched_facts.map((fact, idx) => (
                              <li key={`${item.id}-fact-${idx}`}>{fact}</li>
                            ))}
                          </FactsListStl>
                        )}
                      </FactsBoxStl>
                    )}

                    <CardActionsStl>
                      <ActionButtonStl
                        type="button"
                        $variant="outline"
                        onClick={() => handleOpenExternal(item)}
                      >
                        <ExternalLink size={13} /> Abrir Vaga
                      </ActionButtonStl>
                      <ActionButtonStl
                        type="button"
                        $variant="primary"
                        onClick={() => handleAnalyzeItem(item)}
                      >
                        <FileSearch size={13} /> Analisar no JobAnalyzer
                      </ActionButtonStl>
                      <ActionButtonStl
                        type="button"
                        $variant="secondary"
                        disabled={isSaving || isSavedInKanban}
                        onClick={() => handleSaveItemToKanban(item)}
                      >
                        {isSavedInKanban ? (
                          <>
                            <CheckCircle2 size={13} color="#15803d" /> Salva no Kanban
                          </>
                        ) : (
                          <>
                            <BookmarkPlus size={13} /> {isSaving ? "Salvando..." : "Salvar no Kanban"}
                          </>
                        )}
                      </ActionButtonStl>
                      <ActionButtonStl
                        type="button"
                        $variant="danger"
                        onClick={() => handleDiscardItem(item.id)}
                      >
                        <Trash2 size={13} /> Descartar
                      </ActionButtonStl>
                    </CardActionsStl>
                  </RadarCardStl>
                );
              })}
            </RadarGridStl>
          )}
        </>
      )}
    </RadarSectionStl>
  );
};

export default DailyAiJobsRadar;
