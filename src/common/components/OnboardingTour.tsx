"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_STEPS: DriveStep[] = [
  {
    element: "[data-tour='sidebar']",
    popover: {
      title: "📍 Menu de Navegação",
      description:
        "Aqui fica o menu principal. Use para navegar entre as seções do Finplanix.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='nav-dashboard']",
    popover: {
      title: "📊 Dashboard",
      description:
        "Visão geral das suas finanças: saldo, receitas, despesas, gráficos e orçamento — tudo em um só lugar.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='nav-transactions']",
    popover: {
      title: "💰 Transações",
      description:
        "Registre receitas e despesas. Filtre por mês, categoria, cartão, status e muito mais.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='nav-categories']",
    popover: {
      title: "🏷️ Categorias",
      description:
        "Organize suas transações em categorias personalizadas com ícones e cores.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='nav-cards']",
    popover: {
      title: "💳 Cartões",
      description:
        "Cadastre seus cartões de crédito/débito e acompanhe as faturas com dia de fechamento.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='nav-budget']",
    popover: {
      title: "🐷 Orçamento",
      description:
        "Defina limites de gastos por categoria e acompanhe quanto já foi utilizado no mês.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='nav-projection']",
    popover: {
      title: "📈 Projeção",
      description:
        "Veja como devem ficar os próximos meses com parcelas, despesas e receitas fixas, mais uma estimativa dos gastos variáveis.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='nav-goals']",
    popover: {
      title: "🎯 Metas",
      description:
        "Crie metas financeiras e acompanhe seu progresso. Ideal para juntar dinheiro para objetivos.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='theme-toggle']",
    popover: {
      title: "🌙 Tema",
      description: "Alterne entre tema claro e escuro conforme sua preferência.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "[data-tour='user-menu']",
    popover: {
      title: "👤 Seu Perfil",
      description:
        "Acesse suas configurações, altere seu nome, email ou exclua sua conta.",
      side: "bottom",
      align: "end",
    },
  },
  {
    popover: {
      title: "🎉 Tudo Pronto!",
      description:
        "Você já conhece o Finplanix! Comece adicionando suas categorias, cartões e transações. Boas finanças! 💪",
    },
  },
];

export function OnboardingTour() {
  const [shouldStart, setShouldStart] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const completeTour = useCallback(async () => {
    try {
      await fetch("/api/auth/tour", { method: "POST" });
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    // Only check on dashboard page
    if (pathname !== "/dashboard") return;

    async function checkTourStatus() {
      try {
        const res = await fetch("/api/auth/tour", { cache: "no-store" });
        const data = await res.json();
        if (!data.hasCompletedTour) {
          setShouldStart(true);
        }
      } catch {
        // silent
      }
    }

    checkTourStatus();
  }, [pathname]);

  useEffect(() => {
    if (!shouldStart || pathname !== "/dashboard") return;

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: "black",
        stagePadding: 4,
        stageRadius: 8,
        popoverClass: "finplanix-tour-popover",
        progressText: "{{current}} de {{total}}",
        nextBtnText: "Próximo",
        prevBtnText: "Anterior",
        doneBtnText: "Concluir",
        steps: TOUR_STEPS,
        onDestroyStarted: () => {
          completeTour();
          setShouldStart(false);
          driverObj.destroy();
        },
        onDestroyed: () => {
          completeTour();
        },
      });

      driverObj.drive();
    }, 800);

    return () => clearTimeout(timeout);
  }, [shouldStart, pathname, completeTour, router]);

  return null;
}

export function startTourManually() {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayColor: "black",
    stagePadding: 4,
    stageRadius: 8,
    popoverClass: "finplanix-tour-popover",
    progressText: "{{current}} de {{total}}",
    nextBtnText: "Próximo",
    prevBtnText: "Anterior",
    doneBtnText: "Concluir",
    steps: TOUR_STEPS,
  });

  driverObj.drive();
}
