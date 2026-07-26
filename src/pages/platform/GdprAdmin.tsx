import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Row = { user_id: string; display_name: string | null; email: string | null; requested_at: string };

export default function GdprAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_deletion_requests");
    if (error) toast.error(error.message);
    else setRows((data as Row[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const exportUser = async (uid: string, email: string | null) => {
    const { data, error } = await supabase.rpc("admin_gdpr_export", { _target: uid });
    if (error) return toast.error(error.message);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gdpr-export-${email || uid}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export téléchargé");
  };

  const deleteUser = async (uid: string) => {
    const { error } = await supabase.rpc("admin_delete_user", { _target: uid });
    if (error) return toast.error(error.message);
    toast.success("Utilisateur supprimé");
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white"><ShieldCheck className="h-5 w-5" /></div>
        <div>
          <h1 className="text-2xl font-display font-bold">RGPD — Demandes de suppression</h1>
          <p className="text-sm text-muted-foreground">Traitez les demandes sous 30 jours (Art. 17 RGPD).</p>
        </div>
      </div>

      <Card className="p-4">
        {loading ? <p className="text-sm text-muted-foreground">Chargement…</p> :
         rows.length === 0 ? <p className="text-sm text-muted-foreground">Aucune demande en attente.</p> :
         <div className="space-y-2">
           {rows.map(r => (
             <div key={r.user_id} className="flex items-center justify-between p-3 rounded-lg border">
               <div>
                 <div className="font-medium">{r.display_name || "—"}</div>
                 <div className="text-xs text-muted-foreground">{r.email} · demandé le {new Date(r.requested_at).toLocaleDateString()}</div>
               </div>
               <div className="flex gap-2">
                 <Button size="sm" variant="outline" onClick={() => exportUser(r.user_id, r.email)}><Download className="h-4 w-4 mr-1" /> Export</Button>
                 <AlertDialog>
                   <AlertDialogTrigger asChild>
                     <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-1" /> Supprimer</Button>
                   </AlertDialogTrigger>
                   <AlertDialogContent>
                     <AlertDialogHeader>
                       <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
                       <AlertDialogDescription>Toutes les données de {r.email} seront effacées. Irréversible.</AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel>Annuler</AlertDialogCancel>
                       <AlertDialogAction onClick={() => deleteUser(r.user_id)} className="bg-destructive hover:bg-destructive/90">Confirmer</AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
               </div>
             </div>
           ))}
         </div>}
      </Card>
    </div>
  );
}
