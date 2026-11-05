import React from 'react';
import { createPortal } from 'react-dom';
import { useApp } from './context/AppContext';
import { useTranslation } from './i18n/LanguageContext';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import MobileBottomNav from './components/common/MobileBottomNav';
import MachineModal from './components/common/MachineModal';
import AddMachineModal from './components/common/AddMachineModal';
import DataManagerModal from './components/common/DataManagerModal';
import WhatsAppConfigModal from './components/common/WhatsAppConfigModal';
import WhatsAppShareModal from './components/common/WhatsAppShareModal';
import FloatingWhatsApp from './components/common/FloatingWhatsApp';
import Toast from './components/common/Toast';
import LoginScreen from './components/auth/LoginScreen';

// Views
import DashboardView from './components/views/DashboardView';
import SupervisorFloor from './components/supervisor/SupervisorFloor';
import OperatorConsole from './components/operator/OperatorConsole';
import MachinesView from './components/views/MachinesView';
import ControlView from './components/views/ControlView';
import ProductionView from './components/views/ProductionView';
import AlarmsView from './components/views/AlarmsView';
import WorkersView from './components/views/WorkersView';
import RawMaterialView from './components/views/RawMaterialView';
import SalesView from './components/views/SalesView';
import AnalyticsView from './components/views/AnalyticsView';
import UsersView from './components/views/UsersView';
import RollsView from './components/views/RollsView';
import PublicRollPage from './components/rolls/PublicRollPage';
import ScanModal from './components/scanner/ScanModal';
import RollDetailModal from './components/rolls/RollDetailModal';
import RollQrLabel from './components/rolls/RollQrLabel';
import { useHardwareScanner } from './hooks/useHardwareScanner';
import { Clock } from 'lucide-react';

// Role-Based Access Control (RBAC) Tab Whitelists
const ROLE_ALLOWED_TABS = {
  Admin: ['dashboard', 'machines', 'control', 'production', 'alarms', 'workers', 'rawmaterial', 'sales', 'analytics', 'users', 'rolls'],
  Supervisor: ['supervisor-floor', 'machines', 'production', 'alarms', 'workers', 'rawmaterial', 'rolls'],
  Operator: ['operator-console', 'machines', 'production', 'alarms']
};

const ROLE_DEFAULT_TAB = {
  Admin: 'dashboard',
  Supervisor: 'supervisor-floor',
  Operator: 'operator-console'
};

export default function App() {
  const {
    isAuthenticated,
    isAuthLoading,
    activeTab,
    setActiveTab,
    userRole,
    idleWarning,
    stayLoggedIn,
    logout,
    isScanModalOpen,
    setIsScanModalOpen,
    inspectRollCode,
    setInspectRollCode,
    activeLabelRoll,
    setActiveLabelRoll
  } = useApp();
  const { t } = useTranslation();
  const [forceLogin, setForceLogin] = React.useState(false);

  // Extract roll code from search query (?roll=...), hash (#roll=...), or path (/roll/...)
  const getUrlRollCode = () => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get('roll')) return params.get('roll');
    if (window.location.hash) {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const hashParams = new URLSearchParams(hash);
      if (hashParams.get('roll')) return hashParams.get('roll');
      if (hash.startsWith('roll=')) return hash.slice(5);
    }
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2 && (pathParts[0] === 'roll' || pathParts[0] === 'rolls')) {
      return pathParts[1];
    }
    return null;
  };

  const urlRollCode = getUrlRollCode();

  // Global hardware scanner listener
  useHardwareScanner((code) => {
    setInspectRollCode(code);
  });

  // Deep linking when authenticated: open roll detail and clean URL
  React.useEffect(() => {
    if (urlRollCode && isAuthenticated) {
      setInspectRollCode(urlRollCode);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [urlRollCode, isAuthenticated, setInspectRollCode]);

  const allowedTabs = ROLE_ALLOWED_TABS[userRole] || ROLE_ALLOWED_TABS.Operator;
  const isTabAllowed = allowedTabs.includes(activeTab);

  // Auto-redirect if tab is not permitted for the user's role
  React.useEffect(() => {
    if (isAuthenticated && !allowedTabs.includes(activeTab)) {
      setActiveTab(ROLE_DEFAULT_TAB[userRole] || 'operator-console');
    }
  }, [isAuthenticated, activeTab, userRole, allowedTabs, setActiveTab]);

  // Public unauthenticated QR roll scan page - renders instantly without waiting for session restore
  if (urlRollCode && !isAuthenticated && !forceLogin) {
    return <PublicRollPage rollCode={urlRollCode} onGoToLogin={() => setForceLogin(true)} />;
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-display font-black text-2xl tracking-wider shadow-2xl shadow-sky-500/20 mb-4 animate-pulse">
          LM
        </div>
        <div className="text-xl font-bold font-display tracking-wide">{t('app.name')}</div>
        <div className="text-xs text-slate-400 font-mono tracking-widest uppercase mt-1">{t('common.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <FloatingWhatsApp />
      </>
    );
  }



  const renderActiveView = () => {
    const currentTab = isTabAllowed ? activeTab : (ROLE_DEFAULT_TAB[userRole] || 'operator-console');

    switch (currentTab) {
      case 'dashboard':
        return userRole === 'Admin' ? <DashboardView /> : <SupervisorFloor />;
      case 'supervisor-floor':
        return (userRole === 'Admin' || userRole === 'Supervisor') ? <SupervisorFloor /> : <OperatorConsole />;
      case 'operator-console':
        return <OperatorConsole />;
      case 'machines':
        return <MachinesView />;
      case 'control':
        return userRole === 'Admin' ? <ControlView /> : <SupervisorFloor />;
      case 'production':
        return <ProductionView />;
      case 'alarms':
        return <AlarmsView />;
      case 'workers':
        return (userRole === 'Admin' || userRole === 'Supervisor') ? <WorkersView /> : <OperatorConsole />;
      case 'rawmaterial':
        return (userRole === 'Admin' || userRole === 'Supervisor') ? <RawMaterialView /> : <OperatorConsole />;
      case 'sales':
        return userRole === 'Admin' ? <SalesView /> : <SupervisorFloor />;
      case 'analytics':
        return userRole === 'Admin' ? <AnalyticsView /> : <SupervisorFloor />;
      case 'users':
        return userRole === 'Admin' ? <UsersView /> : <DashboardView />;
      case 'rolls':
        return <RollsView onOpenScan={() => setIsScanModalOpen(true)} />;
      default:
        return userRole === 'Admin' ? <DashboardView /> : userRole === 'Supervisor' ? <SupervisorFloor /> : <OperatorConsole />;
    }
  };

  return (
    <div className="h-screen h-[100dvh] max-h-screen overflow-hidden bg-slate-50 flex font-sans selection:bg-sky-500 selection:text-white">
      {/* Desktop Sidebar: Full height on left, flush with screen top */}
      <Sidebar />

      {/* Right Column: Precision Top Navigation Bar + Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        <Header />

        <main className="flex-1 h-full overflow-y-auto overscroll-y-auto p-3 sm:p-5 md:p-8 pb-36 md:pb-36 bg-slate-50 scroll-smooth">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Sticky Navigation */}
      <MobileBottomNav />

      {/* Global Interactive Modals */}
      <MachineModal />
      <AddMachineModal />
      <DataManagerModal />
      <WhatsAppConfigModal />
      <WhatsAppShareModal />
      <FloatingWhatsApp />

      {/* Roll QR Scanner & Detail Modals */}
      {isScanModalOpen && (
        <ScanModal
          isOpen={isScanModalOpen}
          onClose={() => setIsScanModalOpen(false)}
          onScanSuccess={(code) => {
            setIsScanModalOpen(false);
            setInspectRollCode(code);
          }}
        />
      )}
      {inspectRollCode && (
        <RollDetailModal
          rollCode={inspectRollCode}
          onClose={() => setInspectRollCode(null)}
        />
      )}
      {activeLabelRoll && (
        <RollQrLabel
          roll={activeLabelRoll}
          onClose={() => setActiveLabelRoll(null)}
        />
      )}

      {/* Idle Timeout Warning Modal */}
      {idleWarning?.show && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl text-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-800">
                Inactivity Warning
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t('app.idleTimeoutWarning', { countdown: idleWarning.countdown })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={logout}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                {t('auth.signOut')}
              </button>
              <button
                onClick={stayLoggedIn}
                className="flex-1 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                {t('app.stayLoggedIn')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Global Toast Notifications */}
      <Toast />
    </div>
  );
}
