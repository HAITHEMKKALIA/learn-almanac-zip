import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Award, Search } from "lucide-react";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import { useI18n } from "@/lib/i18n";

interface CertRow {
  id: string;
  certificate_number: string;
  student_id: string;
  final_score: number;
  mention: string | null;
  issued_at: string;
  status: string;
}

export default function Certificates() {
  const { isAdmin } = useAuth();
  const { tt } = useI18n();
  const { activeSchoolId } = useActiveSchool();
  const [rows, setRows] = useState<CertRow[]>([]);
  const [studentId, setStudentId] = useState("");
  const [subLevelId, setSubLevelId] = useState("");
  const [score, setScore] = useState("");
  const [mention, setMention] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifyNum, setVerifyNum] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const load = async () => {
    if (!activeSchoolId) return;
    const { data } = await (supabase as any)
      .from("certificates")
      .select("id, certificate_number, student_id, final_score, mention, issued_at, status")
      .eq("school_id", activeSchoolId)
      .order("issued_at", { ascending: false })
      .limit(100);
    setRows((data as CertRow[]) || []);
  };
  useEffect(() => { load(); }, [activeSchoolId]);

  const issue = async () => {
    if (!activeSchoolId || !studentId || !subLevelId || !score) {
      toast.error(tt({ fr: "Champs requis manquants", de: "Pflichtfelder fehlen", ar: "حقول مطلوبة ناقصة" })); return;
    }
    setBusy(true);
    const { error } = await (supabase as any).rpc("issue_certificate", {
      _student_id: studentId,
      _school_id: activeSchoolId,
      _sub_level_id: subLevelId,
      _final_score: Number(score),
      _class_id: null,
      _mention: mention || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(tt({ fr: "Certificat émis", de: "Zertifikat ausgestellt", ar: "تم إصدار الشهادة" }));
    setStudentId(""); setSubLevelId(""); setScore(""); setMention("");
    load();
  };

  const verify = async () => {
    if (!verifyNum) return;
    const { data, error } = await (supabase as any).rpc("verify_certificate", { _number: verifyNum.trim() });
    if (error) { toast.error(error.message); return; }
    setVerifyResult(Array.isArray(data) ? data[0] : data);
  };

  return (
    <SchoolLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Award className="h-7 w-7 text-primary" /> {tt({ fr: "Certificats", de: "Zertifikate", ar: "الشهادات" })}
        </h1>

        {isAdmin && (
          <Card>
            <CardHeader><CardTitle>{tt({ fr: "Émettre un certificat", de: "Zertifikat ausstellen", ar: "إصدار شهادة" })}</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              <div><Label>{tt({ fr: "UUID élève", de: "Schüler-UUID", ar: "معرّف الطالب" })}</Label><Input value={studentId} onChange={e=>setStudentId(e.target.value)} /></div>
              <div><Label>{tt({ fr: "UUID sub_level (CEFR)", de: "UUID Unterstufe (GER)", ar: "معرّف المستوى (CEFR)" })}</Label><Input value={subLevelId} onChange={e=>setSubLevelId(e.target.value)} /></div>
              <div><Label>{tt({ fr: "Note finale (0-100)", de: "Endnote (0-100)", ar: "الدرجة النهائية (0-100)" })}</Label><Input type="number" value={score} onChange={e=>setScore(e.target.value)} /></div>
              <div><Label>{tt({ fr: "Mention", de: "Auszeichnung", ar: "تقدير" })}</Label><Input value={mention} onChange={e=>setMention(e.target.value)} placeholder={tt({ fr: "Bien / Très bien…", de: "Gut / Sehr gut…", ar: "جيد / جيد جدًا…" })} /></div>
              <div className="sm:col-span-2">
                <Button onClick={issue} disabled={busy}>{tt({ fr: "Émettre", de: "Ausstellen", ar: "إصدار" })}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>{tt({ fr: "Vérifier un certificat", de: "Zertifikat prüfen", ar: "التحقق من شهادة" })}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={verifyNum} onChange={e=>setVerifyNum(e.target.value)} placeholder="CERT-YYYYMMDD-XXXXXXXX" />
              <Button onClick={verify}><Search className="h-4 w-4 mr-1" />{tt({ fr: "Vérifier", de: "Prüfen", ar: "تحقّق" })}</Button>
            </div>
            {verifyResult && (
              <div className="text-sm bg-muted p-3 rounded">
                <div><b>{tt({ fr: "Élève", de: "Schüler", ar: "الطالب" })}:</b> {verifyResult.student_name}</div>
                <div><b>{tt({ fr: "École", de: "Schule", ar: "المدرسة" })}:</b> {verifyResult.school_name}</div>
                <div><b>{tt({ fr: "Niveau", de: "Niveau", ar: "المستوى" })}:</b> {verifyResult.sub_level}</div>
                <div><b>{tt({ fr: "Note", de: "Note", ar: "الدرجة" })}:</b> {verifyResult.final_score} {verifyResult.mention && `(${verifyResult.mention})`}</div>
                <div><b>{tt({ fr: "Émis", de: "Ausgestellt", ar: "تاريخ الإصدار" })}:</b> {new Date(verifyResult.issued_at).toLocaleString()}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{tt({ fr: "Certificats récents", de: "Letzte Zertifikate", ar: "الشهادات الأخيرة" })}</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tt({ fr: "Aucun certificat.", de: "Keine Zertifikate.", ar: "لا توجد شهادات." })}</p>
            ) : (
              <div className="space-y-2">
                {rows.map(r => (
                  <div key={r.id} className="flex justify-between items-center border rounded p-2 text-sm">
                    <div>
                      <div className="font-mono">{r.certificate_number}</div>
                      <div className="text-xs text-muted-foreground">{new Date(r.issued_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div>{r.final_score}/100 {r.mention && <span className="text-xs text-muted-foreground">({r.mention})</span>}</div>
                      <div className="text-xs">{r.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SchoolLayout>
  );
}
