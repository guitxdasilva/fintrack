"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { FeedbackDialog } from "@/common/components/FeedbackDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/common/components/ui/tooltip";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setOpen(true)}
            size="icon"
            className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all duration-200"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Enviar feedback</p>
        </TooltipContent>
      </Tooltip>

      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
