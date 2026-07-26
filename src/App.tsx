import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Landing from "./pages/Landing.tsx";
import Learn from "./pages/Learn.tsx";
import NotFound from "./pages/NotFound.tsx";
import AuthPage from "./pages/Auth.tsx";
import AppHome from "./pages/AppHome.tsx";
import TeacherDashboard from "./pages/TeacherDashboard.tsx";
import StudentDashboard from "./pages/StudentDashboard.tsx";
import Placeholder from "./pages/Placeholder.tsx";
import QuestionBank from "./pages/QuestionBank.tsx";
import Assignments from "./pages/Assignments.tsx";
import ClassDetail from "./pages/ClassDetail.tsx";
import AdminPage from "./pages/Admin.tsx";
import SchoolAdminPage from "./pages/SchoolAdmin.tsx";
import ExamRunner from "./pages/ExamRunner.tsx";
import PdfImport from "./pages/PdfImport.tsx";
import CoursePlan from "./pages/CoursePlan.tsx";
import TeacherStats from "./pages/TeacherStats.tsx";
import Messages from "./pages/Messages.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";
import Announcements from "./pages/Announcements.tsx";
import Reports from "./pages/Reports.tsx";
import Settings from "./pages/Settings.tsx";
import TeacherHomework from "./pages/TeacherHomework.tsx";
import StudentHomework from "./pages/StudentHomework.tsx";
import AssignmentReview from "./pages/AssignmentReview.tsx";
import StudentExamResult from "./pages/StudentExamResult.tsx";
import Wortschatz from "./pages/Wortschatz.tsx";
import WortschatzFlashcards from "./pages/WortschatzFlashcards.tsx";
import Kapitel from "./pages/Kapitel.tsx";
import KapitelDetail from "./pages/KapitelDetail.tsx";
import Certificates from "./pages/Certificates.tsx";
import AuditLogs from "./pages/AuditLogs.tsx";
import VerifyCertificate from "./pages/VerifyCertificate.tsx";
import PlatformAdminLayout from "./pages/platform/PlatformAdminLayout.tsx";
import PlatformDashboard from "./pages/platform/Dashboard.tsx";
import PlatformSchools from "./pages/platform/Schools.tsx";
import PlatformSchoolNew from "./pages/platform/SchoolNew.tsx";
import PlatformSchoolDetail from "./pages/platform/SchoolDetail.tsx";
import PlatformSettings from "./pages/platform/PlatformSettings.tsx";
import PlatformApprovals from "./pages/platform/Approvals.tsx";
import PlatformUsersGlobal from "./pages/platform/UsersGlobal.tsx";
import PlatformClassesGlobal from "./pages/platform/ClassesGlobal.tsx";
import PlatformStructure from "./pages/platform/Structure.tsx";
import BillingAdmin from "./pages/platform/BillingAdmin.tsx";
import SchoolAnalytics from "./pages/SchoolAnalytics.tsx";

import { RequireSuperAdmin } from "./components/platform/RequireSuperAdmin.tsx";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/hooks/useAuth";
import { ActiveSchoolProvider } from "@/contexts/ActiveSchoolContext";
import { RequireAuth } from "@/components/RequireAuth";
import PendingApproval from "./pages/PendingApproval.tsx";
import ParentDashboard from "./pages/ParentDashboard.tsx";
import ParentChildren from "./pages/parent/ParentChildren.tsx";
import SchoolClassDetail from "./pages/school/SchoolClassDetail.tsx";
import AcademicLayout from "./pages/academic/AcademicLayout.tsx";
import AcademicDashboard from "./pages/academic/AcademicDashboard.tsx";
import RolePlaceholder from "./components/school/RolePlaceholder.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import ChooseSpace from "./pages/ChooseSpace.tsx";
import TeacherStudioDashboard from "./pages/teacher-studio/TeacherStudioDashboard.tsx";
import TeacherStudioSettings from "./pages/teacher-studio/TeacherStudioSettings.tsx";
import SoloStudentDashboard from "./pages/solo-student/SoloStudentDashboard.tsx";
import SoloStudentSettings from "./pages/solo-student/SoloStudentSettings.tsx";
import OAuthConsent from "./pages/OAuthConsent.tsx";
import Pricing from "./pages/Pricing.tsx";
import Community from "./pages/Community.tsx";
import Privacy from "./pages/Privacy.tsx";
import AccountPrivacy from "./pages/AccountPrivacy.tsx";
import GdprAdmin from "./pages/platform/GdprAdmin.tsx";
import { AIAvatar } from "./components/AIAvatar.tsx";
import Adaptive from "./pages/Adaptive.tsx";
import Forum from "./pages/Forum.tsx";
import ForumTopic from "./pages/ForumTopic.tsx";
import Challenges from "./pages/Challenges.tsx";
import Live from "./pages/Live.tsx";
import LiveRoom from "./pages/LiveRoom.tsx";
import Avatar from "./pages/Avatar.tsx";
import VoiceCoach from "./pages/VoiceCoach.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ActiveSchoolProvider>
            <Routes>
              {/* Public free-learning app (no auth) */}
              <Route path="/" element={<Landing />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/deutschmeister" element={<Index />} />
              <Route path="/plan" element={<CoursePlan />} />
             <Route path="/auth" element={<AuthPage />} />
             <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="/verify/:number" element={<VerifyCertificate />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/account/privacy" element={<RequireAuth><AccountPrivacy /></RequireAuth>} />
              <Route path="/community" element={<RequireAuth><Community /></RequireAuth>} />


              {/* Authenticated app */}
              <Route path="/app" element={<RequireAuth><AppHome /></RequireAuth>} />
              <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
              <Route path="/choose-space" element={<RequireAuth><ChooseSpace /></RequireAuth>} />
              {/* Teacher Studio (independent teacher) */}
              <Route path="/teacher-studio" element={<RequireAuth role={["teacher","admin","super_admin"]}><TeacherStudioDashboard /></RequireAuth>} />
              <Route path="/teacher-studio/classes" element={<RequireAuth role={["teacher","admin","super_admin"]}><TeacherDashboard /></RequireAuth>} />
              <Route path="/teacher-studio/classes/:id" element={<RequireAuth role={["teacher","admin","super_admin"]}><ClassDetail /></RequireAuth>} />
              <Route path="/teacher-studio/students" element={<RequireAuth role={["teacher","admin","super_admin"]}><TeacherDashboard /></RequireAuth>} />
              <Route path="/teacher-studio/homework" element={<RequireAuth role={["teacher","admin","super_admin"]}><TeacherHomework /></RequireAuth>} />
              <Route path="/teacher-studio/exams" element={<RequireAuth role={["teacher","admin","super_admin"]}><Assignments /></RequireAuth>} />
              <Route path="/teacher-studio/exams/:id" element={<RequireAuth role={["teacher","admin","super_admin"]}><AssignmentReview /></RequireAuth>} />
              <Route path="/teacher-studio/certificates" element={<RequireAuth role={["teacher","admin","super_admin"]}><Certificates /></RequireAuth>} />
              <Route path="/teacher-studio/reports" element={<RequireAuth role={["teacher","admin","super_admin"]}><Reports /></RequireAuth>} />
              <Route path="/teacher-studio/settings" element={<RequireAuth role={["teacher","admin","super_admin"]}><TeacherStudioSettings /></RequireAuth>} />
              <Route path="/solo-student" element={<RequireAuth><SoloStudentDashboard /></RequireAuth>} />
              <Route path="/solo-student/settings" element={<RequireAuth><SoloStudentSettings /></RequireAuth>} />
              <Route path="/solo-student/path" element={<RequireAuth><SoloStudentDashboard /></RequireAuth>} />
              <Route path="/solo-student/kapitel" element={<RequireAuth><Kapitel /></RequireAuth>} />
              <Route path="/solo-student/wortschatz" element={<RequireAuth><Wortschatz /></RequireAuth>} />
              <Route path="/solo-student/flashcards" element={<RequireAuth><WortschatzFlashcards /></RequireAuth>} />
              <Route path="/solo-student/exams" element={<RequireAuth><StudentHomework /></RequireAuth>} />
              <Route path="/solo-student/certificates" element={<RequireAuth><Certificates /></RequireAuth>} />
              <Route path="/student" element={<RequireAuth><StudentDashboard /></RequireAuth>} />
              <Route path="/student/exam/:id" element={<RequireAuth><ExamRunner /></RequireAuth>} />
              <Route path="/student/result/:id" element={<RequireAuth><StudentExamResult /></RequireAuth>} />

              {/* Parent area */}
              <Route path="/parent" element={<RequireAuth role={["parent","admin","super_admin"]}><ParentDashboard /></RequireAuth>} />
              <Route path="/parent/children" element={<RequireAuth role={["parent","admin","super_admin"]}><ParentChildren /></RequireAuth>} />
              <Route path="/parent/attendance" element={<RequireAuth role={["parent","admin","super_admin"]}><RolePlaceholder title="Présence" subtitle="Suivi de la présence de votre enfant" parentHref="/parent" parentLabel="Tableau de bord parent" /></RequireAuth>} />
              <Route path="/parent/homework" element={<RequireAuth role={["parent","admin","super_admin"]}><RolePlaceholder title="Devoirs" subtitle="Devoirs en cours et corrigés" parentHref="/parent" /></RequireAuth>} />
              <Route path="/parent/results" element={<RequireAuth role={["parent","admin","super_admin"]}><RolePlaceholder title="Résultats" subtitle="Notes et progression" parentHref="/parent" /></RequireAuth>} />
              <Route path="/parent/certificates" element={<RequireAuth role={["parent","admin","super_admin"]}><RolePlaceholder title="Certificats" subtitle="Certificats obtenus" parentHref="/parent" /></RequireAuth>} />
              <Route path="/parent/messages" element={<RequireAuth role={["parent","admin","super_admin"]}><Messages /></RequireAuth>} />
              <Route path="/parent/calendar" element={<RequireAuth role={["parent","admin","super_admin"]}><CalendarPage /></RequireAuth>} />
              <Route path="/parent/announcements" element={<RequireAuth role={["parent","admin","super_admin"]}><Announcements /></RequireAuth>} />

              {/* Teacher area */}
              <Route path="/teacher" element={<RequireAuth role={["teacher","admin"]}><TeacherDashboard /></RequireAuth>} />
              <Route path="/teacher/bank" element={<RequireAuth role={["teacher","admin"]}><QuestionBank /></RequireAuth>} />
              <Route path="/teacher/assignments" element={<RequireAuth role={["teacher","admin"]}><Assignments /></RequireAuth>} />
              <Route path="/teacher/assignments/:id" element={<RequireAuth role={["teacher","admin"]}><AssignmentReview /></RequireAuth>} />
              <Route path="/teacher/class/:id" element={<RequireAuth role={["teacher","admin"]}><ClassDetail /></RequireAuth>} />
              <Route path="/teacher/import" element={<RequireAuth role={["teacher","admin"]}><PdfImport /></RequireAuth>} />
              <Route path="/teacher/stats" element={<RequireAuth role={["teacher","admin"]}><TeacherStats /></RequireAuth>} />
              <Route path="/teacher/reports" element={<RequireAuth role={["teacher","admin"]}><Reports /></RequireAuth>} />
              <Route path="/teacher/homework" element={<RequireAuth role={["teacher","admin"]}><TeacherHomework /></RequireAuth>} />
              <Route path="/teacher/classes" element={<RequireAuth role={["teacher","admin"]}><TeacherDashboard /></RequireAuth>} />
              <Route path="/teacher/attendance" element={<RequireAuth role={["teacher","admin"]}><RolePlaceholder title="Présence" subtitle="Prendre la présence de vos classes" parentHref="/teacher" parentLabel="Espace professeur" /></RequireAuth>} />
              <Route path="/teacher/exams" element={<RequireAuth role={["teacher","admin"]}><Assignments /></RequireAuth>} />
              <Route path="/teacher/messages" element={<RequireAuth role={["teacher","admin"]}><Messages /></RequireAuth>} />
              <Route path="/teacher/calendar" element={<RequireAuth role={["teacher","admin"]}><CalendarPage /></RequireAuth>} />
              <Route path="/student/homework" element={<RequireAuth><StudentHomework /></RequireAuth>} />
              <Route path="/student/path" element={<RequireAuth><StudentDashboard /></RequireAuth>} />
              <Route path="/student/courses" element={<RequireAuth><Kapitel /></RequireAuth>} />
              <Route path="/student/revisions" element={<RequireAuth><RolePlaceholder title="Mes révisions" subtitle="Révisions personnalisées" parentHref="/student" parentLabel="Mon espace" /></RequireAuth>} />
              <Route path="/student/wortschatz" element={<RequireAuth><Wortschatz /></RequireAuth>} />
              <Route path="/student/flashcards" element={<RequireAuth><WortschatzFlashcards /></RequireAuth>} />
              <Route path="/student/oral" element={<RequireAuth><RolePlaceholder title="Oral" subtitle="Exercices de prononciation et expression orale" parentHref="/student" /></RequireAuth>} />
              <Route path="/student/certificates" element={<RequireAuth><RolePlaceholder title="Mes certificats" subtitle="Vos certificats obtenus" parentHref="/student" /></RequireAuth>} />
              <Route path="/student/messages" element={<RequireAuth><Messages /></RequireAuth>} />
              <Route path="/student/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
              <Route path="/student/profile" element={<RequireAuth><Settings /></RequireAuth>} />

              {/* Shared modules */}
              <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
              <Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
              <Route path="/announcements" element={<RequireAuth><Announcements /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              <Route path="/wortschatz" element={<RequireAuth><Wortschatz /></RequireAuth>} />
              <Route path="/wortschatz/flashcards" element={<RequireAuth><WortschatzFlashcards /></RequireAuth>} />
              <Route path="/kapitel" element={<RequireAuth><Kapitel /></RequireAuth>} />
              <Route path="/kapitel/:level/:slug" element={<RequireAuth><KapitelDetail /></RequireAuth>} />
              <Route path="/adaptive" element={<RequireAuth><Adaptive /></RequireAuth>} />
              <Route path="/forum" element={<RequireAuth><Forum /></RequireAuth>} />
              <Route path="/forum/:id" element={<RequireAuth><ForumTopic /></RequireAuth>} />
              <Route path="/challenges" element={<RequireAuth><Challenges /></RequireAuth>} />
              <Route path="/live" element={<RequireAuth><Live /></RequireAuth>} />
              <Route path="/live/:code" element={<RequireAuth><LiveRoom /></RequireAuth>} />
              <Route path="/avatar" element={<RequireAuth><Avatar /></RequireAuth>} />
              <Route path="/voice-coach" element={<RequireAuth><VoiceCoach /></RequireAuth>} />

              {/* Admin */}
              <Route path="/admin" element={<RequireAuth role={["admin","school_admin","super_admin"]}><AdminPage /></RequireAuth>} />
              <Route path="/admin/school" element={<RequireAuth role={["admin","school_admin","super_admin"]}><SchoolAdminPage /></RequireAuth>} />
              <Route path="/admin/certificates" element={<RequireAuth role={["teacher","admin"]}><Certificates /></RequireAuth>} />
              <Route path="/admin/audit" element={<RequireAuth role={["admin","school_admin","super_admin"]}><AuditLogs /></RequireAuth>} />

              {/* School Admin (alias structuré /school-admin/*) */}
              <Route path="/school-admin" element={<RequireAuth role={["admin","super_admin","school_admin"]}><SchoolAdminPage /></RequireAuth>} />
              <Route path="/school-admin/classes" element={<RequireAuth role={["admin","super_admin","school_admin"]}><SchoolAdminPage /></RequireAuth>} />
              <Route path="/school-admin/classes/:classId" element={<RequireAuth role={["admin","super_admin","school_admin"]}><SchoolClassDetail /></RequireAuth>} />
              <Route path="/school-admin/teachers" element={<RequireAuth role={["admin","super_admin","school_admin"]}><AdminPage /></RequireAuth>} />
              <Route path="/school-admin/students" element={<RequireAuth role={["admin","super_admin","school_admin"]}><AdminPage /></RequireAuth>} />
              <Route path="/school-admin/approvals" element={<RequireAuth role={["admin","super_admin","school_admin"]}><AdminPage /></RequireAuth>} />
              <Route path="/school-admin/academic-years" element={<RequireAuth role={["admin","super_admin","school_admin"]}><RolePlaceholder title="Années scolaires" subtitle="Organisation des années académiques" parentHref="/school-admin" parentLabel="Admin école" /></RequireAuth>} />
              <Route path="/school-admin/sessions" element={<RequireAuth role={["admin","super_admin","school_admin"]}><RolePlaceholder title="Sessions" subtitle="Sessions de l'école (été, intensif, semestre…)" parentHref="/school-admin" /></RequireAuth>} />
              <Route path="/school-admin/enrollments" element={<RequireAuth role={["admin","super_admin","school_admin"]}><RolePlaceholder title="Inscriptions" subtitle="Demandes d'inscription et affectations" parentHref="/school-admin" /></RequireAuth>} />
              <Route path="/school-admin/attendance" element={<RequireAuth role={["admin","super_admin","school_admin"]}><RolePlaceholder title="Présence" subtitle="Suivi de la présence par classe" parentHref="/school-admin" /></RequireAuth>} />
              <Route path="/school-admin/homework" element={<RequireAuth role={["admin","super_admin","school_admin"]}><TeacherHomework /></RequireAuth>} />
              <Route path="/school-admin/exams" element={<RequireAuth role={["admin","super_admin","school_admin"]}><Assignments /></RequireAuth>} />
              <Route path="/school-admin/certificates" element={<RequireAuth role={["admin","super_admin","school_admin"]}><Certificates /></RequireAuth>} />
              <Route path="/school-admin/reports" element={<RequireAuth role={["admin","super_admin","school_admin"]}><Reports /></RequireAuth>} />
              <Route path="/school-admin/analytics" element={<RequireAuth role={["admin","super_admin","school_admin"]}><SchoolAnalytics /></RequireAuth>} />
              <Route path="/school-admin/settings" element={<RequireAuth role={["admin","super_admin","school_admin"]}><RolePlaceholder title="Paramètres école" subtitle="Configuration générale de l'école" parentHref="/school-admin" /></RequireAuth>} />
              <Route path="/school-admin/rules" element={<RequireAuth role={["admin","super_admin","school_admin"]}><RolePlaceholder title="Règles école" subtitle="Règles d'absence, certificat, promotion…" parentHref="/school-admin" /></RequireAuth>} />

              {/* Direction pédagogique */}
              <Route path="/academic" element={<RequireAuth role={["academic_director","pedagogical_coordinator","admin","super_admin"]}><AcademicLayout /></RequireAuth>}>
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
            <AIAvatar />
            </ActiveSchoolProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
