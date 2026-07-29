import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { getActiveSchoolId } from "@/components/school/SchoolSwitcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GraduationCap, Plus, Trash2, Users, ShieldCheck, Building2, Loader2, Clock, Check, X, PauseCircle, PlayCircle, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { AcademyMotionPage, AcademyStatGrid, AcademyStatItem, AcademyMetricCard } from "@/components/academy/AcademyUI";
import { AIQuotaWidget } from "@/components/school/AIQuotaWidget";
import { useI18n } from "@/lib/i18n";
import { StudentsDirectory, TeachersDirectory, ClassesDirectory } from "@/components/school/DirectoryPanels";

type Member = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  approved: boolean;
  school_role: string;
  app_roles: string[];
  classes: string[];
};
type ClassRow = { id: string; name: string; level: string; teacher_id: string; invite_code: string };
type Pending = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  space_role: string | null;
  requested_class_id: string | null;
  joined_at: string;
};

export default function SchoolAdminPage() {
  const { tt } = useI18n();
  const [schoolId, setSchoolId] = useState<string | null>(getActiveSchoolId());
  const [schoolName, setSchoolName] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [newClassName, setNewClassName] = useState("");
  const [newClassLevel, setNewClassLevel] = useState<"A1"|"A2"|"B1"|"B2">("A1");
  const [newClassTeacher, setNewClassTeacher] = useState<string>("");

  // Direct account creation (email + password)
  const [createRole, setCreateRole] = useState<"teacher" | "student">("student");
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createClassId, setCreateClassId] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const generatePassword = () => {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let p = "";
    for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
    setCreatePassword(p);
  };

  const createAccount = async () => {
    if (!schoolId) return;
    if (!createEmail.trim() || !createPassword.trim()) {
      toast.error(tt({ fr: "Email et mot de passe requis", de: "E-Mail und Passwort erforderlich", ar: "البريد وكلمة المرور مطلوبان" }));
      return;
    }
    if (createPassword.length < 8) {
      toast.error(tt({ fr: "Mot de passe ≥ 8 caractères", de: "Passwort ≥ 8 Zeichen", ar: "كلمة المرور ≥ 8 أحرف" }));
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("school-create-user", {
      body: {
        school_id: schoolId,
        email: createEmail.trim(),
        password: createPassword,
        display_name: createName.trim() || undefined,
        role: createRole,
        class_id: createRole === "student" && createClassId ? createClassId : undefined,
      },
    });
    setCreating(false);
    if (error || data?.error) {
      toast.error(error?.message || data?.error || "Erreur");
      return;
    }
    toast.success(tt({
      fr: "Compte créé. La demande a été envoyée au propriétaire de la plateforme.",
      de: "Konto erstellt. Der Antrag wurde an den Plattform-Inhaber gesendet.",
      ar: "تم إنشاء الحساب وإرسال الطلب إلى مالك المنصة.",
    }));
    // keep creds visible so admin can copy
    setCreateName("");
    load();
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const { detail } = event as CustomEvent<string>;
      setSchoolId(detail || getActiveSchoolId());
    };
    window.addEventListener("active-school-changed", handler);
    return () => window.removeEventListener("active-school-changed", handler);
  }, []);

  const load = useCallback(async () => {
    if (!schoolId) { setLoading(false); return; }
    setLoading(true);
    const [{ data: sch }, { data: mem }, { data: cls }, { data: pendRows }] = await Promise.all([
      supabase.from("schools").select("name").eq("id", schoolId).maybeSingle(),
      supabase.rpc("school_members_full", { _school_id: schoolId }),
      supabase.from("classes").select("id,name,level,teacher_id,invite_code").eq("school_id", schoolId).order("name"),
      supabase
        .from("school_members")
        .select("user_id, space_role, requested_class_id, joined_at, status")
        .eq("school_id", schoolId)
        .eq("status", "pending")
        .order("joined_at", { ascending: false }),
    ]);
    setSchoolName(sch?.name || "École");
    const memList = (mem as Member[]) || [];
    setMembers(memList);
    setClasses((cls as ClassRow[]) || []);
    const profMap = new Map(memList.map(m => [m.user_id, m]));
    setPending(
      ((pendRows as any[]) || []).map(r => ({
        user_id: r.user_id,
        display_name: profMap.get(r.user_id)?.display_name ?? null,
        email: profMap.get(r.user_id)?.email ?? null,
        space_role: r.space_role,
        requested_class_id: r.requested_class_id,
        joined_at: r.joined_at,
      }))
    );
    setLoading(false);
  }, [schoolId]);
  useEffect(() => { void load(); }, [load]);

  // Un membre est compté comme professeur s'il a explicitement le rôle teacher (école ou app),
  // ou s'il est owner ET n'est pas un élève actif.
  const isTeacher = (m: Member) =>
    m.app_roles.includes("teacher") ||
    m.school_role === "teacher" ||
    (m.school_role === "owner" && !m.app_roles.includes("student"));
  const teachers = members.filter(isTeacher);
  // Un élève = school_role student (pas owner/teacher) ET pas dans la liste prof
  const students = members.filter(m => m.school_role === "student" && !isTeacher(m));

  const assignToClass = async (uid: string, classId: string) => {
    if (!schoolId || !classId) return;
    const { error } = await supabase.rpc("school_assign_student_to_class", {
      _school_id: schoolId,
      _target: uid,
      _class_id: classId,
    });
    if (error) toast.error(error.message); else {
      toast.success(tt({ fr: "Élève ajouté à la classe", de: "Schüler zur Klasse hinzugefügt", ar: "تمت إضافة الطالب إلى الصف" }));
      load();
    }
  };

  const removeFromClass = async (uid: string, classId: string) => {
    const { error } = await supabase.rpc("admin_remove_from_class", { _target: uid, _class_id: classId });
    if (error) toast.error(error.message); else { toast.success(tt({ fr: "Retiré de la classe", de: "Aus der Klasse entfernt", ar: "تمت إزالته من الصف" })); load(); }
  };

  const reviewMembership = async (
    userId: string,
    decision: "approve" | "suspend" | "reactivate" | "reject",
    opts: { space_role?: string; class_id?: string; reason?: string } = {},
  ) => {
    if (!schoolId) return;
    const { error } = await supabase.rpc("school_review_membership", {
      _school_id: schoolId,
      _user_id: userId,
      _decision: decision,
      _space_role: opts.space_role ?? null,
      _class_id: opts.class_id ?? null,
      _reason: opts.reason ?? null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(tt({
      approve: { fr: "Compte approuvé", de: "Konto genehmigt", ar: "تمت الموافقة" },
      suspend: { fr: "Compte suspendu", de: "Konto gesperrt", ar: "تم التعليق" },
      reactivate: { fr: "Compte réactivé", de: "Konto reaktiviert", ar: "تمت إعادة التفعيل" },
      reject: { fr: "Demande rejetée", de: "Antrag abgelehnt", ar: "تم الرفض" },
    }[decision]));
    load();
  };

  const removeMember = async (userId: string, name?: string | null) => {
    if (!schoolId) return;
    if (!confirm(tt({ fr: `Retirer ${name || "ce membre"} de l'école ?`, de: `${name || "Mitglied"} aus der Schule entfernen?`, ar: `إزالة ${name || "العضو"} من المدرسة؟` }))) return;
    const { error } = await supabase.rpc("school_remove_member", { _school_id: schoolId, _user_id: userId });
    if (error) toast.error(error.message);
    else { toast.success(tt({ fr: "Membre retiré", de: "Mitglied entfernt", ar: "تمت الإزالة" })); load(); }
  };

  const createClass = async () => {
    if (!schoolId || !newClassName.trim() || !newClassTeacher) {
      toast.error(tt({ fr: "Nom, niveau et professeur requis", de: "Name, Stufe und Lehrkraft erforderlich", ar: "الاسم والمستوى والمعلم مطلوبون" })); return;
    }
    const { error } = await supabase.rpc("admin_create_class", {
      _school_id: schoolId, _name: newClassName.trim(), _level: newClassLevel, _teacher_id: newClassTeacher,
    });
    if (error) toast.error(error.message); else { toast.success(tt({ fr: "Classe créée", de: "Klasse erstellt", ar: "تم إنشاء الصف" })); setNewClassName(""); load(); }
  };

  const deleteClass = async (id: string) => {
    if (!confirm(tt({ fr: "Supprimer cette classe ?", de: "Diese Klasse löschen?", ar: "حذف هذا الصف؟" }))) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success(tt({ fr: "Classe supprimée", de: "Klasse gelöscht", ar: "تم حذف الصف" })); load(); }
  };

  const title = tt({ fr: "Administration école", de: "Schulverwaltung", ar: "إدارة المدرسة" });
  const noSchool = tt({ fr: "Sélectionnez une école dans le sélecteur en haut.", de: "Wählen Sie oben eine Schule aus.", ar: "اختر مدرسة من الأعلى." });

  if (!schoolId) {
    return (
      <SchoolLayout title={title}>
        <Card><CardContent className="p-8 text-center text-muted-foreground">{noSchool}</CardContent></Card>
      </SchoolLayout>
    );
  }

  if (loading) {
    return (
      <SchoolLayout title={title}>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </SchoolLayout>
    );
  }

  const filteredMembers = members.filter(m =>
    !search || m.display_name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SchoolLayout
      title={`${tt({ fr: "Administration", de: "Verwaltung", ar: "إدارة" })} — ${schoolName}`}
      subtitle={tt({
        fr: "Gérez les membres et les classes de cette école. Les nouvelles adhésions sont validées par le propriétaire de la plateforme.",
        de: "Verwalten Sie Mitglieder und Klassen. Neue Mitgliedschaften werden vom Plattform-Inhaber freigegeben.",
        ar: "إدارة أعضاء وصفوف هذه المدرسة. يوافق مالك المنصة على العضويات الجديدة.",
      })}
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline"><Building2 className="h-3 w-3 mr-1" />{members.length} {tt({ fr: "membres", de: "Mitglieder", ar: "أعضاء" })}</Badge>
          <Badge variant="outline"><Users className="h-3 w-3 mr-1" />{classes.length} {tt({ fr: "classes", de: "Klassen", ar: "صفوف" })}</Badge>
          {pending.length > 0 && <Badge className="bg-amber-500 text-white">{pending.length} {tt({ fr: "en attente", de: "ausstehend", ar: "قيد الانتظار" })}</Badge>}
        </div>
      }
    >
      <AcademyMotionPage>
      <AcademyStatGrid className="mb-6">
        <AcademyStatItem><AcademyMetricCard icon={<Building2 className="h-4 w-4"/>} label={tt({ fr: "Membres", de: "Mitglieder", ar: "الأعضاء" })} value={members.length} hint={tt({ fr: "dans l'école", de: "in der Schule", ar: "في المدرسة" })} accent="primary" /></AcademyStatItem>
        <AcademyStatItem><AcademyMetricCard icon={<ShieldCheck className="h-4 w-4"/>} label={tt({ fr: "Professeurs", de: "Lehrkräfte", ar: "المعلمون" })} value={teachers.length} accent="accent" /></AcademyStatItem>
        <AcademyStatItem><AcademyMetricCard icon={<GraduationCap className="h-4 w-4"/>} label={tt({ fr: "Élèves", de: "Schüler", ar: "الطلاب" })} value={students.length} accent="success" /></AcademyStatItem>
        <AcademyStatItem><AcademyMetricCard icon={<Clock className="h-4 w-4"/>} label={tt({ fr: "En attente", de: "Ausstehend", ar: "قيد الانتظار" })} value={pending.length} hint={tt({ fr: "validation plateforme", de: "Plattformfreigabe", ar: "موافقة المنصة" })} accent="warning" /></AcademyStatItem>
      </AcademyStatGrid>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <AIQuotaWidget scope="school" schoolId={schoolId} title={tt({ fr: "Quota IA école aujourd'hui", de: "KI-Kontingent Schule heute", ar: "حصة الذكاء الاصطناعي للمدرسة اليوم" })} />
        <AIQuotaWidget scope="user" title={tt({ fr: "Mon quota IA personnel", de: "Mein persönliches KI-Kontingent", ar: "حصتي الشخصية للذكاء الاصطناعي" })} />
      </div>
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="create">{tt({ fr: "Créer un compte", de: "Konto erstellen", ar: "إنشاء حساب" })}</TabsTrigger>
          <TabsTrigger value="pending">{tt({ fr: "Approbations", de: "Genehmigungen", ar: "الموافقات" })} {pending.length > 0 && `(${pending.length})`}</TabsTrigger>
          <TabsTrigger value="teachers">{tt({ fr: "Professeurs", de: "Lehrkräfte", ar: "المعلمون" })} ({teachers.length})</TabsTrigger>
          <TabsTrigger value="students">{tt({ fr: "Élèves", de: "Schüler", ar: "الطلاب" })} ({students.length})</TabsTrigger>
          <TabsTrigger value="students_dir">{tt({ fr: "Annuaire élèves", de: "Schülerverzeichnis", ar: "دليل الطلاب" })}</TabsTrigger>
          <TabsTrigger value="teachers_dir">{tt({ fr: "Annuaire profs", de: "Lehrerverzeichnis", ar: "دليل المعلمين" })}</TabsTrigger>
          <TabsTrigger value="classes">{tt({ fr: "Classes", de: "Klassen", ar: "الصفوف" })} ({classes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="students_dir"><StudentsDirectory schoolId={schoolId} /></TabsContent>
        <TabsContent value="teachers_dir"><TeachersDirectory schoolId={schoolId} /></TabsContent>


        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                {tt({ fr: "Demander un compte professeur ou élève", de: "Lehrer- oder Schülerkonto beantragen", ar: "طلب حساب معلم أو طالب" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {tt({
                  fr: "Définissez l'email et le mot de passe. La demande sera ajoutée à la file centrale ; l'utilisateur ne pourra accéder à l'école qu'après validation du propriétaire de la plateforme.",
                  de: "Legen Sie E-Mail und Passwort fest. Der Antrag wird zentral geprüft; der Schulzugang wird erst danach aktiviert.",
                  ar: "حدد البريد وكلمة المرور. يضاف الطلب إلى قائمة المراجعة المركزية ولا يمكن دخول المدرسة قبل موافقة مالك المنصة."
                })}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">{tt({ fr: "Rôle", de: "Rolle", ar: "الدور" })}</label>
                  <Select value={createRole} onValueChange={(v) => setCreateRole(v as typeof createRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">{tt({ fr: "Élève", de: "Schüler", ar: "طالب" })}</SelectItem>
                      <SelectItem value="teacher">{tt({ fr: "Professeur", de: "Lehrkraft", ar: "معلم" })}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{tt({ fr: "Nom complet", de: "Vollständiger Name", ar: "الاسم الكامل" })}</label>
                  <Input value={createName} onChange={e => setCreateName(e.target.value)} placeholder={tt({ fr: "ex. Anna Müller", de: "z. B. Anna Müller", ar: "مثال: أنا مولر" })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <Input type="email" value={createEmail} onChange={e => setCreateEmail(e.target.value)} placeholder="prenom.nom@ecole.com" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{tt({ fr: "Mot de passe (≥ 8)", de: "Passwort (≥ 8)", ar: "كلمة المرور (≥ 8)" })}</label>
                  <div className="flex gap-2">
                    <Input value={createPassword} onChange={e => setCreatePassword(e.target.value)} placeholder="••••••••" />
                    <Button type="button" variant="outline" onClick={generatePassword}>{tt({ fr: "Générer", de: "Generieren", ar: "توليد" })}</Button>
                  </div>
                </div>
                {createRole === "student" && (
                  <div className="sm:col-span-2">
                    <label className="text-xs text-muted-foreground">{tt({ fr: "Ajouter à une classe (optionnel)", de: "Zu einer Klasse hinzufügen (optional)", ar: "أضف إلى صف (اختياري)" })}</label>
                    <Select value={createClassId} onValueChange={setCreateClassId}>
                      <SelectTrigger><SelectValue placeholder={tt({ fr: "Choisir une classe…", de: "Klasse wählen…", ar: "اختر صفًا…" })} /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.level})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={createAccount} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                  {tt({ fr: "Créer et envoyer la demande", de: "Erstellen und Antrag senden", ar: "إنشاء وإرسال الطلب" })}
                </Button>
              </div>
              {createEmail && createPassword && (
                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <div className="font-medium mb-1">{tt({ fr: "Identifiants à communiquer", de: "Zugangsdaten zum Mitteilen", ar: "بيانات الدخول للإرسال" })}</div>
                  <div><span className="text-muted-foreground">Email:</span> <code className="font-mono">{createEmail}</code></div>
                  <div><span className="text-muted-foreground">{tt({ fr: "Mot de passe", de: "Passwort", ar: "كلمة المرور" })}:</span> <code className="font-mono">{createPassword}</code></div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{tt({ fr: "Demandes d'inscription à approuver", de: "Anmeldeanträge zum Genehmigen", ar: "طلبات التسجيل للموافقة" })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.length === 0 && <p className="text-sm text-muted-foreground">{tt({ fr: "Aucune inscription en attente.", de: "Keine ausstehenden Registrierungen.", ar: "لا توجد تسجيلات معلقة." })}</p>}
              {pending.map(p => (
                <PendingRow
                  key={p.user_id}
                  p={p}
                  classes={classes}
                  onApprove={(role, classId) => reviewMembership(p.user_id, "approve", { space_role: role, class_id: classId })}
                  onReject={() => reviewMembership(p.user_id, "reject")}
                  onRemove={() => removeMember(p.user_id, p.display_name)}
                  labels={{
                    approve: tt({ fr: "Approuver", de: "Genehmigen", ar: "موافقة" }),
                    reject: tt({ fr: "Rejeter", de: "Ablehnen", ar: "رفض" }),
                    remove: tt({ fr: "Supprimer", de: "Löschen", ar: "حذف" }),
                    role: tt({ fr: "Rôle", de: "Rolle", ar: "الدور" }),
                    student: tt({ fr: "Élève", de: "Schüler", ar: "طالب" }),
                    teacher: tt({ fr: "Professeur", de: "Lehrkraft", ar: "معلم" }),
                    classPh: tt({ fr: "Classe (optionnel)", de: "Klasse (optional)", ar: "الصف (اختياري)" }),
                    noClass: tt({ fr: "Aucune", de: "Keine", ar: "لا شيء" }),
                    noName: tt({ fr: "(sans nom)", de: "(ohne Namen)", ar: "(بدون اسم)" }),
                  }}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                {tt({ fr: "Professeurs de l'école", de: "Lehrkräfte der Schule", ar: "معلمو المدرسة" })}
                <Input placeholder={tt({ fr: "Recherche…", de: "Suche…", ar: "بحث…" })} value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs h-9" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredMembers.filter(m => teachers.includes(m)).map(t => (
                <div key={t.user_id} className="border rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium">{t.display_name || <i>{tt({ fr: "(sans nom)", de: "(ohne Namen)", ar: "(بدون اسم)" })}</i>} <Badge variant="outline" className="ml-2 text-xs">{t.school_role}</Badge></div>
                    <div className="text-sm text-muted-foreground">{t.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.approved ? (
                      <Button size="sm" variant="outline" onClick={() => reviewMembership(t.user_id, "suspend")}>
                        <PauseCircle className="h-4 w-4 mr-1" />{tt({ fr: "Suspendre", de: "Sperren", ar: "تعليق" })}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => reviewMembership(t.user_id, "reactivate", { space_role: "teacher" })}>
                        <PlayCircle className="h-4 w-4 mr-1" />{tt({ fr: "Réactiver", de: "Reaktivieren", ar: "إعادة تفعيل" })}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => removeMember(t.user_id, t.display_name)} className="text-destructive hover:text-destructive">
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {teachers.length === 0 && <p className="text-sm text-muted-foreground">{tt({ fr: "Aucun professeur. Approuvez un compte en attente avec le rôle Professeur.", de: "Keine Lehrkräfte. Genehmigen Sie ein ausstehendes Konto als Lehrkraft.", ar: "لا يوجد معلمون. اعتمد حسابًا بانتظار الموافقة كمعلم." })}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                {tt({ fr: "Élèves de l'école", de: "Schüler der Schule", ar: "طلاب المدرسة" })}
                <Input placeholder={tt({ fr: "Recherche…", de: "Suche…", ar: "بحث…" })} value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs h-9" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredMembers.filter(m => students.includes(m)).map(s => (
                <div key={s.user_id} className="border rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.display_name || <i>{tt({ fr: "(sans nom)", de: "(ohne Namen)", ar: "(بدون اسم)" })}</i>}</div>
                    <div className="text-sm text-muted-foreground truncate">{s.email}</div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {s.classes.length === 0
                        ? <Badge variant="outline" className="text-xs">{tt({ fr: "Non classé", de: "Keine Klasse", ar: "بدون صف" })}</Badge>
                        : s.classes.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={(v) => assignToClass(s.user_id, v)}>
                      <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder={tt({ fr: "Ajouter à classe…", de: "Zu Klasse hinzufügen…", ar: "أضف إلى صف…" })} /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.level})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {s.classes[0] && (
                      <Select onValueChange={(cid) => removeFromClass(s.user_id, cid)}>
                        <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder={tt({ fr: "Retirer de…", de: "Entfernen aus…", ar: "إزالة من…" })} /></SelectTrigger>
                        <SelectContent>
                          {classes.filter(c => s.classes.includes(c.name)).map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {s.approved ? (
                      <Button size="sm" variant="outline" onClick={() => reviewMembership(s.user_id, "suspend")}>
                        <PauseCircle className="h-4 w-4 mr-1" />{tt({ fr: "Suspendre", de: "Sperren", ar: "تعليق" })}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => reviewMembership(s.user_id, "reactivate", { space_role: "student" })}>
                        <PlayCircle className="h-4 w-4 mr-1" />{tt({ fr: "Réactiver", de: "Reaktivieren", ar: "إعادة تفعيل" })}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => removeMember(s.user_id, s.display_name)} className="text-destructive hover:text-destructive">
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {students.length === 0 && <p className="text-sm text-muted-foreground">{tt({ fr: "Aucun élève.", de: "Keine Schüler.", ar: "لا يوجد طلاب." })}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader><CardTitle className="text-lg">{tt({ fr: "Créer une classe", de: "Klasse erstellen", ar: "إنشاء صف" })}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[180px]">
                  <label className="text-xs text-muted-foreground">{tt({ fr: "Nom", de: "Name", ar: "الاسم" })}</label>
                  <Input placeholder={tt({ fr: "ex. Alfa, Beta, Groupe 1…", de: "z. B. Alfa, Beta, Gruppe 1…", ar: "مثال: Alfa، Beta، مجموعة 1…" })} value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{tt({ fr: "Niveau", de: "Stufe", ar: "المستوى" })}</label>
                  <Select value={newClassLevel} onValueChange={(v) => setNewClassLevel(v as typeof newClassLevel)}>
                    <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A2">A2</SelectItem>
                      <SelectItem value="B1">B1</SelectItem>
                      <SelectItem value="B2">B2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[200px]">
                  <label className="text-xs text-muted-foreground">{tt({ fr: "Professeur", de: "Lehrkraft", ar: "المعلم" })}</label>
                  <Select value={newClassTeacher} onValueChange={setNewClassTeacher}>
                    <SelectTrigger><SelectValue placeholder={tt({ fr: "Choisir un professeur", de: "Lehrkraft wählen", ar: "اختر معلمًا" })} /></SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => <SelectItem key={t.user_id} value={t.user_id}>{t.display_name || t.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createClass}><Plus className="h-4 w-4 mr-1" />{tt({ fr: "Créer", de: "Erstellen", ar: "إنشاء" })}</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-lg">{tt({ fr: "Classes de l'école", de: "Klassen der Schule", ar: "صفوف المدرسة" })}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {classes.map(c => {
                const t = teachers.find(x => x.user_id === c.teacher_id);
                const count = students.filter(s => s.classes.includes(c.name)).length;
                return (
                  <div key={c.id} className="border rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        {c.name} <Badge variant="outline" className="text-xs">{c.level}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tt({ fr: "Professeur", de: "Lehrkraft", ar: "المعلم" })}: {t?.display_name || t?.email || <i>{tt({ fr: "non attribué", de: "nicht zugewiesen", ar: "غير معيّن" })}</i>} · {tt({ fr: "Code", de: "Code", ar: "الرمز" })}: <code className="font-mono">{c.invite_code}</code> · {count} {tt({ fr: "élève(s)", de: "Schüler", ar: "طالب/طلاب" })}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteClass(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
              {classes.length === 0 && <p className="text-sm text-muted-foreground">{tt({ fr: "Aucune classe. Créez-en une ci-dessus.", de: "Keine Klassen. Erstellen Sie oben eine.", ar: "لا توجد صفوف. أنشئ واحدًا أعلاه." })}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </AcademyMotionPage>
    </SchoolLayout>
  );
}

function PendingRow({
  p, classes, onApprove, onReject, onRemove, labels,
}: {
  p: Pending;
  classes: ClassRow[];
  onApprove: (role: string, classId?: string) => void;
  onReject: () => void;
  onRemove: () => void;
  labels: Record<string, string>;
}) {
  const [role, setRole] = useState<string>(p.space_role || "student");
  const [classId, setClassId] = useState<string>(p.requested_class_id || "");
  return (
    <div className="border rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-medium">{p.display_name || <i>{labels.noName}</i>}</div>
        <div className="text-sm text-muted-foreground">{p.email}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder={labels.role} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="student">{labels.student}</SelectItem>
            <SelectItem value="teacher">{labels.teacher}</SelectItem>
          </SelectContent>
        </Select>
        {role === "student" && (
          <Select value={classId || "__none"} onValueChange={(v) => setClassId(v === "__none" ? "" : v)}>
            <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder={labels.classPh} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">{labels.noClass}</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.level})</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onApprove(role, classId || undefined)}>
          <Check className="h-4 w-4 mr-1" />{labels.approve}
        </Button>
        <Button size="sm" variant="outline" onClick={onReject}>
          <X className="h-4 w-4 mr-1" />{labels.reject}
        </Button>
        <Button size="sm" variant="ghost" onClick={onRemove} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
