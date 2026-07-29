import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing.tsx";
import NotFound from "./pages/NotFound.tsx";
import AuthPage from "./pages/Auth.tsx";
import AppHome from "./pages/AppHome.tsx";
import { RequireSuperAdmin } from "./components/platform/RequireSuperAdmin.tsx";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/hooks/useAuth";
import { ActiveSchoolProvider } from "@/contexts/ActiveSchoolContext";
import { RequireAuth } from "@/components/RequireAuth";
import RolePlaceholder from "./components/school/RolePlaceholder.tsx";
import { InstallPWA } from "./components/pwa/InstallPWA";

const queryClient = new QueryClient();

const Index = lazy(() => import("./pages/Index.tsx"));
const Learn = lazy(() => import("./pages/Learn.tsx"));
const MedicalGerman = lazy(() => import("./pages/MedicalGerman.tsx"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard.tsx"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard.tsx"));
const QuestionBank = lazy(() => import("./pages/QuestionBank.tsx"));
const Assignments = lazy(() => import("./pages/Assignments.tsx"));
const ClassDetail = lazy(() => import("./pages/ClassDetail.tsx"));
const SchoolAdminPage = lazy(() => import("./pages/SchoolAdmin.tsx"));
const ExamRunner = lazy(() => import("./pages/ExamRunner.tsx"));
const PdfImport = lazy(() => import("./pages/PdfImport.tsx"));
const CoursePlan = lazy(() => import("./pages/CoursePlan.tsx"));
const TeacherStats = lazy(() => import("./pages/TeacherStats.tsx"));
const Messages = lazy(() => import("./pages/Messages.tsx"));
const CalendarPage = lazy(() => import("./pages/CalendarPage.tsx"));
const Announcements = lazy(() => import("./pages/Announcements.tsx"));
const Reports = lazy(() => import("./pages/Reports.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const TeacherHomework = lazy(() => import("./pages/TeacherHomework.tsx"));
const StudentHomework = lazy(() => import("./pages/StudentHomework.tsx"));
const AssignmentReview = lazy(() => import("./pages/AssignmentReview.tsx"));
const StudentExamResult = lazy(() => import("./pages/StudentExamResult.tsx"));
const Wortschatz = lazy(() => import("./pages/Wortschatz.tsx"));
const WortschatzFlashcards = lazy(() => import("./pages/WortschatzFlashcards.tsx"));
const Kapitel = lazy(() => import("./pages/Kapitel.tsx"));
const KapitelDetail = lazy(() => import("./pages/KapitelDetail.tsx"));
const Certificates = lazy(() => import("./pages/Certificates.tsx"));
const AuditLogs = lazy(() => import("./pages/AuditLogs.tsx"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate.tsx"));
const PlatformAdminLayout = lazy(() => import("./pages/platform/PlatformAdminLayout.tsx"));
const PlatformDashboard = lazy(() => import("./pages/platform/Dashboard.tsx"));
const PlatformSchools = lazy(() => import("./pages/platform/Schools.tsx"));
const PlatformSchoolNew = lazy(() => import("./pages/platform/SchoolNew.tsx"));
const PlatformSchoolDetail = lazy(() => import("./pages/platform/SchoolDetail.tsx"));
const PlatformSettings = lazy(() => import("./pages/platform/PlatformSettings.tsx"));
const PlatformApprovals = lazy(() => import("./pages/platform/Approvals.tsx"));
const PlatformUsersGlobal = lazy(() => import("./pages/platform/UsersGlobal.tsx"));
const PlatformClassesGlobal = lazy(() => import("./pages/platform/ClassesGlobal.tsx"));
const PlatformStructure = lazy(() => import("./pages/platform/Structure.tsx"));
const BillingAdmin = lazy(() => import("./pages/platform/BillingAdmin.tsx"));
const GdprAdmin = lazy(() => import("./pages/platform/GdprAdmin.tsx"));
const SchoolAnalytics = lazy(() => import("./pages/SchoolAnalytics.tsx"));
const PendingApproval = lazy(() => import("./pages/PendingApproval.tsx"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard.tsx"));
const ParentChildren = lazy(() => import("./pages/parent/ParentChildren.tsx"));
const SchoolClassDetail = lazy(() => import("./pages/school/SchoolClassDetail.tsx"));
const SchoolBilling = lazy(() => import("./pages/school/SchoolBilling.tsx"));
const SoloBilling = lazy(() => import("./pages/solo-student/SoloBilling.tsx"));
const StudentBilling = lazy(() => import("./pages/student/StudentBilling.tsx"));
const SchoolTransactions = lazy(() => import("./pages/school/SchoolTransactions.tsx"));
const TeacherStudioTransactions = lazy(() => import("./pages/teacher-studio/TeacherStudioTransactions.tsx"));
const PlatformTransactions = lazy(() => import("./pages/platform/PlatformTransactions.tsx"));
const AcademicLayout = lazy(() => import("./pages/academic/AcademicLayout.tsx"));
const AcademicDashboard = lazy(() => import("./pages/academic/AcademicDashboard.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const ChooseSpace = lazy(() => import("./pages/ChooseSpace.tsx"));
const TeacherStudioDashboard = lazy(() => import("./pages/teacher-studio/TeacherStudioDashboard.tsx"));
const TeacherStudioSettings = lazy(() => import("./pages/teacher-studio/TeacherStudioSettings.tsx"));
const TeacherStudents = lazy(() => import("./pages/TeacherStudents.tsx"));
const SoloStudentDashboard = lazy(() => import("./pages/solo-student/SoloStudentDashboard.tsx"));
const SoloStudentSettings = lazy(() => import("./pages/solo-student/SoloStudentSettings.tsx"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const Community = lazy(() => import("./pages/Community.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const LegalConsent = lazy(() => import("./pages/LegalConsent.tsx"));
const AccountPrivacy = lazy(() => import("./pages/AccountPrivacy.tsx"));
const Adaptive = lazy(() => import("./pages/Adaptive.tsx"));
const Forum = lazy(() => import("./pages/Forum.tsx"));
const ForumTopic = lazy(() => import("./pages/ForumTopic.tsx"));
const Challenges = lazy(() => import("./pages/Challenges.tsx"));
const Live = lazy(() => import("./pages/Live.tsx"));
const LiveRoom = lazy(() => import("./pages/LiveRoom.tsx"));
const VoiceCoach = lazy(() => import("./pages/VoiceCoach.tsx"));
const Avatar = lazy(() => import("./pages/Avatar.tsx"));
const AIAvatar = lazy(() =>
  import("./components/AIAvatar.tsx").then((module) => ({ default: module.AIAvatar })),
);
const Diagnostics = lazy(() => import("./pages/Diagnostics.tsx"));


const PageFallback = () => (
  <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
    Chargement…
  </div>
);

const AvatarPage = () => <Avatar />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <InstallPWA />
        <BrowserRouter>
          <AuthProvider>
            <ActiveSchoolProvider>
            <Suspense fallback={<PageFallback />}>
              <Routes>
              {/* Public free-learning app (no auth) */}
              <Route path="/" element={<Landing />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/learn/medical-german" element={<MedicalGerman />} />
              <Route path="/deutschmeister" element={<Index />} />
              <Route path="/plan" element={<CoursePlan />} />
             <Route path="/auth" element={<AuthPage />} />
             <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="/verify/:number" element={<VerifyCertificate />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/diagnostics" element={<Diagnostics />} />

              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/legal-consent" element={<RequireAuth requireLegal={false}><LegalConsent /></RequireAuth>} />
              <Route path="/account/privacy" element={<RequireAuth requireLegal={false}><AccountPrivacy /></RequireAuth>} />
              <Route path="/community" element={<RequireAuth requireSpace><Community /></RequireAuth>} />


              {/* Authenticated app */}
              <Route path="/app" element={<RequireAuth><AppHome /></RequireAuth>} />
              <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
              <Route path="/choose-space" element={<RequireAuth requireSpace><ChooseSpace /></RequireAuth>} />
              {/* Teacher Studio (independent teacher) */}
              <Route path="/teacher-studio" element={<RequireAuth role={["teacher","super_admin"]} spaceType="independent_teacher" spaceRole="teacher"><TeacherStudioDashboard /></RequireAuth>} />
              <Route path="/teacher-studio/classes" element={<RequireAuth role={["teacher","super_admin"]} spaceType="independent_teacher" spaceRole="teacher"><TeacherDashboard /></RequireAuth>} />
              <Route path="/teacher-studio/classes/:id" element={<RequireAuth role={["teacher","super_admin"]} spaceType="independent_teacher" spaceRole="teacher"><ClassDetail /></RequireAuth>} />
              <Route path="/teacher-studio/students" element={<RequireAuth role={["teacher","super_admin"]} spaceType="independent_teacher" spaceRole="teacher"><TeacherDashboard /></RequireAuth>} />
              <Route path="/teacher-studio/homework" element={<RequireAuth role={["teacher","super_admin"]} spaceType="independent_teacher" spaceRole="teacher"><TeacherHomework /></RequireAuth>} />
              <Route path="/teacher-studio/exams" element={<RequireAuth role={["teacher","super_admin"]} spaceType="independent_teacher" spaceRole="teacher"><Assignments /></RequireAuth>} />
              <Route path="/teacher-studio/exams/:id" element={<RequireAuth role={["teacher","super_admin"]} spaceType="independent_teacher" spaceRole="teacher"><AssignmentReview /></RequireAuth>} />
              <Route path="/teacher-studio/certificates" element={<RequireAuth role={["teacher","super_admin"]} spaceType="independent_teacher" spaceRole="teacher"><Certificates /></RequireAuth>} />
              <Route path="/teacher-studio/reports" element={<RequireAuth role={["teacher","super_admin"]} spaceType="independent_teacher" spaceRole="teacher"><Reports /></RequireAuth>} />
              <Route path="/teacher-studio/settings" element={<RequireAuth role={["teacher","super_admin"]} spaceType="independent_teacher" spaceRole="teacher"><TeacherStudioSettings /></RequireAuth>} />
              <Route path="/teacher-studio/billing" element={<RequireAuth role={["teacher","super_admin"]} spaceType="independent_teacher" spaceRole="teacher"><SchoolBilling /></RequireAuth>} />
              <Route path="/teacher-studio/transactions" element={<RequireAuth role={["teacher","super_admin"]} spaceType="independent_teacher" spaceRole="teacher"><TeacherStudioTransactions /></RequireAuth>} />
              <Route path="/solo-student" element={<RequireAuth spaceType="independent_student" spaceRole="student"><SoloStudentDashboard /></RequireAuth>} />
              <Route path="/solo-student/settings" element={<RequireAuth spaceType="independent_student" spaceRole="student"><SoloStudentSettings /></RequireAuth>} />
              <Route path="/solo-student/billing" element={<RequireAuth spaceType="independent_student" spaceRole="student"><SoloBilling /></RequireAuth>} />
              <Route path="/solo-student/path" element={<RequireAuth spaceType="independent_student" spaceRole="student"><SoloStudentDashboard /></RequireAuth>} />
              <Route path="/solo-student/kapitel" element={<RequireAuth spaceType="independent_student" spaceRole="student"><Kapitel /></RequireAuth>} />
              <Route path="/solo-student/wortschatz" element={<RequireAuth spaceType="independent_student" spaceRole="student"><Wortschatz /></RequireAuth>} />
              <Route path="/solo-student/flashcards" element={<RequireAuth spaceType="independent_student" spaceRole="student"><WortschatzFlashcards /></RequireAuth>} />
              <Route path="/solo-student/exams" element={<RequireAuth spaceType="independent_student" spaceRole="student"><StudentHomework /></RequireAuth>} />
              <Route path="/solo-student/certificates" element={<RequireAuth spaceType="independent_student" spaceRole="student"><Certificates /></RequireAuth>} />
              <Route path="/student" element={<RequireAuth spaceType="school" spaceRole="student"><StudentDashboard /></RequireAuth>} />
              <Route path="/student/exam/:id" element={<RequireAuth spaceType="school" spaceRole="student"><ExamRunner /></RequireAuth>} />
              <Route path="/student/result/:id" element={<RequireAuth spaceType="school" spaceRole="student"><StudentExamResult /></RequireAuth>} />

              {/* Parent area */}
              <Route path="/parent" element={<RequireAuth role={["parent","super_admin"]} spaceType="school" spaceRole="parent"><ParentDashboard /></RequireAuth>} />
              <Route path="/parent/children" element={<RequireAuth role={["parent","super_admin"]} spaceType="school" spaceRole="parent"><ParentChildren /></RequireAuth>} />
              <Route path="/parent/attendance" element={<RequireAuth role={["parent","super_admin"]} spaceType="school" spaceRole="parent"><RolePlaceholder title="Présence" subtitle="Suivi de la présence de votre enfant" parentHref="/parent" parentLabel="Tableau de bord parent" /></RequireAuth>} />
              <Route path="/parent/homework" element={<RequireAuth role={["parent","super_admin"]} spaceType="school" spaceRole="parent"><RolePlaceholder title="Devoirs" subtitle="Devoirs en cours et corrigés" parentHref="/parent" /></RequireAuth>} />
              <Route path="/parent/results" element={<RequireAuth role={["parent","super_admin"]} spaceType="school" spaceRole="parent"><RolePlaceholder title="Résultats" subtitle="Notes et progression" parentHref="/parent" /></RequireAuth>} />
              <Route path="/parent/certificates" element={<RequireAuth role={["parent","super_admin"]} spaceType="school" spaceRole="parent"><RolePlaceholder title="Certificats" subtitle="Certificats obtenus" parentHref="/parent" /></RequireAuth>} />
              <Route path="/parent/messages" element={<RequireAuth role={["parent","super_admin"]} spaceType="school" spaceRole="parent"><Messages /></RequireAuth>} />
              <Route path="/parent/calendar" element={<RequireAuth role={["parent","super_admin"]} spaceType="school" spaceRole="parent"><CalendarPage /></RequireAuth>} />
              <Route path="/parent/announcements" element={<RequireAuth role={["parent","super_admin"]} spaceType="school" spaceRole="parent"><Announcements /></RequireAuth>} />

              {/* Teacher area */}
              <Route path="/teacher" element={<RequireAuth role={["teacher","examiner","staff","super_admin"]} spaceType="school" spaceRole={["teacher","examiner","staff"]}><TeacherDashboard /></RequireAuth>} />
              <Route path="/teacher/bank" element={<RequireAuth role={["teacher","examiner","staff","super_admin"]} spaceType="school" spaceRole={["teacher","examiner","staff"]}><QuestionBank /></RequireAuth>} />
              <Route path="/teacher/assignments" element={<RequireAuth role={["teacher","examiner","staff","super_admin"]} spaceType="school" spaceRole={["teacher","examiner","staff"]}><Assignments /></RequireAuth>} />
              <Route path="/teacher/assignments/:id" element={<RequireAuth role={["teacher","examiner","staff","super_admin"]} spaceType="school" spaceRole={["teacher","examiner","staff"]}><AssignmentReview /></RequireAuth>} />
              <Route path="/teacher/class/:id" element={<RequireAuth role={["teacher","examiner","staff","super_admin"]} spaceType="school" spaceRole={["teacher","examiner","staff"]}><ClassDetail /></RequireAuth>} />
              <Route path="/teacher/import" element={<RequireAuth role={["teacher","examiner","staff","super_admin"]} spaceType="school" spaceRole={["teacher","examiner","staff"]}><PdfImport /></RequireAuth>} />
              <Route path="/teacher/stats" element={<RequireAuth role={["teacher","examiner","staff","super_admin"]} spaceType="school" spaceRole={["teacher","examiner","staff"]}><TeacherStats /></RequireAuth>} />
              <Route path="/teacher/reports" element={<RequireAuth role={["teacher","examiner","staff","super_admin"]} spaceType="school" spaceRole={["teacher","examiner","staff"]}><Reports /></RequireAuth>} />
              <Route path="/teacher/homework" element={<RequireAuth role={["teacher","examiner","staff","super_admin"]} spaceType="school" spaceRole={["teacher","examiner","staff"]}><TeacherHomework /></RequireAuth>} />
              <Route path="/teacher/classes" element={<RequireAuth role={["teacher","examiner","staff","super_admin"]} spaceType="school" spaceRole={["teacher","examiner","staff"]}><TeacherDashboard /></RequireAuth>} />
              <Route path="/teacher/students" element={<RequireAuth role={["teacher","examiner","staff","super_admin"]} spaceType="school" spaceRole={["teacher","examiner","staff"]}><TeacherStudents /></RequireAuth>} />
              <Route path="/teacher/attendance" element={<RequireAuth role={["teacher","examiner","staff","super_admin"]} spaceType="school" spaceRole={["teacher","examiner","staff"]}><RolePlaceholder title="Présence" subtitle="Prendre la présence de vos classes" parentHref="/teacher" parentLabel="Espace professeur" /></RequireAuth>} />
              <Route path="/teacher/exams" element={<RequireAuth role={["teacher","examiner","staff","super_admin"]} spaceType="school" spaceRole={["teacher","examiner","staff"]}><Assignments /></RequireAuth>} />
              <Route path="/teacher/messages" element={<RequireAuth role={["teacher","examiner","staff","super_admin"]} spaceType="school" spaceRole={["teacher","examiner","staff"]}><Messages /></RequireAuth>} />
              <Route path="/teacher/calendar" element={<RequireAuth role={["teacher","examiner","staff","super_admin"]} spaceType="school" spaceRole={["teacher","examiner","staff"]}><CalendarPage /></RequireAuth>} />
              <Route path="/student/homework" element={<RequireAuth spaceType="school" spaceRole="student"><StudentHomework /></RequireAuth>} />
              <Route path="/student/billing" element={<RequireAuth spaceType="school" spaceRole="student"><StudentBilling /></RequireAuth>} />
              <Route path="/student/path" element={<RequireAuth spaceType="school" spaceRole="student"><StudentDashboard /></RequireAuth>} />
              <Route path="/student/courses" element={<RequireAuth spaceType="school" spaceRole="student"><Kapitel /></RequireAuth>} />
              <Route path="/student/revisions" element={<RequireAuth spaceType="school" spaceRole="student"><RolePlaceholder title="Mes révisions" subtitle="Révisions personnalisées" parentHref="/student" parentLabel="Mon espace" /></RequireAuth>} />
              <Route path="/student/wortschatz" element={<RequireAuth spaceType="school" spaceRole="student"><Wortschatz /></RequireAuth>} />
              <Route path="/student/flashcards" element={<RequireAuth spaceType="school" spaceRole="student"><WortschatzFlashcards /></RequireAuth>} />
              <Route path="/student/oral" element={<RequireAuth spaceType="school" spaceRole="student"><RolePlaceholder title="Oral" subtitle="Exercices de prononciation et expression orale" parentHref="/student" /></RequireAuth>} />
              <Route path="/student/certificates" element={<RequireAuth spaceType="school" spaceRole="student"><RolePlaceholder title="Mes certificats" subtitle="Vos certificats obtenus" parentHref="/student" /></RequireAuth>} />
              <Route path="/student/messages" element={<RequireAuth spaceType="school" spaceRole="student"><Messages /></RequireAuth>} />
              <Route path="/student/calendar" element={<RequireAuth spaceType="school" spaceRole="student"><CalendarPage /></RequireAuth>} />
              <Route path="/student/profile" element={<RequireAuth spaceType="school" spaceRole="student"><Settings /></RequireAuth>} />

              {/* Shared modules */}
              <Route path="/messages" element={<RequireAuth requireSpace><Messages /></RequireAuth>} />
              <Route path="/calendar" element={<RequireAuth requireSpace><CalendarPage /></RequireAuth>} />
              <Route path="/announcements" element={<RequireAuth requireSpace><Announcements /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth requireSpace><Settings /></RequireAuth>} />
              <Route path="/wortschatz" element={<RequireAuth requireSpace><Wortschatz /></RequireAuth>} />
              <Route path="/wortschatz/flashcards" element={<RequireAuth requireSpace><WortschatzFlashcards /></RequireAuth>} />
              <Route path="/kapitel" element={<RequireAuth requireSpace><Kapitel /></RequireAuth>} />
              <Route path="/kapitel/:level/:slug" element={<RequireAuth requireSpace><KapitelDetail /></RequireAuth>} />
              <Route path="/adaptive" element={<RequireAuth requireSpace><Adaptive /></RequireAuth>} />
              <Route path="/forum" element={<RequireAuth requireSpace><Forum /></RequireAuth>} />
              <Route path="/forum/:id" element={<RequireAuth requireSpace><ForumTopic /></RequireAuth>} />
              <Route path="/challenges" element={<RequireAuth requireSpace><Challenges /></RequireAuth>} />
              <Route path="/live" element={<RequireAuth requireSpace><Live /></RequireAuth>} />
              <Route path="/live/:code" element={<RequireAuth requireSpace><LiveRoom /></RequireAuth>} />
              <Route path="/avatar" element={<RequireAuth requireSpace><AvatarPage /></RequireAuth>} />
              <Route path="/voice-coach" element={<RequireAuth requireSpace><VoiceCoach /></RequireAuth>} />

              {/* Admin */}
              <Route path="/admin" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><SchoolAdminPage /></RequireAuth>} />
              <Route path="/admin/school" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><SchoolAdminPage /></RequireAuth>} />
              <Route path="/admin/certificates" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><Certificates /></RequireAuth>} />
              <Route path="/admin/audit" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><AuditLogs /></RequireAuth>} />

              {/* School Admin (alias structuré /school-admin/*) */}
              <Route path="/school-admin" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><SchoolAdminPage /></RequireAuth>} />
              <Route path="/school-admin/classes" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><SchoolAdminPage /></RequireAuth>} />
              <Route path="/school-admin/classes/:classId" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><SchoolClassDetail /></RequireAuth>} />
              <Route path="/school-admin/teachers" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><SchoolAdminPage /></RequireAuth>} />
              <Route path="/school-admin/students" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><SchoolAdminPage /></RequireAuth>} />
              <Route path="/school-admin/approvals" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><SchoolAdminPage /></RequireAuth>} />
              <Route path="/school-admin/academic-years" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><RolePlaceholder title="Années scolaires" subtitle="Organisation des années académiques" parentHref="/school-admin" parentLabel="Admin école" /></RequireAuth>} />
              <Route path="/school-admin/sessions" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><RolePlaceholder title="Sessions" subtitle="Sessions de l'école (été, intensif, semestre…)" parentHref="/school-admin" /></RequireAuth>} />
              <Route path="/school-admin/enrollments" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><RolePlaceholder title="Inscriptions" subtitle="Demandes d'inscription et affectations" parentHref="/school-admin" /></RequireAuth>} />
              <Route path="/school-admin/attendance" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><RolePlaceholder title="Présence" subtitle="Suivi de la présence par classe" parentHref="/school-admin" /></RequireAuth>} />
              <Route path="/school-admin/homework" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><TeacherHomework /></RequireAuth>} />
              <Route path="/school-admin/exams" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><Assignments /></RequireAuth>} />
              <Route path="/school-admin/certificates" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><Certificates /></RequireAuth>} />
              <Route path="/school-admin/reports" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><Reports /></RequireAuth>} />
              <Route path="/school-admin/analytics" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><SchoolAnalytics /></RequireAuth>} />
              <Route path="/school-admin/billing" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><SchoolBilling /></RequireAuth>} />
              <Route path="/school-admin/transactions" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><SchoolTransactions /></RequireAuth>} />
              <Route path="/school-admin/settings" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><SchoolAdminPage /></RequireAuth>} />
              <Route path="/school-admin/rules" element={<RequireAuth role={["school_admin","super_admin"]} spaceType="school" spaceRole={["owner","school_admin"]}><RolePlaceholder title="Règles école" subtitle="Règles d'absence, certificat, promotion…" parentHref="/school-admin" /></RequireAuth>} />

              {/* Direction pédagogique */}
              <Route path="/academic" element={<RequireAuth role={["academic_director","pedagogical_coordinator","super_admin"]} spaceType="school" spaceRole={["academic_director","pedagogical_coordinator"]}><AcademicLayout /></RequireAuth>}>
                <Route index element={<AcademicDashboard />} />
                <Route path="curriculum" element={<RolePlaceholder title="Curriculum" subtitle="Programme A1.1 → B2.2" parentHref="/academic" parentLabel="Direction pédagogique" />} />
                <Route path="levels" element={<RolePlaceholder title="Niveaux" subtitle="Gestion des niveaux et sous-niveaux" parentHref="/academic" />} />
                <Route path="content-library" element={<RolePlaceholder title="Bibliothèque de cours" parentHref="/academic" />} />
                <Route path="kapitel" element={<RolePlaceholder title="Kapitel" parentHref="/academic" />} />
                <Route path="vocabulary" element={<RolePlaceholder title="Vocabulaire" parentHref="/academic" />} />
                <Route path="question-bank" element={<RolePlaceholder title="Banque de questions" parentHref="/academic" />} />
                <Route path="exam-templates" element={<RolePlaceholder title="Examens modèles" parentHref="/academic" />} />
                <Route path="ai-validation" element={<RolePlaceholder title="Validation IA" subtitle="Contenus générés par IA en attente de validation" parentHref="/academic" />} />
                <Route path="reports" element={<RolePlaceholder title="Rapports pédagogiques" parentHref="/academic" />} />
              </Route>

              {/* Platform Super Admin */}
              <Route path="/platform-admin" element={<RequireSuperAdmin><PlatformAdminLayout /></RequireSuperAdmin>}>
                <Route index element={<PlatformDashboard />} />
                <Route path="schools" element={<PlatformSchools />} />
                <Route path="schools/new" element={<PlatformSchoolNew />} />
                <Route path="schools/:id" element={<PlatformSchoolDetail />} />
                <Route path="classes" element={<PlatformClassesGlobal />} />
                <Route path="teachers" element={<PlatformUsersGlobal role="teacher" title="Professeurs" subtitle="Tous les enseignants de la plateforme." />} />
                <Route path="students" element={<PlatformUsersGlobal role="student" title="Élèves" subtitle="Tous les élèves inscrits sur la plateforme." />} />
                <Route path="approvals" element={<PlatformApprovals />} />
                <Route path="structure" element={<PlatformStructure />} />
                <Route path="audit" element={<AuditLogs />} />
                <Route path="settings" element={<PlatformSettings />} />
                <Route path="billing" element={<BillingAdmin />} />
                <Route path="gdpr" element={<GdprAdmin />} />

                <Route path="content" element={<RolePlaceholder title="Contenu officiel" subtitle="Bibliothèque pédagogique globale" parentHref="/platform-admin" parentLabel="Super Admin" />} />
                <Route path="ai-quotas" element={<RolePlaceholder title="Quotas IA" subtitle="Limites par école et par utilisateur" parentHref="/platform-admin" />} />
                <Route path="certificates" element={<RolePlaceholder title="Certificats" subtitle="Tous les certificats émis" parentHref="/platform-admin" />} />
                <Route path="reports" element={<RolePlaceholder title="Rapports plateforme" parentHref="/platform-admin" />} />
              </Route>

              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Suspense fallback={null}>
              <AIAvatar />
            </Suspense>
            </ActiveSchoolProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
