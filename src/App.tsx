import React, { useState } from 'react';
import { AuthProvider, useAuth, PortalType } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './locales/LanguageContext';

// Common Components
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { QRModal } from './components/common/QRModal';
import { GoogleMeetModal } from './components/common/GoogleMeetModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { SupportModal } from './components/common/SupportModal';
import { OTPLoginModal } from './components/auth/OTPLoginModal';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLandingPage } from './components/landing/MainLandingPage';

// Candidate Portal
import { CandidateNavigation, CandidateTab } from './components/candidate/CandidateNavigation';
import { CandidateDashboard } from './components/candidate/CandidateDashboard';
import { CandidateHome } from './components/candidate/CandidateHome';
import { CandidateJobs } from './components/candidate/CandidateJobs';
import { CandidateLearning } from './components/candidate/CandidateLearning';
import { CandidateApplications } from './components/candidate/CandidateApplications';
import { CandidateProfileView } from './components/candidate/CandidateProfile';
import { AIResumeBuilder } from './components/candidate/AIResumeBuilder';
import { GovernmentJobs } from './components/candidate/GovernmentJobs';

// Employer Portal
import { EmployerLoginGateway } from './components/employer/EmployerLoginGateway';
import { EmployerNavigation, EmployerTab } from './components/employer/EmployerNavigation';
import { EmployerDashboard } from './components/employer/EmployerDashboard';
import { EmployerPostJob } from './components/employer/EmployerPostJob';
import { EmployerJobs } from './components/employer/EmployerJobs';
import { EmployerApplicants } from './components/employer/EmployerApplicants';
import { EmployerTalentSearch } from './components/employer/EmployerTalentSearch';
import { EmployerProfileView } from './components/employer/EmployerProfile';

// Admin Portal
import { AdminNavigation, AdminTab } from './components/admin/AdminNavigation';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminEmployers } from './components/admin/AdminEmployers';
import { AdminEmployerVerification } from './components/admin/AdminEmployerVerification';
import { AdminJobs } from './components/admin/AdminJobs';
import { AdminJobCategories } from './components/admin/AdminJobCategories';
import { AdminGovtJobs } from './components/admin/AdminGovtJobs';
import { AdminCourses } from './components/admin/AdminCourses';
import { AdminCertificates } from './components/admin/AdminCertificates';
import { AdminMonetization } from './components/admin/AdminMonetization';
import { AdminSupport } from './components/admin/AdminSupport';
import { AdminBroadcast } from './components/admin/AdminBroadcast';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs';
import { AdminLoginGateway } from './components/admin/AdminLoginGateway';
import { AdminOTPSettings } from './components/admin/AdminOTPSettings';
import { AdminDomainSettings } from './components/admin/AdminDomainSettings';
import { SplashScreen } from './components/common/SplashScreen';

import { JobPost, Course, Interview } from './types';

const MainApp: React.FC = () => {
  const { activePortal, setActivePortal, isAuthenticated, user } = useAuth();
  const { language } = useLanguage();

  // Navigation states for respective portals
  const [candidateTab, setCandidateTab] = useState<CandidateTab>('dashboard');
  const [employerTab, setEmployerTab] = useState<EmployerTab>('dashboard');
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');

  const [showSplash, setShowSplash] = useState(true);

  // Drill-down selection states
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [filterJobIdForApplicants, setFilterJobIdForApplicants] = useState<string | null>(null);

  // Global Modals State
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginDefaultRole, setLoginDefaultRole] = useState<'candidate' | 'employer' | 'admin'>('candidate');
  const [isQROpen, setIsQROpen] = useState(false);
  const [initialQRVerifyCode, setInitialQRVerifyCode] = useState('');
  const [isMeetOpen, setIsMeetOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const handleOpenLoginForRole = (role: 'candidate' | 'employer' | 'admin' = 'candidate') => {
    setLoginDefaultRole(role);
    setIsLoginOpen(true);
  };

  const handleOpenQRVerify = (code: string = '') => {
    setInitialQRVerifyCode(code);
    setIsQROpen(true);
  };

  const handleOpenGoogleMeet = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsMeetOpen(true);
  };

  const handleCandidateSelectJob = (job: JobPost) => {
    setSelectedJob(job);
    setCandidateTab('jobs');
  };

  const handleCandidateSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setCandidateTab('learning');
  };

  const handleEmployerSelectJobApplicants = (jobId: string) => {
    setFilterJobIdForApplicants(jobId);
    setEmployerTab('applicants');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Startup Splash Screen */}
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}
      
      {/* Universal Header */}
      <Header
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenQRVerify={() => handleOpenQRVerify('')}
        onOpenLogin={() => handleOpenLoginForRole(activePortal)}
        onOpenSupport={() => setIsSupportOpen(true)}
      />

      {/* Role / Portal Specific Navbars */}
      {activePortal === 'candidate' && (
        <CandidateNavigation
          activeTab={candidateTab}
          setActiveTab={setCandidateTab}
        />
      )}

      {activePortal === 'employer' && isAuthenticated && user?.role === 'employer' && (
        <EmployerNavigation
          activeTab={employerTab}
          setActiveTab={setEmployerTab}
        />
      )}

      {activePortal === 'admin' && isAuthenticated && user?.role === 'admin' && (
        <AdminNavigation
          activeTab={adminTab}
          setActiveTab={setAdminTab}
        />
      )}

      {/* Main View Port Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* ========================================================================= */}
        {/* MAIN FLAGSHIP LANDING PAGE (karmetra.in) */}
        {/* ========================================================================= */}
        {activePortal === 'main' && (
          <MainLandingPage
            onOpenQRVerify={handleOpenQRVerify}
            onOpenSupport={() => setIsSupportOpen(true)}
            onSelectCandidateApp={() => setActivePortal('candidate')}
            onSelectRecruiterApp={() => setActivePortal('employer')}
          />
        )}

        {/* ========================================================================= */}
        {/* CANDIDATE PORTAL (job.karmetra.in) */}
        {/* ========================================================================= */}
        {activePortal === 'candidate' && (
          <ProtectedRoute requiredPortal="candidate">
            <div>
              {candidateTab === 'dashboard' && (
                <CandidateDashboard
                  onNavigate={setCandidateTab}
                  onSelectJob={handleCandidateSelectJob}
                  onSelectCourse={handleCandidateSelectCourse}
                  onJoinInterview={handleOpenGoogleMeet}
                  onOpenLogin={() => handleOpenLoginForRole('candidate')}
                />
              )}

              {candidateTab === 'home' && (
                <CandidateHome
                  onNavigate={setCandidateTab}
                  onSelectJob={handleCandidateSelectJob}
                  onSelectCourse={handleCandidateSelectCourse}
                  onOpenLogin={() => handleOpenLoginForRole('candidate')}
                />
              )}

              {candidateTab === 'jobs' && (
                <CandidateJobs
                  onOpenLogin={() => handleOpenLoginForRole('candidate')}
                  selectedJobInit={selectedJob}
                />
              )}

              {candidateTab === 'govt-jobs' && (
                <GovernmentJobs />
              )}

              {candidateTab === 'learning' && (
                <CandidateLearning
                  onOpenLogin={() => handleOpenLoginForRole('candidate')}
                  selectedCourseInit={selectedCourse}
                  onOpenVerifyQR={handleOpenQRVerify}
                />
              )}

              {candidateTab === 'applications' && (
                <CandidateApplications
                  onOpenLogin={() => handleOpenLoginForRole('candidate')}
                  onJoinInterview={handleOpenGoogleMeet}
                  onNavigateJobs={() => setCandidateTab('jobs')}
                />
              )}

              {candidateTab === 'resume' && (
                <AIResumeBuilder
                  onOpenLogin={() => handleOpenLoginForRole('candidate')}
                />
              )}

              {candidateTab === 'profile' && (
                <CandidateProfileView
                  onOpenVerifyQR={handleOpenQRVerify}
                  onOpenResumeBuilder={() => setCandidateTab('resume')}
                />
              )}
            </div>
          </ProtectedRoute>
        )}

        {/* ========================================================================= */}
        {/* EMPLOYER PORTAL (recruiter.karmetra.in) */}
        {/* ========================================================================= */}
        {activePortal === 'employer' && (
          <ProtectedRoute requiredPortal="employer" allowedRoles={['employer']}>
            <div>
              {!isAuthenticated || user?.role !== 'employer' ? (
                <EmployerLoginGateway onOpenLogin={() => handleOpenLoginForRole('employer')} />
              ) : (
                <>
                  {employerTab === 'dashboard' && (
                    <EmployerDashboard
                      onNavigate={setEmployerTab}
                      onOpenLogin={() => handleOpenLoginForRole('employer')}
                    />
                  )}

                  {employerTab === 'post-job' && (
                    <EmployerPostJob
                      onSuccess={() => setEmployerTab('jobs')}
                    />
                  )}

                  {employerTab === 'jobs' && (
                    <EmployerJobs
                      onPostNewJob={() => setEmployerTab('post-job')}
                      onViewApplicantsForJob={handleEmployerSelectJobApplicants}
                    />
                  )}

                  {employerTab === 'applicants' && (
                    <EmployerApplicants
                      initialJobFilter={filterJobIdForApplicants}
                      onLaunchInterviewModal={handleOpenGoogleMeet}
                    />
                  )}

                  {employerTab === 'talent-search' && (
                    <EmployerTalentSearch
                      onScheduleInterview={() => setEmployerTab('applicants')}
                    />
                  )}

                  {employerTab === 'profile' && (
                    <EmployerProfileView />
                  )}
                </>
              )}
            </div>
          </ProtectedRoute>
        )}

        {/* ========================================================================= */}
        {/* ADMIN PORTAL (admin.karmetra.in) */}
        {/* ========================================================================= */}
        {activePortal === 'admin' && (
          <ProtectedRoute requiredPortal="admin" allowedRoles={['admin']}>
            <div>
              {!isAuthenticated || user?.role !== 'admin' ? (
                <AdminLoginGateway />
              ) : (
                <>
                  {adminTab === 'overview' && (
                    <AdminDashboard
                      onNavigate={setAdminTab}
                    />
                  )}

                  {(adminTab === 'employers' || adminTab === 'verification') && (
                    <AdminEmployerVerification />
                  )}

                  {adminTab === 'jobs' && (
                    <AdminJobs />
                  )}

                  {adminTab === 'categories' && (
                    <AdminJobCategories />
                  )}

                  {adminTab === 'govt-jobs' && (
                    <AdminGovtJobs />
                  )}

                  {adminTab === 'courses' && (
                    <AdminCourses />
                  )}

                  {adminTab === 'certificates' && (
                    <AdminCertificates />
                  )}

                  {adminTab === 'monetization' && (
                    <AdminMonetization />
                  )}

                  {adminTab === 'support' && (
                    <AdminSupport />
                  )}

                  {adminTab === 'broadcast' && (
                    <AdminBroadcast />
                  )}

                  {adminTab === 'audit' && (
                    <AdminAuditLogs />
                  )}

                  {adminTab === 'domains' && (
                    <AdminDomainSettings />
                  )}

                  {adminTab === 'settings' && (
                    <AdminOTPSettings />
                  )}
                </>
              )}
            </div>
          </ProtectedRoute>
        )}
      </main>

      {/* Enterprise Production Footer */}
      <Footer
        onOpenSupport={() => setIsSupportOpen(true)}
        onOpenVerifyCert={handleOpenQRVerify}
      />

      {/* Global Modals */}
      <OTPLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        defaultRole={loginDefaultRole}
      />

      <QRModal
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
        initialCode={initialQRVerifyCode}
      />

      <GoogleMeetModal
        isOpen={isMeetOpen}
        onClose={() => setIsMeetOpen(false)}
        interview={selectedInterview}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateTab={(tab) => {
          if (activePortal === 'candidate') {
            setCandidateTab(tab as CandidateTab);
          }
        }}
      />

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
