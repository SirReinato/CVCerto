import { useEffect, useState } from "react";
import { useToast } from "../context/ToastContext";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
}

function isStandalone(): boolean {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

export default function InstallAppButton() {
    const { showInfo } = useToast();
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);

    const [installed, setInstalled] = useState(isStandalone);

    useEffect(() => {
        const onBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredPrompt(event as BeforeInstallPromptEvent);
        };

        const onAppInstalled = () => {
            setInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.addEventListener("appinstalled", onAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
            window.removeEventListener("appinstalled", onAppInstalled);
        };
    }, []);

    const install = async () => {
        if (!deferredPrompt) {
            showInfo(
                "Abra o menu do navegador e escolha 'Instalar Aplicativo'. No iOS (Safari): toque em Compartilhar e 'Adicionar à Tela de Início'.",
                "Instalação do PWA"
            );
            return;
        }

        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;

        // O evento só pode ser usado uma vez
        setDeferredPrompt(null);
    };

    if (installed) {
        return null;
    }

    return <button onClick={install}>Instalar Aplicativo</button>;
}