import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Languages, ArrowLeft } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { tt, lang, setLang } = useI18n();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const currentYear = new Date().getFullYear();
  const isMinor = birthYear !== "" && currentYear - parseInt(birthYear) < 16;

  // Account type & attachment
  type AccountType = "student" | "teacher" | "school";
  type Attachment = "existing" | "independent";
  const [accountType, setAccountType] = useState<AccountType>("student");
  const [attachment, setAttachment] = useState<Attachment>("existing");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [studioName, setStudioName] = useState("");
  const [startLevel, setStartLevel] = useState("A1.1");
  const [schoolName, setSchoolName] = useState("");
  const [schoolKind, setSchoolKind] = useState<"school" | "institute">("school");
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    supabase.rpc("list_public_schools" as any).then(({ data }: any) => {
      setSchools(((data as any[]) || []).map((s: any) => ({ id: s.id, name: s.name })));
    });
  }, []);

  // Preserve `next` (e.g. OAuth consent URL) through sign-in, sign-up, and Google.
  const nextPath = useMemo(() => {
    const raw = searchParams.get("next");
    if (!raw) return null;
    // Only allow same-origin relative paths.
    if (!raw.startsWith("/") || raw.startsWith("//")) return null;
    return raw;
  }, [searchParams]);
  const returnUrl = nextPath ? `${window.location.origin}${nextPath}` : `${window.location.origin}/app`;

  // Only auto-redirect when a `next` param is present (e.g. OAuth consent flow).
  // Otherwise, let the user see the sign-in form even if a session already exists,
  // so they can switch accounts.
  useEffect(() => {
    if (!loading && user && nextPath) navigate(nextPath, { replace: true });
  }, [user, loading, navigate, nextPath]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(tt({ fr: "Déconnecté", de: "Abgemeldet", ar: "تم تسجيل الخروج" }));
  };

  const T = {
    title: { fr: "Deutsch Meister", de: "Deutsch Meister", ar: "ديتش مايستر" },
    sub: { fr: "Connectez-vous", de: "Melden Sie sich an", ar: "تسجيل الدخول" },
    signIn: { fr: "Se connecter", de: "Anmelden", ar: "دخول" },
    signUp: { fr: "Créer un compte", de: "Konto erstellen", ar: "إنشاء حساب" },
    email: { fr: "Email", de: "E-Mail", ar: "البريد الإلكتروني" },
    password: { fr: "Mot de passe", de: "Passwort", ar: "كلمة المرور" },
    passwordHint: { fr: "Mot de passe (8+ car.)", de: "Passwort (mind. 8 Zeichen)", ar: "كلمة المرور (8+ أحرف)" },
    name: { fr: "Nom", de: "Name", ar: "الاسم" },
    create: { fr: "Créer mon compte", de: "Konto erstellen", ar: "أنشئ حسابي" },
    or: { fr: "ou", de: "oder", ar: "أو" },
    google: { fr: "Continuer avec Google", de: "Mit Google fortfahren", ar: "المتابعة مع Google" },
    note: {
      fr: "Un compte étudiant est créé par défaut. Pour un rôle enseignant, contactez l'administrateur.",
      de: "Standardmäßig wird ein Schülerkonto erstellt. Für eine Lehrerrolle wenden Sie sich an den Administrator.",
      ar: "يتم إنشاء حساب طالب افتراضيًا. للحصول على دور المعلم، اتصل بالمسؤول.",
    },
    pendingApproval: {
      fr: "Compte créé. En attente d'approbation par l'administrateur.",
      de: "Konto erstellt. Warte auf Freigabe durch den Administrator.",
      ar: "تم إنشاء الحساب. في انتظار موافقة المسؤول.",
    },
    notApproved: {
      fr: "Compte non approuvé. Contactez l'administrateur.",
      de: "Konto nicht freigegeben. Wenden Sie sich an den Administrator.",
      ar: "لم تتم الموافقة على حسابك بعد. اتصل بالمسؤول.",
    },
    back: { fr: "Accueil", de: "Startseite", ar: "الرئيسية" },
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) { toast.error(tt({ fr: "Veuillez accepter les CGU et la politique de confidentialité.", de: "Bitte akzeptieren Sie AGB und Datenschutz.", ar: "يرجى قبول الشروط وسياسة الخصوصية." })); return; }
    if (isMinor && (!guardianConsent || !guardianEmail)) { toast.error(tt({ fr: "Consentement parental requis (email du parent).", de: "Elterliche Einwilligung erforderlich.", ar: "موافقة الوالدين مطلوبة." })); return; }

    // Validate account-type specific fields
    if ((accountType === "student" || accountType === "teacher") && attachment === "existing" && !selectedSchoolId) {
      toast.error(tt({ fr: "Sélectionnez une école dans la liste.", de: "Bitte eine Schule aus der Liste wählen.", ar: "اختر مدرسة من القائمة." }));
      return;
    }
    if (accountType === "teacher" && attachment === "independent" && !studioName.trim()) {
      toast.error(tt({ fr: "Nom du studio requis.", de: "Studio-Name erforderlich.", ar: "اسم الاستوديو مطلوب." }));
      return;
    }
    if (accountType === "school" && schoolName.trim().length < 3) {
      toast.error(tt({ fr: "Nom d'école/institut requis.", de: "Name der Schule/Institut erforderlich.", ar: "اسم المدرسة/المعهد مطلوب." }));
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: returnUrl,
        data: {
          display_name: name || email.split("@")[0],
          birth_year: birthYear || null,
          is_minor: isMinor,
          guardian_email: isMinor ? guardianEmail : null,
          guardian_consent: isMinor ? guardianConsent : false,
          terms_version: TERMS_VERSION,
          privacy_version: PRIVACY_VERSION,
          account_type: accountType,
          attachment,
        },
      },
    });

    // Provision the requested space while the just-created session is still active.
    if (!error && data.user) {
      try {
        if (accountType === "student" && attachment === "existing") {
          await supabase.rpc("request_join_school" as any, { _school_id: selectedSchoolId, _role: "student" });
        } else if (accountType === "teacher" && attachment === "existing") {
          await supabase.rpc("request_join_school" as any, { _school_id: selectedSchoolId, _role: "teacher" });
        } else if (accountType === "student" && attachment === "independent") {
          await supabase.rpc("create_independent_student_space", { _current_level: startLevel });
        } else if (accountType === "teacher" && attachment === "independent") {
          await supabase.rpc("create_independent_teacher_space", { _studio_name: studioName.trim(), _display_name: name || null });
        } else if (accountType === "school") {
          const label = schoolKind === "institute" ? `Institut ${schoolName.trim()}` : schoolName.trim();
          await supabase.rpc("request_school_space", { _school_name: label });
        }
      } catch (err: any) {
        // Non-fatal: the account exists; owner can retry provisioning later.
        console.warn("provisioning failed", err?.message || err);
      }
      await supabase.auth.signOut();
    }
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success(tt(T.pendingApproval));
  };

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setBusy(false); toast.error(error.message); return; }
    const uid = data.user?.id;
    if (uid) {
      const { data: prof } = await supabase.from("profiles").select("approved").eq("user_id", uid).maybeSingle();
      if (!prof?.approved) {
        await supabase.auth.signOut();
        setBusy(false);
        toast.error(tt(T.notApproved));
        return;
      }
      const { data: rolesRows } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      const isSuper = (rolesRows || []).some((row) => row.role === "super_admin");
      setBusy(false);
      navigate(nextPath ?? (isSuper ? "/platform-admin" : "/app"));
      return;
    }
    setBusy(false);
    navigate(nextPath ?? "/app");
  };

  const onGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: returnUrl });
    if (result.error) { toast.error(String(result.error)); setBusy(false); return; }
    if (result.redirected) return;
    navigate(nextPath ?? "/app");
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-academy-hero p-4 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 academy-grid opacity-40" />
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[hsl(var(--academy-primary)/0.35)] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[hsl(var(--academy-accent)/0.25)] blur-3xl" />
      <div className="relative w-full max-w-md mb-3 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
          <Link to="/"><ArrowLeft className="h-4 w-4 me-1 rtl:rotate-180" />{tt(T.back)}</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-white/70" />
          <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
            <SelectTrigger className="h-8 w-[140px] bg-white/10 border-white/20 text-white"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
              <SelectItem value="ar">🇹🇳 العربية</SelectItem>
              <SelectItem value="both">DE + FR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card className="relative w-full max-w-md academy-glass border-white/10 shadow-academy-glow text-white">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-3xl">🇩🇪 {tt(T.title)}</CardTitle>
          <CardDescription className="text-white/70">{tt(T.sub)}</CardDescription>
        </CardHeader>
        <CardContent>
          {user && (
            <div className="mb-4 rounded-md border border-white/15 bg-white/5 p-3 text-sm space-y-2">
              <p className="text-white/90">
                {tt({ fr: "Déjà connecté en tant que", de: "Bereits angemeldet als", ar: "متصل بالفعل باسم" })}{" "}
                <span className="font-semibold">{user.email}</span>
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => navigate("/app")} className="flex-1">
                  {tt({ fr: "Continuer vers mon espace", de: "Zu meinem Bereich", ar: "متابعة إلى مساحتي" })}
                </Button>
                <Button size="sm" variant="outline" onClick={handleSignOut} className="text-foreground">
                  {tt({ fr: "Changer de compte", de: "Konto wechseln", ar: "تغيير الحساب" })}
                </Button>
              </div>
            </div>
          )}
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{tt(T.signIn)}</TabsTrigger>
              <TabsTrigger value="signup">{tt(T.signUp)}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-3 mt-4">
              <form onSubmit={onSignIn} className="space-y-3">
                <div><Label>{tt(T.email)}</Label><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="text-foreground" /></div>
                <div><Label>{tt(T.password)}</Label><Input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="text-foreground" /></div>
                <Button type="submit" disabled={busy} className="w-full">{busy && <Loader2 className="w-4 h-4 me-2 animate-spin"/>}{tt(T.signIn)}</Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-3 mt-4">
              <form onSubmit={onSignUp} className="space-y-3">
                <div><Label>{tt(T.name)}</Label><Input value={name} onChange={e=>setName(e.target.value)} className="text-foreground" /></div>
                <div><Label>{tt(T.email)}</Label><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="text-foreground" /></div>
                <div><Label>{tt(T.passwordHint)}</Label><Input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} className="text-foreground" /></div>

                <div className="rounded-md border border-white/15 bg-white/5 p-3 space-y-3">
                  <Label className="text-white/90">{tt({ fr: "Type de compte", de: "Kontotyp", ar: "نوع الحساب" })}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["student","teacher","school"] as const).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setAccountType(t)}
                        className={`text-xs rounded-md border px-2 py-2 transition ${accountType === t ? "bg-white text-black border-white" : "border-white/20 text-white/80 hover:bg-white/10"}`}
                      >
                        {t === "student" ? tt({ fr: "Élève", de: "Schüler", ar: "طالب" })
                          : t === "teacher" ? tt({ fr: "Professeur", de: "Lehrer", ar: "معلم" })
                          : tt({ fr: "École / Institut", de: "Schule / Institut", ar: "مدرسة / معهد" })}
                      </button>
                    ))}
                  </div>

                  {(accountType === "student" || accountType === "teacher") && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setAttachment("existing")}
                          className={`text-xs rounded-md border px-2 py-2 transition ${attachment === "existing" ? "bg-white text-black border-white" : "border-white/20 text-white/80 hover:bg-white/10"}`}>
                          {tt({ fr: "Rejoindre une école", de: "Schule beitreten", ar: "الانضمام إلى مدرسة" })}
                        </button>
                        <button type="button" onClick={() => setAttachment("independent")}
                          className={`text-xs rounded-md border px-2 py-2 transition ${attachment === "independent" ? "bg-white text-black border-white" : "border-white/20 text-white/80 hover:bg-white/10"}`}>
                          {tt({ fr: "Indépendant", de: "Unabhängig", ar: "مستقل" })}
                        </button>
                      </div>

                      {attachment === "existing" && (
                        <div>
                          <Label>{tt({ fr: "École", de: "Schule", ar: "المدرسة" })}</Label>
                          <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                            <SelectTrigger className="text-foreground"><SelectValue placeholder={tt({ fr: "Choisir une école…", de: "Schule wählen…", ar: "اختر مدرسة…" })} /></SelectTrigger>
                            <SelectContent>
                              {schools.length === 0 && (
                                <div className="px-3 py-2 text-xs text-muted-foreground">
                                  {tt({ fr: "Aucune école active", de: "Keine aktive Schule", ar: "لا توجد مدرسة نشطة" })}
                                </div>
                              )}
                              {schools.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {attachment === "independent" && accountType === "student" && (
                        <div>
                          <Label>{tt({ fr: "Niveau de départ", de: "Startniveau", ar: "المستوى الابتدائي" })}</Label>
                          <select value={startLevel} onChange={(e) => setStartLevel(e.target.value)} className="w-full h-10 rounded-md border bg-background text-foreground px-3">
                            {["A1.1","A1.2","A2.1","A2.2","B1.1","B1.2","B2.1","B2.2"].map((l) => <option key={l}>{l}</option>)}
                          </select>
                        </div>
                      )}

                      {attachment === "independent" && accountType === "teacher" && (
                        <div>
                          <Label>{tt({ fr: "Nom du studio", de: "Studio-Name", ar: "اسم الاستوديو" })}</Label>
                          <Input value={studioName} onChange={(e) => setStudioName(e.target.value)} placeholder="Studio Deutsch" className="text-foreground" />
                        </div>
                      )}
                    </>
                  )}

                  {accountType === "school" && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setSchoolKind("school")}
                          className={`text-xs rounded-md border px-2 py-2 transition ${schoolKind === "school" ? "bg-white text-black border-white" : "border-white/20 text-white/80 hover:bg-white/10"}`}>
                          {tt({ fr: "École", de: "Schule", ar: "مدرسة" })}
                        </button>
                        <button type="button" onClick={() => setSchoolKind("institute")}
                          className={`text-xs rounded-md border px-2 py-2 transition ${schoolKind === "institute" ? "bg-white text-black border-white" : "border-white/20 text-white/80 hover:bg-white/10"}`}>
                          {tt({ fr: "Institut", de: "Institut", ar: "معهد" })}
                        </button>
                      </div>
                      <div>
                        <Label>{tt({ fr: "Nom", de: "Name", ar: "الاسم" })}</Label>
                        <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder={schoolKind === "institute" ? "Institut Deutsch Tunis" : "École Allemande"} className="text-foreground" />
                      </div>
                      <p className="text-[11px] text-white/60">
                        {tt({ fr: "La demande est validée par le propriétaire de la plateforme.", de: "Der Antrag wird vom Plattforminhaber geprüft.", ar: "تخضع الطلبات لموافقة مالك المنصة." })}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <Label>{tt({ fr: "Année de naissance", de: "Geburtsjahr", ar: "سنة الميلاد" })}</Label>
                  <Input type="number" min={1920} max={currentYear} placeholder="2010" value={birthYear} onChange={e=>setBirthYear(e.target.value)} className="text-foreground" />
                </div>
                {isMinor && (
                  <div className="rounded-md border border-amber-400/40 bg-amber-500/10 p-3 space-y-2">
                    <p className="text-xs text-amber-200">{tt({ fr: "Mineur détecté : consentement parental requis.", de: "Minderjährig: elterliche Einwilligung erforderlich.", ar: "قاصر: موافقة الوالدين مطلوبة." })}</p>
                    <Input type="email" required placeholder={tt({ fr: "Email du parent/tuteur", de: "E-Mail des Erziehungsberechtigten", ar: "بريد الوالد" })} value={guardianEmail} onChange={e=>setGuardianEmail(e.target.value)} className="text-foreground" />
                    <label className="flex items-start gap-2 text-xs text-white/90">
                      <input type="checkbox" checked={guardianConsent} onChange={e=>setGuardianConsent(e.target.checked)} className="mt-0.5" />
                      <span>{tt({ fr: "Je confirme avoir l'accord de mon parent/tuteur.", de: "Ich bestätige die Zustimmung meines Erziehungsberechtigten.", ar: "أؤكد موافقة والدي." })}</span>
                    </label>
                  </div>
                )}
                <label className="flex items-start gap-2 text-xs text-white/90">
                  <input type="checkbox" checked={acceptTerms} onChange={e=>setAcceptTerms(e.target.checked)} className="mt-0.5" />
                  <span>
                    {tt({ fr: "J'accepte les ", de: "Ich akzeptiere die ", ar: "أوافق على " })}
                    <Link to="/terms" target="_blank" className="underline">
                      {tt({ fr: "conditions générales", de: "Nutzungsbedingungen", ar: "شروط الاستخدام" })}
                    </Link>
                    {tt({ fr: " et la ", de: " und die ", ar: " و" })}
                    <Link to="/privacy" target="_blank" className="underline">
                      {tt({ fr: "politique de confidentialité", de: "Datenschutzerklärung", ar: "سياسة الخصوصية" })}
                    </Link>.
                  </span>
                </label>
                <Button type="submit" disabled={busy} className="w-full">{busy && <Loader2 className="w-4 h-4 me-2 animate-spin"/>}{tt(T.create)}</Button>
              </form>
            </TabsContent>
          </Tabs>


          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">{tt(T.or)}</span></div>
          </div>

          <Button variant="outline" onClick={onGoogle} disabled={busy} className="w-full text-foreground">
            <svg className="w-4 h-4 me-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            {tt(T.google)}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            {tt(T.note)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
