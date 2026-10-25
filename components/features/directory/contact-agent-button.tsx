"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { contactAgent } from "@/app/actions/contact";

interface ContactAgentButtonProps {
  agentId: string;
  agentName: string;
  signedIn: boolean;
  draft?: string;
  variant?: "default" | "outline";
  className?: string;
}

export function ContactAgentButton({ agentId, agentName, signedIn, draft, variant = "default", className }: ContactAgentButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(draft ?? `Hi ${agentName.split(" ")[0]}, I found you on Nestly and would like some help.`);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await contactAgent({ agentId, body });
      if (!res.ok) return void toast.error(res.error);
      setOpen(false);
      toast.success(`Message sent to ${agentName}`, { action: { label: "Open inbox", onClick: () => router.push(`/dashboard/messages?c=${res.data.conversationId}`) } });
    });
  };

  return (
    <>
      <Button variant={variant} size="xl" className={className}
        onClick={() => (signedIn ? setOpen(true) : router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`))}>
        <MessageSquare className="size-4" aria-hidden /> Message {agentName.split(" ")[0]}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={submit} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-normal">Message {agentName}</DialogTitle>
              <DialogDescription>Tell them what you&apos;re looking for. Replies arrive in your Nestly inbox.</DialogDescription>
            </DialogHeader>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={2000} required aria-label="Message" />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" size="xl" disabled={pending}>{pending ? "Sending…" : "Send message"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
