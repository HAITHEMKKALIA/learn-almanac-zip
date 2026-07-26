import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  plan: string;
  planLabel: string;
};

export function QuoteRequestDialog({ open, onOpenChange, plan, planLabel }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    contact_name: "",
    email: "",
    phone: "",
    organization: "",
    student_count: "",
    message: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contact_name.trim() || !form.email.trim()) {
      toast({ title: "Champs requis", description: "Nom et email obligatoires.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("quote_requests").insert({
      contact_name: form.contact_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      organization: form.organization.trim() || null,
      plan,
      student_count: form.student_count ? parseInt(form.student_count, 10) : null,
      message: form.message.trim() || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Demande envoyée ✓", description: "Nous vous recontactons sous 24h avec un devis TND." });
    setForm({ contact_name: "", email: "", phone: "", organization: "", student_count: "", message: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Demander un devis — {planLabel}</DialogTitle>
          <DialogDescription>
            Paiement en TND par virement bancaire ou chèque. Activation sous 24h après réception.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="contact_name">Nom complet *</Label>
            <Input id="contact_name" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="text-foreground" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="text-foreground" required />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="text-foreground" />
            </div>
          </div>
          <div>
            <Label htmlFor="organization">École / Organisation</Label>
            <Input id="organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="text-foreground" />
          </div>
          <div>
            <Label htmlFor="student_count">Nombre d'élèves estimé</Label>
            <Input id="student_count" type="number" min="1" value={form.student_count} onChange={(e) => setForm({ ...form, student_count: e.target.value })} className="text-foreground" />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="text-foreground" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Envoi…" : "Envoyer la demande"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
