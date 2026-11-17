"use client";

import { useState } from "react";
import { BellPlus, FileSignature, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/app-providers";
import { addUserNotification, type UserNotificationType } from "@/lib/user-notifications";

export function NotificationSimulator({ profileId }: { profileId: string }) {
  const [simulationCount, setSimulationCount] = useState(0);
  const { toast } = useToast();

  function simulateNotification(type: UserNotificationType) {
    const isContractProposal = type === "contract-proposal";
    addUserNotification(profileId, isContractProposal
      ? {
          type,
          title: "Você recebeu uma proposta de contrato",
          detail: "Uma nova proposta de apresentação está aguardando sua análise.",
        }
      : {
          type,
          title: "Nova notificação de teste",
          detail: "O som e o indicador de notificação estão funcionando corretamente.",
        });
    setSimulationCount((count) => count + 1);
    toast(isContractProposal ? "Proposta de contrato simulada com sucesso." : "Notificação comum simulada com sucesso.");
  }

  return (
    <div className="mt-7 flex w-full flex-col items-center">
      <div className="grid w-full max-w-[560px] gap-3 sm:grid-cols-2">
        <Button onClick={() => simulateNotification("general")} className="w-full">
          <BellPlus className="size-4" />
          Notificação comum
        </Button>
        <Button onClick={() => simulateNotification("contract-proposal")} variant="outline" className="w-full">
          <FileSignature className="size-4" />
          Proposta de contrato
        </Button>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-white/45">
        <Volume2 className="size-3.5" aria-hidden="true" />
        Cada teste reproduz seu efeito sonoro correspondente.
      </p>
      <p className="sr-only" aria-live="polite">
        {simulationCount > 0 ? `Notificação simulada ${simulationCount} ${simulationCount === 1 ? "vez" : "vezes"}.` : ""}
      </p>
    </div>
  );
}
