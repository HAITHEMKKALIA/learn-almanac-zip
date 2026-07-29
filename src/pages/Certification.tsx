import { useEffect, useMemo, useState } from "react";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Award, Download, FileDown, History, Search, Sparkles, Filter, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { buildCertificatePdf, computeMention } from "@/lib/certificatePdf";

type EligibleStudent = {
  validation_id: string;
  student_id: string;
  student_name: string;
  student_email: string | null;
  avg_score: number;
  last_session_date: string | null;
  teacher_name: string | null;
  val_mention: string;
  val_sub_level_id: string | null;
  val_sub_level_code: string | null;
  val_sub_level_name: string | null;
};

type SubLevel = { id: string; code: string; name: string };

type CertRow = {
  id: string;
  certificate_number: string;
  student_id: string;
  student_name?: string;
  sub_level_code?: string;
  final_score: number;
  mention: string | null;
  issued_at: string;
  status: string;
  pdf_url: string | null;
};

type Preset = "today" | "week" | "month" | "year" | "all" | "custom";

function rangeFor(preset: Preset, from?: string, to?: string): { start?: Date; end?: Date } {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) };
    case "week": {
      const d = new Date(now); d.setDate(d.getDate() - 7); return { start: d, end: new Date(now.getTime() + 86400000) };
    }
    case "month": {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); return { start: d, end: new Date(now.getTime() + 86400000) };
    }
    case "year": {
      const d = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); return { start: d, end: new Date(now.getTime() + 86400000) };
    }
    case "custom":
      return { start: from ? new Date(from) : undefined, end: to ? new Date(new Date(to).getTime() + 86400000) : undefined };
    default:
      return {};
  }
}

export default function Certification() {
  const { tt } = useI18n();
  const { user } = useAuth();
  const { activeSchoolId, activeSchool } = useActiveSchool();

  const [subLevels, setSubLevels] = useState<SubLevel[]>([]);
  const [subLevelId, setSubLevelId] = useState<string>("");
  const [minScore, setMinScore] = useState<number>(60);
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [directorName, setDirectorName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [city, setCity] = useState("");

  const [candidates, setCandidates] = useState<EligibleStudent[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const [history, setHistory] = useState<CertRow[]>([]);
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [q, setQ] = useState("");

  // Load sub levels
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("sub_levels")
        .select("id, code, name")
        .order("order_index");
      const rows = (data as SubLevel[]) || [];
      setSubLevels(rows);
      if (rows.length && !subLevelId) setSubLevelId(rows[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load candidates from teacher validations (status = 'pending')
  const loadCandidates = async () => {
    if (!activeSchoolId) return;
    setLoadingCandidates(true);
    try {
      const { data, error } = await (supabase as any)
        .from("student_success_validations")
        .select(`
          id, student_id, score, mention, validated_at, sub_level_id,
          profiles:student_id(display_name, email),
          teacher:teacher_id(display_name, email),
          sub_levels:sub_level_id(id, code, name)
        `)
        .eq("school_id", activeSchoolId)
        .eq("status", "pending")
        .order("validated_at", { ascending: false });
      if (error) throw error;

      const rows: EligibleStudent[] = (data || [])
        .filter((r: any) => Number(r.score) >= minScore)
        .map((r: any) => ({
          validation_id: r.id,
          student_id: r.student_id,
          student_name: r.profiles?.display_name || r.profiles?.email || r.student_id.slice(0, 8),
          student_email: r.profiles?.email ?? null,
          avg_score: Number(r.score),
          last_session_date: r.validated_at,
          teacher_name: r.teacher?.display_name || r.teacher?.email || null,
          val_mention: r.mention,
          val_sub_level_id: r.sub_levels?.id ?? r.sub_level_id ?? null,
          val_sub_level_code: r.sub_levels?.code ?? null,
          val_sub_level_name: r.sub_levels?.name ?? null,
        }));

      setCandidates(rows);
      setSelected({});
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => { loadCandidates(); /* eslint-disable-next-line */ }, [activeSchoolId, minScore]);

  // Load history
  const loadHistory = async () => {
    if (!activeSchoolId) return;
    const { start, end } = rangeFor(preset, customFrom, customTo);
    let query = (supabase as any)
      .from("certificates")
      .select("id, certificate_number, student_id, final_score, mention, issued_at, status, pdf_url, sub_levels:sub_level_id(code), profiles:student_id(display_name, email)")
      .eq("school_id", activeSchoolId)
      .order("issued_at", { ascending: false })
      .limit(500);
    if (start) query = query.gte("issued_at", start.toISOString());
    if (end) query = query.lt("issued_at", end.toISOString());
    const { data } = await query;
    const rows: CertRow[] = (data || []).map((r: any) => ({
      ...r,
      student_name: r.profiles?.display_name || r.profiles?.email || r.student_id.slice(0, 8),
      sub_level_code: r.sub_levels?.code,
    }));
    setHistory(rows);
  };

  useEffect(() => { loadHistory(); /* eslint-disable-next-line */ }, [activeSchoolId, preset, customFrom, customTo]);

  const filteredHistory = useMemo(() => {
    if (!q.trim()) return history;
    const s = q.toLowerCase();
    return history.filter(
      (r) =>
        r.certificate_number.toLowerCase().includes(s) ||
        (r.student_name || "").toLowerCase().includes(s) ||
        (r.sub_level_code || "").toLowerCase().includes(s),
    );
  }, [history, q]);

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const toggleAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    candidates.forEach((c) => (next[c.validation_id] = v));
    setSelected(next);
  };

  async function generateOne(student: EligibleStudent): Promise<void> {
    // Use validation's sub-level when set, otherwise fall back to page default
    const effectiveSubLevelId = student.val_sub_level_id || subLevelId;
    const subLvl = subLevels.find((s) => s.id === effectiveSubLevelId);
    if (!subLvl) throw new Error("sub-level required");
    const score = Math.round(student.avg_score);
    const mention = student.val_mention || computeMention(score);

    // 1) Issue via RPC (creates row + number)
    const { data: certId, error } = await (supabase as any).rpc("issue_certificate", {
      _student_id: student.student_id,
      _school_id: activeSchoolId,
      _sub_level_id: effectiveSubLevelId,
      _final_score: score,
      _class_id: null,
      _mention: mention,
    });
    if (error) throw error;

    // 2) Fetch back the certificate number
    const { data: certRow } = await (supabase as any)
      .from("certificates").select("certificate_number, issued_at").eq("id", certId).maybeSingle();
    const number = certRow?.certificate_number || `CERT-${Date.now()}`;
    const issuedAt = certRow?.issued_at ? new Date(certRow.issued_at) : new Date();

    // 3) Build PDF
    const pdfBlob = await buildCertificatePdf({
      studentName: student.student_name,
      schoolName: activeSchool?.name || "École",
      schoolLogoUrl: activeSchool?.logo_url || null,
      subLevelCode: subLvl.code,
      subLevelName: subLvl.name,
      finalScore: score,
      mention,
      certificateNumber: number,
      issuedAt,
      sessionDate,
      directorName,
      teacherName: teacherName || student.teacher_name || "",
      city,
    });

    // 4) Upload to storage
    const path = `${activeSchoolId}/${certId}.pdf`;
    const { error: upErr } = await supabase.storage.from("certificates").upload(path, pdfBlob, {
      upsert: true,
      contentType: "application/pdf",
    });
    if (upErr) throw upErr;

    // 5) Update the certificate row with pdf_url
    await (supabase as any).from("certificates").update({ pdf_url: path }).eq("id", certId);

    // 6) Mark validation as issued
    await (supabase as any)
      .from("student_success_validations")
      .update({ status: "issued", certificate_id: certId })
      .eq("id", student.validation_id);
  }

  async function generateSelected() {
    if (!activeSchoolId) {
      toast.error(tt({ fr: "École introuvable", de: "Schule fehlt", ar: "المدرسة مفقودة" }));
      return;
    }
    const targets = candidates.filter((c) => selected[c.validation_id]);
    if (targets.length === 0) {
      toast.error(tt({ fr: "Aucun élève sélectionné", de: "Kein Schüler ausgewählt", ar: "لم يتم اختيار أي طالب" }));
      return;
    }
    setBusy(true);
    let ok = 0, fail = 0;
    for (const s of targets) {
      try { await generateOne(s); ok++; } catch (e: any) { fail++; console.error(e); }
    }
    setBusy(false);
    toast.success(`${ok} ✓ / ${fail} ✗`);
    loadHistory();
  }

  async function downloadCert(row: CertRow) {
    if (!row.pdf_url) { toast.error("PDF absent"); return; }
    const { data, error } = await supabase.storage.from("certificates").createSignedUrl(row.pdf_url, 300);
    if (error || !data?.signedUrl) { toast.error(error?.message || "Erreur"); return; }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <SchoolLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center shadow-elev">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">
              {tt({ fr: "Certification", de: "Zertifizierung", ar: "الشهادات" })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tt({
                fr: "Générez des certificats officiels pour les élèves ayant réussi une session.",
                de: "Zertifikate für erfolgreiche Schüler ausstellen.",
                ar: "أصدر شهادات للطلاب الناجحين.",
              })}
            </p>
          </div>
        </div>

        {/* Config + candidates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {tt({ fr: "Émettre des certificats", de: "Zertifikate ausstellen", ar: "إصدار شهادات" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-900 text-xs p-2">
              {tt({
                fr: "Seuls les élèves validés « réussis » par leur professeur apparaissent ici.",
                de: "Nur vom Lehrer bestätigte Schüler erscheinen hier.",
                ar: "يظهر هنا فقط الطلاب الذين أكد الأستاذ نجاحهم.",
              })}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>{tt({ fr: "Niveau par défaut", de: "Standard-Niveau", ar: "المستوى الافتراضي" })}</Label>
                <Select value={subLevelId} onValueChange={setSubLevelId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {subLevels.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{tt({ fr: "Note minimale (%)", de: "Mindestnote (%)", ar: "الحد الأدنى للدرجة (%)" })}</Label>
                <Input type="number" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
              </div>
              <div>
                <Label>{tt({ fr: "Date de session", de: "Prüfungsdatum", ar: "تاريخ الجلسة" })}</Label>
                <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
              </div>
              <div>
                <Label>{tt({ fr: "Nom du directeur", de: "Direktor", ar: "المدير" })}</Label>
                <Input value={directorName} onChange={(e) => setDirectorName(e.target.value)} placeholder="Dr. …" />
              </div>
              <div>
                <Label>{tt({ fr: "Nom du professeur (fallback)", de: "Prüfer / Lehrer", ar: "الأستاذ" })}</Label>
                <Input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder="M./Mme …" />
              </div>
              <div>
                <Label>{tt({ fr: "Ville", de: "Ort", ar: "المدينة" })}</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tunis" />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <div className="text-sm text-muted-foreground">
                {tt({ fr: "Élèves réussis", de: "Erfolgreiche Schüler", ar: "الطلاب الناجحون" })}: <b>{candidates.length}</b>
                {selectedCount > 0 && <span> · {tt({ fr: "sélectionnés", de: "ausgewählt", ar: "محدد" })}: <b>{selectedCount}</b></span>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleAll(true)}>{tt({ fr: "Tout", de: "Alle", ar: "الكل" })}</Button>
                <Button size="sm" variant="outline" onClick={() => toggleAll(false)}>{tt({ fr: "Aucun", de: "Keine", ar: "لا شيء" })}</Button>
                <Button size="sm" variant="outline" onClick={loadCandidates} disabled={loadingCandidates}>
                  {loadingCandidates ? <Loader2 className="h-4 w-4 animate-spin" /> : tt({ fr: "Actualiser", de: "Aktualisieren", ar: "تحديث" })}
                </Button>
              </div>
            </div>

            <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
              {candidates.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  {tt({ fr: "Aucun élève éligible avec ce seuil.", de: "Keine berechtigten Schüler.", ar: "لا يوجد طلاب مؤهلون." })}
                </p>
              ) : candidates.map((c) => (
                <label key={c.student_id} className="flex items-center gap-3 p-2 hover:bg-muted/40 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={!!selected[c.student_id]}
                    onChange={(e) => setSelected((s) => ({ ...s, [c.student_id]: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.student_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.student_email}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold">{c.avg_score}/100</div>
                    <div className="text-[10px] text-muted-foreground">{computeMention(Math.round(c.avg_score))}</div>
                  </div>
                </label>
              ))}
            </div>

            <Button onClick={generateSelected} disabled={busy || selectedCount === 0} className="w-full gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {tt({ fr: `Générer ${selectedCount} certificat(s) PDF`, de: `${selectedCount} Zertifikat(e) erzeugen`, ar: `توليد ${selectedCount} شهادة` })}
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              {tt({ fr: "Historique des certificats", de: "Zertifikatsverlauf", ar: "سجل الشهادات" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[160px]">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />{tt({ fr: "Période", de: "Zeitraum", ar: "الفترة" })}</Label>
                <Select value={preset} onValueChange={(v) => setPreset(v as Preset)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">{tt({ fr: "Aujourd'hui", de: "Heute", ar: "اليوم" })}</SelectItem>
                    <SelectItem value="week">{tt({ fr: "7 derniers jours", de: "Letzte 7 Tage", ar: "7 أيام" })}</SelectItem>
                    <SelectItem value="month">{tt({ fr: "30 derniers jours", de: "Letzte 30 Tage", ar: "30 يوم" })}</SelectItem>
                    <SelectItem value="year">{tt({ fr: "12 derniers mois", de: "Letzte 12 Monate", ar: "12 شهر" })}</SelectItem>
                    <SelectItem value="all">{tt({ fr: "Tout", de: "Alle", ar: "الكل" })}</SelectItem>
                    <SelectItem value="custom">{tt({ fr: "Personnalisé", de: "Benutzerdefiniert", ar: "مخصص" })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {preset === "custom" && (
                <>
                  <div><Label className="text-xs">De</Label><Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} /></div>
                  <div><Label className="text-xs">À</Label><Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} /></div>
                </>
              )}
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs flex items-center gap-1"><Search className="h-3 w-3" />{tt({ fr: "Rechercher", de: "Suchen", ar: "بحث" })}</Label>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="N°, élève, niveau…" />
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3">{tt({ fr: "Aucun certificat sur cette période.", de: "Keine Zertifikate.", ar: "لا توجد شهادات." })}</p>
            ) : (
              <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                {filteredHistory.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{r.student_name} <span className="text-xs text-muted-foreground">· {r.sub_level_code || "—"}</span></div>
                      <div className="text-xs font-mono text-muted-foreground truncate">{r.certificate_number}</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="font-semibold">{r.final_score}/100</div>
                      <div className="text-[10px] text-muted-foreground">{r.mention}</div>
                    </div>
                    <div className="text-xs text-muted-foreground hidden md:block">{new Date(r.issued_at).toLocaleDateString()}</div>
                    <Button size="sm" variant="outline" onClick={() => downloadCert(r)} disabled={!r.pdf_url} className="gap-1">
                      <Download className="h-3.5 w-3.5" /> PDF
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {tt({
                fr: `Total sur la période : ${filteredHistory.length} certificat(s)`,
                de: `Gesamt: ${filteredHistory.length} Zertifikat(e)`,
                ar: `المجموع: ${filteredHistory.length} شهادة`,
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </SchoolLayout>
  );
}
