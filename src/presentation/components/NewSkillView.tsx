import React, { useState, useRef } from "react";
import styled from "styled-components";
import {
  GraduationCap,
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  BookmarkPlus,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Trash2,
  Tag,
  MessageSquare,
  Compass,
} from "lucide-react";
import type { ResumeData, Certification, SkillCategory } from "../../domain/entities/Resume";
import {
  AiSkillAnalysisService,
  type StructuredSkillResult,
} from "../../infrastructure/ai/AiSkillAnalysisService";
import { useToast } from "../../context/ToastContext";

interface NewSkillViewProps {
  masterProfile: ResumeData;
  onSaveSkill: (updatedProfile: ResumeData, skillTitle: string) => Promise<void>;
  onGoToPreview?: () => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px 4px;
`;

const HeaderBanner = styled.div`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #ffffff;
  border-radius: 12px;
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  @media (max-width: 860px) {
    flex-direction: column;
    align-items: flex-start;
  }

  .title-area {
    display: flex;
    flex-direction: column;
    gap: 8px;

    h2 {
      font-size: 1.35rem;
      font-weight: 700;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #ffffff;
    }

    p {
      margin: 0;
      font-size: 0.88rem;
      color: #94a3b8;
      max-width: 680px;
      line-height: 1.5;
    }
  }

  .badge-panel {
    background-color: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    white-space: nowrap;

    .icon {
      color: #38bdf8;
    }

    .info {
      display: flex;
      flex-direction: column;
      font-size: 0.78rem;

      strong {
        color: #f8fafc;
        font-weight: 600;
      }

      span {
        color: #94a3b8;
      }
    }
  }
`;

const MainCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const DropZone = styled.div<{ $isDragging?: boolean; $hasFile?: boolean }>`
  border: 2px dashed ${(props) => (props.$isDragging ? "#0284c7" : props.$hasFile ? "#10b981" : "#cbd5e1")};
  background-color: ${(props) => (props.$isDragging ? "#f0f9ff" : props.$hasFile ? "#f0fdf4" : "#f8fafc")};
  border-radius: 10px;
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #0284c7;
    background-color: #f0f9ff;
  }

  .icon-wrapper {
    color: ${(props) => (props.$hasFile ? "#10b981" : "#0284c7")};
  }

  strong {
    font-size: 0.92rem;
    color: #0f172a;
  }

  span {
    font-size: 0.78rem;
    color: #64748b;
  }
`;

const FileInfoBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 10px 14px;
  width: 100%;
  max-width: 480px;

  .file-desc {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.82rem;
    color: #166534;
    font-weight: 600;
  }

  button.remove-btn {
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: 4px;

    &:hover {
      background-color: #fee2e2;
    }
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #0f172a;
  }

  textarea,
  input {
    padding: 10px 14px;
    font-size: 0.88rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    outline: none;
    font-family: inherit;
    transition: border-color 0.15s ease;

    &:focus {
      border-color: #0284c7;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
    }
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #0f172a;
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 600;
  padding: 12px 22px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;

  &:hover {
    background-color: #1e293b;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ResultCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-top: 4px solid #0284c7;

  .header-result {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;

    .badge-type {
      background-color: #eff6ff;
      color: #0284c7;
      border: 1px solid #bae6fd;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
`;

const InsightCard = styled.div<{ $borderCol: string; $bgCol: string }>`
  background-color: ${(props) => props.$bgCol};
  border-left: 4px solid ${(props) => props.$borderCol};
  border-radius: 0 8px 8px 0;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  strong {
    font-size: 0.82rem;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  p {
    margin: 0;
    font-size: 0.82rem;
    color: #334155;
    line-height: 1.5;
  }
`;

const TagCloud = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;

  span {
    background-color: #f1f5f9;
    color: #334155;
    font-size: 0.75rem;
    padding: 3px 10px;
    border-radius: 12px;
    font-weight: 600;
    border: 1px solid #e2e8f0;
  }

  span.ats {
    background-color: #ecfdf5;
    color: #047857;
    border-color: #a7f3d0;
  }
`;

const CurrentCatalogSection = styled.div`
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 16px;

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    span {
      font-size: 0.78rem;
      color: #64748b;
    }
  }

  .catalog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }
`;

const CatalogItemCard = styled.div`
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    font-size: 0.85rem;
    color: #0f172a;
  }

  .meta {
    font-size: 0.75rem;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

export const NewSkillView: React.FC<NewSkillViewProps> = ({
  masterProfile,
  onSaveSkill,
  onGoToPreview,
}) => {
  const { showSuccess, showError, showWarning } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [textDescription, setTextDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Resultado extraído e configurável
  const [analyzedResult, setAnalyzedResult] = useState<StructuredSkillResult | null>(null);
  const [editableTitle, setEditableTitle] = useState("");
  const [editableIssuer, setEditableIssuer] = useState("");
  const [editableYear, setEditableYear] = useState("");
  const [editableWorkload, setEditableWorkload] = useState("");

  // Toggles de salvamento no currículo base
  const [addToCertifications, setAddToCertifications] = useState(true);
  const [addToSkills, setAddToSkills] = useState(true);

  const handleFileChange = (file: File) => {
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Separa o cabeçalho base64 ex: data:application/pdf;base64,XXXXX
      const base64Data = result.split(",")[1];
      setFileBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !textDescription.trim()) {
      showWarning("Por favor, anexe um arquivo PDF/imagem ou explique a habilidade no campo de texto.", "Campos Vazios");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await AiSkillAnalysisService.analyzeSkill({
        textDescription: textDescription.trim() || undefined,
        fileBase64: fileBase64 || undefined,
        fileMimeType: selectedFile?.type || "application/pdf",
        fileName: selectedFile?.name,
        currentMasterProfile: masterProfile,
      });

      setAnalyzedResult(result);
      setEditableTitle(result.title);
      setEditableIssuer(result.issuerOrInstitution);
      setEditableYear(result.dateOrYear);
      setEditableWorkload(result.workload || "");
      showSuccess("Habilidade analisada e estruturada com sucesso pela IA!", "Fatos Extraídos");
    } catch {
      showError("Não foi possível analisar os dados da habilidade.", "Erro na Análise");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToMaster = async () => {
    if (!analyzedResult || !editableTitle.trim()) return;

    setIsSaving(true);
    try {
      // Clona o masterProfile para imutabilidade
      const updatedProfile: ResumeData = JSON.parse(JSON.stringify(masterProfile));

      // 1. Adiciona à lista de certificações se toggle ativo
      if (addToCertifications) {
        const newCert: Certification = {
          id: crypto.randomUUID(),
          name: `${editableTitle.trim()}${editableIssuer ? ` (${editableIssuer.trim()})` : ""}`,
          statusOrYear: editableWorkload
            ? `${editableWorkload} – Concluído (${editableYear || new Date().getFullYear()})`
            : `Concluído (${editableYear || new Date().getFullYear()})`,
          category: analyzedResult.type === "certification" ? "principal" : "complementar",
        };

        // Evita duplicatas pelo nome
        const alreadyExists = updatedProfile.certifications.some(
          (c) => c.name.toLowerCase() === newCert.name.toLowerCase()
        );

        if (!alreadyExists) {
          updatedProfile.certifications.unshift(newCert);
        }
      }

      // 2. Adiciona às Habilidades Técnicas se toggle ativo
      if (addToSkills && analyzedResult.skillsGained.length > 0) {
        // Encontra a melhor categoria existente ou cria uma nova
        const categoryTargetName =
          analyzedResult.suggestedCategoryName || "Suporte Técnico e Administração de Sistemas";

        let targetCat = updatedProfile.skills.find(
          (s) => s.categoryName.toLowerCase().includes(categoryTargetName.toLowerCase())
        );

        if (!targetCat && updatedProfile.skills.length > 0) {
          // Usa a primeira categoria de habilidades se não encontrar correspondente direta
          targetCat = updatedProfile.skills[0];
        }

        if (targetCat) {
          analyzedResult.skillsGained.forEach((skill) => {
            if (!targetCat!.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
              targetCat!.skills.push(skill);
            }
          });
        } else {
          // Cria uma nova categoria
          const newCategory: SkillCategory = {
            id: crypto.randomUUID(),
            categoryName: categoryTargetName,
            skills: analyzedResult.skillsGained,
          };
          updatedProfile.skills.push(newCategory);
        }
      }

      await onSaveSkill(updatedProfile, editableTitle);
      showSuccess(
        `"${editableTitle}" foi adicionada com sucesso à Base da Verdade e ao Currículo Base Oficial!`,
        "Base da Verdade Atualizada"
      );

      // Limpa formulário
      setAnalyzedResult(null);
      setSelectedFile(null);
      setFileBase64(null);
      setTextDescription("");
    } catch {
      showError("Erro ao sincronizar com o banco de dados.", "Erro ao Salvar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container>
      {/* Header Banner */}
      <HeaderBanner>
        <div className="title-area">
          <h2>
            <GraduationCap size={24} color="#38bdf8" />
            Nova Habilidade, Curso ou Certificação
          </h2>
          <p>
            Alimente sua <strong>Base da Verdade</strong> contínua. Envie o PDF de uma certificação,
            diploma ou explique o que você aprendeu com suas palavras. A Inteligência Artificial
            analisa, cataloga os fatos reais, gera argumentos de entrevista e atualiza seu Currículo Base.
          </p>
        </div>

        <div className="badge-panel">
          <ShieldCheck size={26} className="icon" />
          <div className="info">
            <strong>Memória Anti-Alucinação</strong>
            <span>Salvo em fatos reais permanentes</span>
          </div>
        </div>
      </HeaderBanner>

      {/* Formulário de Envio */}
      <MainCard>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BookmarkPlus size={20} color="#0284c7" />
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
            Registrar Nova Conquista
          </h3>
        </div>

        {/* Dropzone de Upload de PDF / Imagem */}
        <DropZone
          $isDragging={isDragging}
          $hasFile={!!selectedFile}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileChange(e.dataTransfer.files[0]);
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          <div className="icon-wrapper">
            <UploadCloud size={36} />
          </div>

          {selectedFile ? (
            <FileInfoBox onClick={(e) => e.stopPropagation()}>
              <div className="file-desc">
                <FileText size={18} />
                <span>
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setFileBase64(null);
                }}
                title="Remover arquivo"
              >
                <Trash2 size={16} />
              </button>
            </FileInfoBox>
          ) : (
            <>
              <strong>Clique para enviar ou arraste o certificado em PDF / Imagem</strong>
              <span>Suporta arquivos PDF de certificações, diplomas Alura, Udemy, Microsoft, AWS, etc.</span>
            </>
          )}
        </DropZone>

        {/* Campo de Texto Livre */}
        <FormGroup>
          <label>
            Ou explique a habilidade / curso com suas palavras (Opcional caso tenha enviado o arquivo):
          </label>
          <textarea
            placeholder="Ex: Concluí a certificação AWS Certified Cloud Practitioner hoje. Também aprendi a configurar instâncias EC2, buckets S3, políticas IAM e VPCs corporativas..."
            value={textDescription}
            onChange={(e) => setTextDescription(e.target.value)}
          />
        </FormGroup>

        <PrimaryButton
          type="button"
          disabled={isAnalyzing || (!selectedFile && !textDescription.trim())}
          onClick={handleAnalyze}
        >
          <Sparkles size={16} />
          {isAnalyzing ? "Analisando com Gemini IA..." : "Analisar Conquista e Estruturar Fatos"}
        </PrimaryButton>
      </MainCard>

      {/* Card de Resultado da IA */}
      {analyzedResult && (
        <ResultCard>
          <div className="header-result">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle2 size={22} color="#10b981" />
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
                Fatos Estruturados pela IA
              </h3>
            </div>
            <div className="badge-type">
              <Award size={14} />
              <span>{analyzedResult.typeLabel}</span>
            </div>
          </div>

          {/* Campos Editáveis para Conferência */}
          <div className="grid-2">
            <FormGroup>
              <label>Título Oficial da Conquista:</label>
              <input
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <label>Instituição Emissora / Plataforma:</label>
              <input
                value={editableIssuer}
                onChange={(e) => setEditableIssuer(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <label>Ano / Data de Conclusão:</label>
              <input
                value={editableYear}
                onChange={(e) => setEditableYear(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <label>Carga Horária / Detalhes:</label>
              <input
                value={editableWorkload}
                onChange={(e) => setEditableWorkload(e.target.value)}
                placeholder="Ex: 40 horas"
              />
            </FormGroup>
          </div>

          {/* Hard Skills e ATS Keywords */}
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              Hard Skills Técnicas Adquiridas:
            </div>
            <TagCloud>
              {analyzedResult.skillsGained.map((sk, idx) => (
                <span key={idx}>✓ {sk}</span>
              ))}
              {analyzedResult.atsKeywords.map((kw, idx) => (
                <span key={idx} className="ats">
                  ATS: {kw}
                </span>
              ))}
            </TagCloud>
          </div>

          {/* Diagnóstico de Carreira & Argumento de Entrevista */}
          <InsightCard $borderCol="#0284c7" $bgCol="#f0f9ff">
            <strong>
              <Compass size={15} color="#0284c7" />
              Impacto em Vagas Futuras:
            </strong>
            <p>{analyzedResult.careerImpact}</p>
          </InsightCard>

          <InsightCard $borderCol="#10b981" $bgCol="#f0fdf4">
            <strong>
              <MessageSquare size={15} color="#10b981" />
              Argumento Pronto para Entrevista (1ª Pessoa):
            </strong>
            <p>"{analyzedResult.interviewTalkingPoints}"</p>
          </InsightCard>

          {/* Toggles de Inserção no Currículo Base */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              backgroundColor: "#f8fafc",
              padding: "14px 18px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
              Onde salvar no Currículo Base Oficial:
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.83rem", color: "#334155" }}>
              <input
                type="checkbox"
                checked={addToCertifications}
                onChange={(e) => setAddToCertifications(e.target.checked)}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              <span>
                Adicionar à seção <strong>Certificações & Cursos</strong> do Currículo Base
              </span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.83rem", color: "#334155" }}>
              <input
                type="checkbox"
                checked={addToSkills}
                onChange={(e) => setAddToSkills(e.target.checked)}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              <span>
                Adicionar as novas Hard Skills à seção <strong>Habilidades Técnicas</strong>
              </span>
            </label>
          </div>

          {/* Botão de Salvar */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <PrimaryButton
              type="button"
              disabled={isSaving || !editableTitle.trim()}
              onClick={handleSaveToMaster}
            >
              <Zap size={16} />
              {isSaving ? "Sincronizando no Supabase..." : "Salvar na Memória & Atualizar Currículo Base"}
            </PrimaryButton>

            {onGoToPreview && (
              <button
                type="button"
                onClick={onGoToPreview}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0284c7",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Visualizar Currículo Base <ArrowRight size={14} />
              </button>
            )}
          </div>
        </ResultCard>
      )}

      {/* Catálogo Atual de Conquistas da Base da Verdade */}
      <CurrentCatalogSection>
        <div className="section-header">
          <h3>
            <Layers size={18} color="#0f172a" />
            Certificações & Conquistas Registradas na Base da Verdade
          </h3>
          <span>{masterProfile.certifications.length} validadas no currículo oficial</span>
        </div>

        <div className="catalog-grid">
          {masterProfile.certifications.map((cert) => (
            <CatalogItemCard key={cert.id}>
              <strong>{cert.name}</strong>
              <div className="meta">
                <Tag size={12} />
                <span>{cert.statusOrYear}</span>
                <span>•</span>
                <span>{cert.category === "principal" ? "Principal" : "Complementar"}</span>
              </div>
            </CatalogItemCard>
          ))}
        </div>
      </CurrentCatalogSection>
    </Container>
  );
};
