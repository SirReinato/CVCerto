import React, { useState } from "react";
import styled from "styled-components";
import { Plus, Trash2, Save, User, Briefcase, GraduationCap, Award } from "lucide-react";
import type { ResumeData, Experience, Education, Certification } from "../../domain/entities/Resume";

interface ProfileEditorProps {
  data: ResumeData;
  onSave: (updatedData: ResumeData) => Promise<void>;
  isSaving: boolean;
}

const EditorContainer = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 2px solid #1e1e1e;
  padding-bottom: 8px;
  margin-bottom: 12px;

  h2 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
  }
`;

const FieldGrid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.$cols || 2}, 1fr);
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #444444;
  }

  input,
  textarea {
    padding: 8px 10px;
    border: 1px solid #d0d0d0;
    border-radius: 5px;
    font-size: 0.85rem;
    outline: none;
    font-family: inherit;

    &:focus {
      border-color: #1e1e1e;
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }
`;

const CardItem = styled.div`
  border: 1px solid #e5e5e5;
  background-color: #fafafa;
  border-radius: 6px;
  padding: 14px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: #c62828;
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: #b71c1c;
  }
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 5px;
  background-color: #f0f0f0;
  color: #1e1e1e;
  border: 1px dashed #999;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  width: fit-content;

  &:hover {
    background-color: #e5e5e5;
  }
`;

const SaveFloatingBar = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #eeeeee;

  button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background-color: #1e1e1e;
    color: #ffffff;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 600;
    border: none;
    cursor: pointer;

    &:hover {
      background-color: #333333;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
`;

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ data, onSave, isSaving }) => {
  const [profile, setProfile] = useState<ResumeData>(data);

  const handlePersonalChange = (field: keyof ResumeData["personalInfo"], value: string) => {
    setProfile((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  // Experiências
  const handleAddExperience = () => {
    const newExp: Experience = {
      id: crypto.randomUUID(),
      company: "Nova Empresa",
      role: "Novo Cargo",
      period: "Mês Ano - Atual",
      activities: ["Atividade descritiva"],
    };
    setProfile((prev) => ({ ...prev, experiences: [newExp, ...prev.experiences] }));
  };

  const handleUpdateExperience = (id: string, field: keyof Experience, value: any) => {
    setProfile((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)),
    }));
  };

  const handleDeleteExperience = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((exp) => exp.id !== id),
    }));
  };

  // Formação
  const handleAddEducation = () => {
    const newEdu: Education = {
      id: crypto.randomUUID(),
      degree: "Novo Curso / Graduação",
      institution: "Instituição de Ensino",
      status: "Concluído em 2026",
    };
    setProfile((prev) => ({ ...prev, education: [...prev.education, newEdu] }));
  };

  const handleDeleteEducation = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  };

  // Certificações
  const handleAddCertification = () => {
    const newCert: Certification = {
      id: crypto.randomUUID(),
      name: "Nova Certificação",
      statusOrYear: "Concluído (2026)",
      category: "principal",
    };
    setProfile((prev) => ({ ...prev, certifications: [...prev.certifications, newCert] }));
  };

  const handleDeleteCertification = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((cert) => cert.id !== id),
    }));
  };

  return (
    <EditorContainer>
      {/* 1. Dados Pessoais */}
      <div>
        <SectionHeader>
          <User size={18} />
          <h2>Dados Pessoais e Cabeçalho</h2>
        </SectionHeader>
        <FieldGrid $cols={2}>
          <FormGroup>
            <label>Nome Completo (Espaçado no Cabeçalho)</label>
            <input
              value={profile.personalInfo.fullName}
              onChange={(e) => handlePersonalChange("fullName", e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <label>Subtítulo / Especialidades Separadas por Pipe</label>
            <input
              value={profile.personalInfo.targetRoleOrTags}
              onChange={(e) => handlePersonalChange("targetRoleOrTags", e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <label>Cidade / UF</label>
            <input
              value={profile.personalInfo.city}
              onChange={(e) => handlePersonalChange("city", e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <label>Telefone</label>
            <input
              value={profile.personalInfo.phone}
              onChange={(e) => handlePersonalChange("phone", e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <label>E-mail</label>
            <input
              value={profile.personalInfo.email}
              onChange={(e) => handlePersonalChange("email", e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <label>Idade (Opcional)</label>
            <input
              value={profile.personalInfo.age || ""}
              onChange={(e) => handlePersonalChange("age", e.target.value)}
            />
          </FormGroup>
        </FieldGrid>
      </div>

      {/* 2. Resumo Profissional */}
      <div>
        <SectionHeader>
          <h2>Resumo Profissional</h2>
        </SectionHeader>
        <FormGroup>
          <textarea
            value={profile.summary}
            onChange={(e) => setProfile((prev) => ({ ...prev, summary: e.target.value }))}
            rows={4}
          />
        </FormGroup>
      </div>

      {/* 3. Experiências Profissionais */}
      <div>
        <SectionHeader>
          <Briefcase size={18} />
          <h2>Experiências Profissionais ({profile.experiences.length})</h2>
        </SectionHeader>
        {profile.experiences.map((exp) => (
          <CardItem key={exp.id}>
            <DeleteButton onClick={() => handleDeleteExperience(exp.id)} title="Remover experiência">
              <Trash2 size={16} />
            </DeleteButton>
            <FieldGrid $cols={3}>
              <FormGroup>
                <label>Cargo</label>
                <input
                  value={exp.role}
                  onChange={(e) => handleUpdateExperience(exp.id, "role", e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <label>Empresa</label>
                <input
                  value={exp.company}
                  onChange={(e) => handleUpdateExperience(exp.id, "company", e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <label>Período</label>
                <input
                  value={exp.period}
                  onChange={(e) => handleUpdateExperience(exp.id, "period", e.target.value)}
                />
              </FormGroup>
            </FieldGrid>
            <FormGroup>
              <label>Atividades (uma por linha)</label>
              <textarea
                value={exp.activities.join("\n")}
                onChange={(e) =>
                  handleUpdateExperience(
                    exp.id,
                    "activities",
                    e.target.value.split("\n").filter((l) => l.trim().length > 0)
                  )
                }
                rows={3}
              />
            </FormGroup>
          </CardItem>
        ))}
        <AddButton onClick={handleAddExperience}>
          <Plus size={14} /> Adicionar Experiência
        </AddButton>
      </div>

      {/* 4. Formação Acadêmica */}
      <div>
        <SectionHeader>
          <GraduationCap size={18} />
          <h2>Formação Acadêmica ({profile.education.length})</h2>
        </SectionHeader>
        {profile.education.map((edu) => (
          <CardItem key={edu.id}>
            <DeleteButton onClick={() => handleDeleteEducation(edu.id)} title="Remover formação">
              <Trash2 size={16} />
            </DeleteButton>
            <FieldGrid $cols={3}>
              <FormGroup>
                <label>Curso / Grau</label>
                <input
                  value={edu.degree}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      education: prev.education.map((it) => (it.id === edu.id ? { ...it, degree: e.target.value } : it)),
                    }))
                  }
                />
              </FormGroup>
              <FormGroup>
                <label>Instituição</label>
                <input
                  value={edu.institution}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      education: prev.education.map((it) => (it.id === edu.id ? { ...it, institution: e.target.value } : it)),
                    }))
                  }
                />
              </FormGroup>
              <FormGroup>
                <label>Status / Conclusão</label>
                <input
                  value={edu.status}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      education: prev.education.map((it) => (it.id === edu.id ? { ...it, status: e.target.value } : it)),
                    }))
                  }
                />
              </FormGroup>
            </FieldGrid>
          </CardItem>
        ))}
        <AddButton onClick={handleAddEducation}>
          <Plus size={14} /> Adicionar Formação
        </AddButton>
      </div>

      {/* 5. Certificações */}
      <div>
        <SectionHeader>
          <Award size={18} />
          <h2>Certificações ({profile.certifications.length})</h2>
        </SectionHeader>
        {profile.certifications.map((cert) => (
          <CardItem key={cert.id}>
            <DeleteButton onClick={() => handleDeleteCertification(cert.id)} title="Remover certificação">
              <Trash2 size={16} />
            </DeleteButton>
            <FieldGrid $cols={3}>
              <FormGroup>
                <label>Nome da Certificação</label>
                <input
                  value={cert.name}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      certifications: prev.certifications.map((it) => (it.id === cert.id ? { ...it, name: e.target.value } : it)),
                    }))
                  }
                />
              </FormGroup>
              <FormGroup>
                <label>Ano / Carga Horária</label>
                <input
                  value={cert.statusOrYear}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      certifications: prev.certifications.map((it) => (it.id === cert.id ? { ...it, statusOrYear: e.target.value } : it)),
                    }))
                  }
                />
              </FormGroup>
              <FormGroup>
                <label>Categoria</label>
                <select
                  value={cert.category}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      certifications: prev.certifications.map((it) =>
                        it.id === cert.id ? { ...it, category: e.target.value as any } : it
                      ),
                    }))
                  }
                  style={{
                    padding: "8px 10px",
                    border: "1px solid #d0d0d0",
                    borderRadius: "5px",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                >
                  <option value="principal">Principal</option>
                  <option value="complementar">Complementar</option>
                </select>
              </FormGroup>
            </FieldGrid>
          </CardItem>
        ))}
        <AddButton onClick={handleAddCertification}>
          <Plus size={14} /> Adicionar Certificação
        </AddButton>
      </div>

      <SaveFloatingBar>
        <button onClick={() => onSave(profile)} disabled={isSaving}>
          <Save size={16} />
          {isSaving ? "Salvando no Supabase..." : "Salvar Perfil Mestre"}
        </button>
      </SaveFloatingBar>
    </EditorContainer>
  );
};
