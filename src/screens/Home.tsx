import styled from "styled-components";
import { ConteinerGeral, theme, TitulosPrincipaisStl } from "../theme/theme";

export default function Home() {
    return (
        <ConteinerGeral>
            <ConteinerHomeStl>
                <ContainerHeaderStl>

                    <TitulosPrincipaisStl>
                        Home
                    </TitulosPrincipaisStl>
                </ContainerHeaderStl>
            </ConteinerHomeStl>
        </ConteinerGeral>
    );
}

const ConteinerHomeStl = styled.div
    `
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: ${theme.spacing.gg};
    background-color: ${theme.colors.background.principal};
    
    @media (max-width: ${theme.breakpoints.tablet}) {
        padding: ${theme.spacing.mm};
    }   
    `

const ContainerHeaderStl = styled.div
    `
    width: 100%;
    min-height: 10vh;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${theme.spacing.gg};
    background-color: ${theme.colors.background.principal};
    
    @media (max-width: ${theme.breakpoints.tablet}) {
        padding: ${theme.spacing.mm};
    }   
    `