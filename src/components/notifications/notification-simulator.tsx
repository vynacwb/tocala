"use client";

import { useState } from "react";
import { BellPlus, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/app-providers";
import { addUserNotification } from "@/lib/user-notifications";

export function NotificationSimulator({ profileId }: { profileId: string }) {
  const [simulationCount, setSimulationCount] = useState(0);
  const { toast } = useToast();

  function simulateNotification() {
    addUserNotification(profileId, {
      title: "Nova notificação de teste",
      detail: "O som e o indicador de notificação estão funcionando corretamente.",
    });
    setSimulationCount((count) => count + 1);
    toast("Notificação simulada com sucesso.");
  }

  return (
    <div className="mt-7 flex flex-col items-center">
      <Button onClick={simulateNotification} className="min-w-[230px]">
        <BellPlus className="size-4" />
        Simular notificação
      </Button>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-white/45">
        <Volume2 className="size-3.5" aria-hidden="true" />
        O efeito sonoro será reproduzido no teste.
      </p>
      <p className="sr-only" aria-live="polite">
        {simulationCount > 0 ? `Notificação simulada ${simulationCount} ${simulationCount === 1 ? "vez" : "vezes"}.` : ""}
      </p>
    </div>
  );
}
