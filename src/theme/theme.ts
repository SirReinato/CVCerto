import styled from "styled-components";

export const theme = {
  colors: {
    // Paleta principal baseada nas cores fornecidas
    marromEscuro: "#4E220F", // Cor mais escura (ótimo para textos e fundos escuros)
    marromMedio: "#9D6638",  // Cor de destaque (botões, links)
    verdeClaro: "#B0BA99",   // Cor secundária (fundos de seções, detalhes)
    creme: "#F7F1DE",        // Cor mais clara (fundo principal do site)

    // Organização focada 100% no contraste (fácil de ler)
    textos: {
      escuro: "#4E220F", // Usar sempre sobre fundos claros (creme, verde claro)
      claro: "#F7F1DE",  // Usar sempre sobre fundos escuros (marrom escuro, marrom médio)
      destaque: "#9D6638",
    },
    background: {
      principal: "#F7F1DE",
      secundario: "#B0BA99",
      escuro: "#4E220F",
    },
  },
  fontsFamily: {
    titulos: "'Aldrich', sans-serif",
    paragrafos: "'Almarai', sans-serif",
  },
  fontSize: {
    titulos: {
      gg: "3rem",
      mm: "2.5rem",
      pp: "2.2rem",
    },
    titulosSecundarios: {
      gg: "2rem",
      mm: "1.8rem",
      pp: "1.6rem",
    },
    paragrafos: {
      gg: "1.25rem",
      mm: "1rem",
      pp: "0.875rem",
    },
  },
  // Novos itens para um tema mais completo
  spacing: {
    pp: "0.5rem",
    mm: "1rem",
    gg: "2rem",
    xg: "4rem",
  },
  breakpoints: {
    celular: "480px",
    tablet: "768px",
    notebook: "1200px",
    desktop: "1400px",
  },
};

// Títulos e Parágrafos

export const TitulosPrincipaisStl = styled.h1<{ $fundoEscuro?: boolean }>`
  font-size: ${theme.fontSize.titulos.gg};
  font-family: ${theme.fontsFamily.titulos};
  font-weight: bold;
  
  /* Lógica de contraste: se a prop $fundoEscuro for verdadeira, a letra fica clara. Senão, fica escura. */
  color: ${(props) =>
    props.$fundoEscuro ? theme.colors.textos.claro : theme.colors.textos.escuro};

  @media (max-width: ${theme.breakpoints.notebook}) {
    font-size: ${theme.fontSize.titulos.mm};
  }
  @media (max-width: ${theme.breakpoints.celular}) {
    font-size: ${theme.fontSize.titulosSecundarios.pp};
    text-align: center;
  }
`;

export const TitulosSecundariosStl = styled.h2<{ $fundoEscuro?: boolean; $centro?: boolean }>`
  font-size: ${theme.fontSize.titulosSecundarios.gg};
  font-family: ${theme.fontsFamily.titulos};
  font-weight: bold;
  text-align: ${(props) => (props.$centro ? "center" : "start")};
  
  /* Mantendo alto contraste */
  color: ${(props) =>
    props.$fundoEscuro ? theme.colors.textos.claro : theme.colors.textos.escuro};

  @media (max-width: ${theme.breakpoints.notebook}) {
    font-size: ${theme.fontSize.titulosSecundarios.mm};
  }
  @media (max-width: ${theme.breakpoints.celular}) {
    font-size: 1.5rem;
    text-align: center;
  }
`;

export const ParagrafosStl = styled.p<{ $grande?: boolean; $fundoEscuro?: boolean }>`
  font-size: ${(props) =>
    props.$grande ? theme.fontSize.paragrafos.gg : theme.fontSize.paragrafos.mm};
  font-family: ${theme.fontsFamily.paragrafos};
  font-weight: 400;
  line-height: 1.6;
  
  /* Textos longos precisam do melhor contraste possível para leitura fácil */
  color: ${(props) =>
    props.$fundoEscuro ? theme.colors.textos.claro : theme.colors.textos.escuro};

  @media (max-width: ${theme.breakpoints.celular}) {
    font-size: ${theme.fontSize.paragrafos.pp};
    text-align: center;
  }
`;

// Containers

export const ConteinerGeral = styled.div<{ $escuro?: boolean; $secundario?: boolean }>`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${theme.spacing.gg};
  
  /* Alterna as cores de fundo. Se $escuro for usado, usa o marrom escuro. 
     Se $secundario for usado, usa verde claro. Senão, usa creme. */
  background-color: ${(props) => {
    if (props.$escuro) return theme.colors.background.escuro;
    if (props.$secundario) return theme.colors.background.secundario;
    return theme.colors.background.principal;
  }};

  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.mm};
  }
`;

// Novo elemento útil: Botão com cores baseadas no tema
export const BotaoStl = styled.button<{ $escuro?: boolean }>`
  font-family: ${theme.fontsFamily.titulos};
  font-size: ${theme.fontSize.paragrafos.mm};
  font-weight: bold;
  padding: ${theme.spacing.mm} ${theme.spacing.gg};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  
  /* Fundo marrom médio com texto creme (alto contraste) */
  background-color: ${theme.colors.marromMedio};
  color: ${theme.colors.textos.claro};
  
  transition: filter 0.2s;

  &:hover {
    filter: brightness(1.2);
  }

  /* Variante de botão escuro */
  ${(props) =>
    props.$escuro &&
    `
    background-color: ${theme.colors.marromEscuro};
    color: ${theme.colors.textos.claro};
  `}
`;