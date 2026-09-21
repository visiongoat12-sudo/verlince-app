import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  DealAgreement, 
  ChatMessage, 
  Channel, 
  WorkDelivery,
  UserRole,
  ViewOnceMedia
} from './types';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthOnboardingModal } from './components/AuthOnboardingModal';
import { VakraCompanion } from './components/VakraCompanion';
import { DealModal } from './components/DealModal';
import { AgreementSidebar } from './components/AgreementSidebar';
import { ChatSection } from './components/ChatSection';
import { ProfileVerificationDashboard } from './components/ProfileVerificationDashboard';
import { MarketplaceHome } from './components/MarketplaceHome';
import { VerilanceLogo } from './components/VerilanceLogo';
import { 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Wallet, 
  UserCheck, 
  Bell, 
  Layers, 
  Menu, 
  X,
  FileText,
  AlertCircle,
  MessageSquare,
  User,
  Store,
  PlusCircle,
  Handshake,
  Search,
  LogOut,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { fetchUserFromDB, saveUserToDB } from './lib/firebase';
import { 
  initializeCleanSlateAuth, 
  clearAllStorageData, 
  CLEAN_SLATE_USER, 
  executeFullDatabaseWipe 
} from './lib/dataReset';

export default function App() {
  // Check and enforce clean-slate auth logic on startup
  const initialAuth = initializeCleanSlateAuth();

  // Navigation View State: 'marketplace' (Default Upwork-inspired layout) vs 'profile' vs 'escrow'
  const [currentView, setCurrentView] = useState<'marketplace' | 'profile' | 'escrow'>('marketplace');

  // Authentication & Onboarding Gate State (Clean Slate: unauthenticated by default)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuth.isAuthenticated);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(initialAuth.isAuthModalOpen);

  // 1. Current User State (Zero balances, clean fields, no mock persona)
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialAuth.initialUser);

  // 2. Modals State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Deal Form Pre-fills (starts clean)
  const [dealInitialValues, setDealInitialValues] = useState<{
    serviceType?: string;
    amount?: number;
    deadline?: string;
    description?: string;
    senderRole?: 'client' | 'freelancer';
  }>({
    serviceType: '',
    amount: 0,
    deadline: '',
    description: '',
    senderRole: 'client',
  });

  // 3. Channels List (Clean Slate: 0 conversations initially)
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  // 4. Chat Messages Feed (Clean Slate: 0 messages initially)
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 5. Active Deal State (Clean Slate: null / 0 active deals initially)
  const [activeDeal, setActiveDeal] = useState<DealAgreement | null>(null);

  // 6. Work Delivery State (Clean Slate: null initially)
  const [workDelivery, setWorkDelivery] = useState<WorkDelivery | null>(null);

  // Sync real profile from Firestore on load & trigger full blank-slate wipe if uninitiated
  useEffect(() => {
    const isWipedV5 = localStorage.getItem('verilance_wipe_v5_clean') === 'true';
    if (!isWipedV5) {
      console.log('[App] Initializing fresh database blank slate (0 users, 0 deals, 0 profiles)...');
      executeFullDatabaseWipe().then(() => {
        localStorage.setItem('verilance_wipe_v5_clean', 'true');
        setCurrentUser(CLEAN_SLATE_USER);
        setIsAuthenticated(false);
        setIsAuthModalOpen(true);
        setActiveDeal(null);
        setWorkDelivery(null);
        setChannels([]);
        setMessages([]);
        setActiveChannel(null);
      }).catch((err) => {
        console.warn('[App] Database wipe notice:', err);
      });
      return;
    }

    if (currentUser?.id && currentUser.id !== 'clean-slate-user') {
      fetchUserFromDB(currentUser.id)
        .then((liveDoc) => {
          if (liveDoc) {
            setCurrentUser(liveDoc);
            try {
              localStorage.setItem('verilance_auth_user', JSON.stringify(liveDoc));
            } catch (e) {
              console.warn(e);
            }
          }
        })
        .catch((err) => {
          console.warn('[App] Realtime user fetch notice:', err);
        });
    }
  }, []);

  // Auth Handlers
  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setCurrentUser(authenticatedUser);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    saveUserToDB(authenticatedUser).catch(err => {
      console.error('[App] Failed to save user on auth success:', err);
    });
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      const merged: UserProfile = { ...prev, ...updated };
      try {
        localStorage.setItem('verilance_auth_user', JSON.stringify(merged));
      } catch (e) {
        console.warn('LocalStorage save warning:', e);
      }
      saveUserToDB(merged).catch(err => {
        console.error('[App] Failed to persist profile updates to Firestore:', err);
      });
      return merged;
    });
  };

  const handleSignOut = () => {
    clearAllStorageData();
    setCurrentUser(CLEAN_SLATE_USER);
    setIsAuthenticated(false);
    setIsAuthModalOpen(true);
  };

  // Complete Data Reset and Storage Cleanup
  const handleResetAppData = async () => {
    const confirmed = window.confirm(
      'Perform complete Database Wipe & Storage Reset?\n\nThis will purge all registered user accounts, active deals, creator listings, and chat channels to a 100% blank slate (0 users, 0 active deals, 0 profiles).'
    );
    if (!confirmed) return;

    await executeFullDatabaseWipe();
    setCurrentUser(CLEAN_SLATE_USER);
    setIsAuthenticated(false);
    setIsAuthModalOpen(true);
    setActiveDeal(null);
    setWorkDelivery(null);
    setChannels([]);
    setMessages([]);
    setActiveChannel(null);
    setCurrentView('marketplace');
    alert('Application database reset to blank slate (0 users, 0 active deals, 0 profiles).');
  };

  // Handlers
  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      text,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleSendViewOnceMedia = (media: ViewOnceMedia, caption?: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'view_once',
      text: caption,
      viewOnceMedia: media,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleExpireViewOnceMedia = (mediaId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.viewOnceMedia && msg.viewOnceMedia.id === mediaId) {
          return {
            ...msg,
            viewOnceMedia: {
              ...msg.viewOnceMedia,
              isExpired: true,
              url: '', // wipe raw media URL from state
            },
          };
        }
        return msg;
      })
    );
  };

  const handleToggleUserRole = () => {
    const nextRole: UserRole = currentUser.role === 'creator' ? 'editor' : 'creator';
    setCurrentUser((prev) => {
      const updated = {
        ...prev,
        role: nextRole,
      };
      try {
        localStorage.setItem('verilance_auth_user', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  // VAKRA Auto-Draft Trigger
  const handleVakraAutoDraft = (suggestedDeal: {
    serviceType: string;
    amount: number;
    deadline: string;
    description: string;
  }) => {
    setDealInitialValues({
      ...suggestedDeal,
      senderRole: currentUser.role === 'creator' ? 'client' : 'freelancer',
    });
    setIsDealModalOpen(true);
  };

  // VAKRA Alert Trigger in Chat
  const handleVakraScanAlert = (alertText: string) => {
    const alertMsg: ChatMessage = {
      id: `vakra-${Date.now()}`,
      senderId: 'vakra-ai',
      senderName: 'VAKRA Cyber Sentinel',
      senderRole: 'vakra',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'vakra_alert',
      text: alertText,
    };
    setMessages((prev) => [...prev, alertMsg]);
  };

  // Confirm Deal from Modal
  const handleConfirmDeal = (deal: DealAgreement) => {
    setActiveDeal(deal);
    setWorkDelivery(null); // Reset delivery state for new deal
    
    // Add system notification message to chat
    const dealSystemMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      senderId: 'trustway-system',
      senderName: 'Trustway Protocol',
      senderRole: 'system',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'deal_invite',
      text: `🤝 ESCROW LOCKED: ₹${deal.amount.toLocaleString('en-IN')} deposited for ${deal.serviceType}. 3% commission (₹${deal.commissionFee}) safely recorded. Deadline: ${deal.deadline}.`,
    };
    setMessages((prev) => [...prev, dealSystemMsg]);
  };

  // Submit Work (Freelancer role)
  const handleSubmitWork = () => {
    const now = new Date();
    const formattedDate = 'Sep 22 at 18:45 IST';
    const targetDeadline = activeDeal?.deadline || '25 September 2026';

    const delivery: WorkDelivery = {
      fileName: 'YouTube_Gadget_Teardown_v1_DraftCut.mp4',
      timestamp: now.toISOString(),
      formattedTime: formattedDate,
      deadlineComparison: '3 Days Before Deadline (On Time) ⚡',
      isOnTime: true,
      fileSize: '1.42 GB',
      resolution: '4K Ultra HD (3840x2160)',
      duration: '10:00 Min',
      watermarked: true,
      isApproved: false,
    };

    setWorkDelivery(delivery);

    if (activeDeal) {
      setActiveDeal((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'work_submitted',
          history: [
            ...prev.history,
            {
              id: `h-submit-${Date.now()}`,
              title: 'Watermarked Work Submitted 🎬',
              detail: `Editor uploaded draft cut (1.42 GB) with diagonal watermark security. Mapped against ${targetDeadline}.`,
              timestamp: 'Just now',
              type: 'submitted',
            },
          ],
        };
      });
    }

    // Add chat message
    const workMsg: ChatMessage = {
      id: `work-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      text: '🎬 I have submitted the draft cut through Trustway Watermarked Delivery! You can review the full 10-minute preview. Click "Approve & Release Funds" to unlock the clean 4K export.',
    };
    setMessages((prev) => [...prev, workMsg]);
  };

  // Approve & Release Funds (Client role)
  const handleApproveAndRelease = () => {
    if (!activeDeal) return;

    setActiveDeal((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'released',
        history: [
          ...prev.history,
          {
            id: `h-release-${Date.now()}`,
            title: 'Funds Released & Transferred ⚡',
            detail: `Client authorized release. ₹${prev.netPayout.toLocaleString('en-IN')} disbursed to Editor wallet. Watermark cleared.`,
            timestamp: 'Just now',
            type: 'released',
          },
        ],
      };
    });

    if (workDelivery) {
      setWorkDelivery((prev) => (prev ? { ...prev, isApproved: true, watermarked: false } : null));
    }

    // Update wallet
    setCurrentUser((prev) => ({
      ...prev,
      walletBalance: prev.walletBalance + (activeDeal?.netPayout || 1940),
    }));

    // Add chat notification
    const releaseMsg: ChatMessage = {
      id: `release-${Date.now()}`,
      senderId: 'trustway-system',
      senderName: 'Trustway Protocol',
      senderRole: 'system',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      text: `🎉 ESCROW SETTLED: ₹${activeDeal.netPayout.toLocaleString('en-IN')} has been transferred to the Editor! Watermark cleared and clean 4K Master ready for download.`,
    };
    setMessages((prev) => [...prev, releaseMsg]);
  };

  // Raise Dispute
  const handleRaiseDispute = (reason: string) => {
    if (!activeDeal) return;

    const caseId = `#DISP-${Math.floor(10000 + Math.random() * 90000)}`;

    setActiveDeal((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'disputed',
        dispute: {
          caseId,
          reason,
          openedAt: new Date().toISOString(),
          status: 'under_investigation',
        },
        history: [
          ...prev.history,
          {
            id: `h-disp-${Date.now()}`,
            title: 'Dispute Raised & Funds Frozen 🚨',
            detail: `Case ${caseId} opened: "${reason}". Payouts suspended pending Trustway mediator arbitration.`,
            timestamp: 'Just now',
            type: 'disputed',
          },
        ],
      };
    });

    const dispMsg: ChatMessage = {
      id: `disp-msg-${Date.now()}`,
      senderId: 'vakra-ai',
      senderName: 'VAKRA Cyber Sentinel',
      senderRole: 'vakra',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'vakra_alert',
      text: `🚨 ESCROW FROZEN: Case ${caseId} opened. Reason: "${reason}". Funds are securely locked in Trustway Multi-Sig while support investigates transcripts and delivery hashes.`,
    };
    setMessages((prev) => [...prev, dispMsg]);
  };

  // Resolve Dispute
  const handleResolveDispute = () => {
    if (!activeDeal) return;

    setActiveDeal((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: workDelivery ? 'work_submitted' : 'escrow_secured',
        dispute: undefined,
        history: [
          ...prev.history,
          {
            id: `h-res-${Date.now()}`,
            title: 'Dispute Resolved & Unfrozen 🤝',
            detail: 'Both parties agreed to terms. Normal escrow milestones restored.',
            timestamp: 'Just now',
            type: 'neutral',
          },
        ],
      };
    });

    const resMsg: ChatMessage = {
      id: `res-msg-${Date.now()}`,
      senderId: 'trustway-system',
      senderName: 'Trustway Protocol',
      senderRole: 'system',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      text: '🤝 Dispute unfreezed: Normal escrow protocol resumed. Freelancer and Client can proceed with revisions or release.',
    };
    setMessages((prev) => [...prev, resMsg]);
  };

  // 1. MANDATORY AUTHENTICATION GUARD
  // Make authentication (Sign-In/Sign-Up) strictly compulsory across ALL sections of the application.
  // Restrict unauthenticated users from accessing the Marketplace, Editor Profiles, Dashboard, Escrow Workspace, or Settings.
  // Automatically redirect any unauthenticated user immediately to the Login/Registration screen before rendering any content.
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#07090d] text-slate-100 flex flex-col justify-center items-center relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
        <AuthOnboardingModal
          isOpen={true}
          onAuthSuccess={handleAuthSuccess}
          currentUser={null}
          canDismiss={false}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07090d] text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. TOP APP HEADER BAR */}
      <header 
        id="app-header-bar"
        className="h-16 border-b border-white/10 bg-[#0a0d13]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shrink-0 z-30"
      >
        {/* Logo & Platform Identity */}
        <div 
          onClick={() => setCurrentView('marketplace')}
          className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
        >
          <VerilanceLogo size="md" />
        </div>

        {/* Center Navigation Switcher Tabs (Hidden on mobile; moved to bottom navigation bar for touch ergonomic design) */}
        <div className="hidden md:flex items-center gap-1.5 p-1 bg-[#131722] rounded-xl border border-white/10 shadow-inner">
          <button
            id="nav-tab-marketplace"
            onClick={() => setCurrentView('marketplace')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              currentView === 'marketplace'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-cyan-400" />
            <span>Marketplace</span>
          </button>

          <button
            id="nav-tab-profile-verification"
            onClick={() => setCurrentView('profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              currentView === 'profile'
                ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white border border-purple-500/50 shadow-md shadow-purple-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span>Profile & KYC</span>
            <span className="hidden md:inline-block text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-extrabold uppercase">
              Pro
            </span>
          </button>

          <button
            id="nav-tab-escrow-workspace"
            onClick={() => setCurrentView('escrow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              currentView === 'escrow'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
            <span>Escrow & Chat</span>
            <span className="hidden md:inline-block text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-extrabold uppercase">
              VAKRA
            </span>
          </button>
        </div>

        {/* Center / Right Control Badges */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Create Deal Quick Action Button */}
          <button
            id="header-create-deal-btn"
            onClick={() => setIsDealModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20"
          >
            <Handshake className="w-3.5 h-3.5" />
            <span>Post Deal</span>
          </button>

          {/* Active Role Indicator & Switcher */}
          <button
            id="header-role-toggle-pill"
            onClick={handleToggleUserRole}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
            title="Click to switch between Creator (Client) and Editor (Freelancer)"
          >
            <span className="text-[11px] text-slate-400 hidden sm:inline">Role:</span>
            <span className={`text-xs font-bold ${currentUser.role === 'creator' ? 'text-cyan-400' : 'text-teal-400'}`}>
              {currentUser.role === 'creator' ? '🎬 Creator' : '✂️ Editor'}
            </span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Premium Verification Badge Card / Indicator */}
          <button
            id="header-premium-badge-btn"
            onClick={() => setCurrentView('profile')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden lg:inline">Trust Shield:</span>
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-extrabold">
              {currentUser.hasVerifiedBadge ? '₹2,000 Pro' : 'Get Verified'}
            </span>
          </button>

          {/* Escrow Vault Balance */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131822] border border-white/10 text-xs">
            <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Escrow:</span>
            <span className="font-bold text-emerald-400">
              ₹{currentUser.walletBalance.toLocaleString('en-IN')}
            </span>
          </div>

          {/* User Account Pill & Sign Out / Switch Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            {isAuthenticated ? (
              <>
                <button
                  id="header-user-profile-menu-btn"
                  onClick={() => setCurrentView('profile')}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#141822] hover:bg-[#1a202d] border border-white/10 transition group"
                  title="View Profile & Security"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name || 'User'}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-cyan-500/40"
                  />
                  <div className="hidden md:flex flex-col text-left leading-none">
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                      {currentUser.name ? currentUser.name.split(' ')[0] : 'Member'}
                    </span>
                    <span className="text-[10px] text-cyan-400/80 font-mono">
                      @{currentUser.username || 'user'}
                    </span>
                  </div>
                </button>

                <button
                  id="header-auth-switch-btn"
                  onClick={handleSignOut}
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-500/15 hover:border-red-500/30 text-slate-400 hover:text-red-400 border border-white/10 text-xs transition flex items-center gap-1"
                  title="Sign Out / Switch Account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline text-[11px] font-medium">Log Out</span>
                </button>
              </>
            ) : (
              <button
                id="header-login-btn"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold text-xs hover:brightness-110 shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Complete Data Reset and Storage Cleanup Button */}
            <button
              id="header-reset-app-btn"
              onClick={handleResetAppData}
              className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/15 hover:border-amber-500/30 text-slate-400 hover:text-amber-400 border border-white/10 text-xs transition flex items-center gap-1"
              title="Data Reset & Storage Cleanup (Clean Slate)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden 2xl:inline text-[11px] font-medium">Reset Data</span>
            </button>
          </div>

          {/* Mobile Toggle for Agreement Sidebar (Only when in Escrow view) */}
          {currentView === 'escrow' && (
            <button
              id="mobile-sidebar-toggle-btn"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition"
              aria-label="Toggle Agreement Sidebar"
            >
              {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <FileText className="w-5 h-5 text-cyan-400" />}
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN APPLICATION WORKSPACE */}
      {currentView === 'marketplace' ? (
        /* UPWORK-INSPIRED FREELANCE MARKETPLACE INTERFACE */
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0B10] pb-20 md:pb-0">
          <MarketplaceHome
            onOpenDealModal={() => setIsDealModalOpen(true)}
            onOpenProfile={() => setCurrentView('profile')}
            onOpenChat={(talentName) => {
              if (talentName) {
                // If a talent was clicked, switch to active chat with them or create fresh conversation
                let targetChannel = channels.find(c => c.name.toLowerCase().includes(talentName.toLowerCase().split(' ')[0]));
                if (!targetChannel) {
                  targetChannel = {
                    id: `ch-${Date.now()}`,
                    name: talentName,
                    subtitle: 'Escrow Direct Channel',
                    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                    isGroup: false,
                    unreadCount: 0,
                    isOnline: true,
                    lastActive: 'Just now',
                  };
                  setChannels(prev => [targetChannel!, ...prev]);
                }
                setActiveChannel(targetChannel);
              }
              setCurrentView('escrow');
            }}
            currentUserRole={currentUser.role}
            onToggleRole={handleToggleUserRole}
          />
        </main>
      ) : currentView === 'profile' ? (
        /* USER PROFILE & VERIFICATION DASHBOARD */
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0B10] pb-20 md:pb-0">
          <ProfileVerificationDashboard 
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            onOpenAuthGate={handleSignOut}
            onOpenEditModal={() => setIsOnboardingOpen(true)}
            onResetData={handleResetAppData}
          />
        </main>
      ) : (
        /* ESCROW WORKSPACE & CHAT */
        <div className="flex-1 flex overflow-hidden relative pb-16 md:pb-0">
          {/* Center Workspace: Chat & VAKRA AI */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Embedded VAKRA Cyber Security AI Assistant Panel */}
            <div className="px-3 sm:px-4 pt-3 pb-1 bg-[#090c12]">
              <VakraCompanion
                onAutoDraftAgreement={handleVakraAutoDraft}
                onScanAlertTriggered={handleVakraScanAlert}
              />
            </div>

            {/* Chat Utility (Left channels + Main chat) */}
            <div className="flex-1 flex overflow-hidden">
              <ChatSection
                currentUser={currentUser}
                activeChannel={activeChannel}
                channels={channels}
                onSelectChannel={setActiveChannel}
                messages={messages}
                onSendMessage={handleSendMessage}
                onSendViewOnceMedia={handleSendViewOnceMedia}
                onExpireViewOnceMedia={handleExpireViewOnceMedia}
                onOpenDealModal={() => setIsDealModalOpen(true)}
                onSubmitWork={handleSubmitWork}
                onApproveAndRelease={handleApproveAndRelease}
                activeDeal={activeDeal}
                workDelivery={workDelivery}
                onToggleUserRole={handleToggleUserRole}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
              />
            </div>
          </div>

          {/* Desktop Right Sidebar: Active Digital Agreement & Escrow Protocol */}
          <div className="hidden lg:block h-full">
            <AgreementSidebar
              deal={activeDeal}
              currentUser={currentUser}
              onOpenCreateDeal={() => setIsDealModalOpen(true)}
              onSubmitWork={handleSubmitWork}
              onApproveAndRelease={handleApproveAndRelease}
              onRaiseDispute={handleRaiseDispute}
              onResolveDispute={handleResolveDispute}
              isWorkSubmitted={!!workDelivery}
            />
          </div>

          {/* Mobile Slide-over Drawer for Right Sidebar */}
          {isMobileSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-40 flex justify-end bg-black/80 backdrop-blur-sm">
              <div className="w-full max-w-md h-full bg-[#0c0f15] shadow-2xl relative flex flex-col">
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Escrow Agreement & Actions
                  </span>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <AgreementSidebar
                    deal={activeDeal}
                    currentUser={currentUser}
                    onOpenCreateDeal={() => {
                      setIsMobileSidebarOpen(false);
                      setIsDealModalOpen(true);
                    }}
                    onSubmitWork={() => {
                      setIsMobileSidebarOpen(false);
                      handleSubmitWork();
                    }}
                    onApproveAndRelease={() => {
                      setIsMobileSidebarOpen(false);
                      handleApproveAndRelease();
                    }}
                    onRaiseDispute={handleRaiseDispute}
                    onResolveDispute={handleResolveDispute}
                    isWorkSubmitted={!!workDelivery}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. MODALS */}
      {/* First-Time Authentication & Onboarding Gate */}
      <AuthOnboardingModal
        isOpen={!isAuthenticated || isAuthModalOpen}
        onAuthSuccess={handleAuthSuccess}
        currentUser={currentUser}
        onClose={() => setIsAuthModalOpen(false)}
        canDismiss={isAuthenticated}
      />

      {/* Aesthetic Profile & KYC Verification Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        user={currentUser}
        onSaveProfile={handleUpdateProfile}
      />

      {/* The 🤝 Deal Icon & Transaction Form Modal */}
      <DealModal
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        onConfirmDeal={handleConfirmDeal}
        initialValues={dealInitialValues}
        clientName={currentUser.role === 'creator' ? (currentUser.name || 'Client') : 'Client Partner'}
        freelancerName={currentUser.role === 'editor' ? (currentUser.name || 'Freelancer') : 'Editor Partner'}
      />

      {/* 4. MOBILE BOTTOM NAVIGATION BAR (Touch-optimized for smartphones & tablets) */}
      <nav 
        id="mobile-bottom-navigation-bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0a0d13]/95 border-t border-white/10 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around shadow-[0_-10px_25px_rgba(0,0,0,0.6)]"
      >
        <button
          id="mobile-nav-marketplace"
          onClick={() => setCurrentView('marketplace')}
          className={`flex-1 py-1.5 px-2 flex flex-col items-center justify-center min-h-[44px] rounded-xl transition ${
            currentView === 'marketplace'
              ? 'text-cyan-400 bg-cyan-500/10 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Store className="w-4 h-4 mb-1" />
          <span className="text-[10px] tracking-tight">Marketplace</span>
        </button>

        <button
          id="mobile-nav-escrow"
          onClick={() => setCurrentView('escrow')}
          className={`flex-1 py-1.5 px-2 flex flex-col items-center justify-center min-h-[44px] rounded-xl transition relative ${
            currentView === 'escrow'
              ? 'text-cyan-400 bg-cyan-500/10 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4 mb-1" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#0a0d13]" />
          </div>
          <span className="text-[10px] tracking-tight">Escrow</span>
        </button>

        <button
          id="mobile-nav-deal"
          onClick={() => setIsDealModalOpen(true)}
          className="flex-1 py-1.5 px-2 flex flex-col items-center justify-center min-h-[44px] rounded-xl text-teal-300 hover:text-teal-200 transition"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 flex items-center justify-center mb-0.5 shadow-md shadow-cyan-500/20">
            <Handshake className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] tracking-tight font-bold">Post Deal</span>
        </button>

        <button
          id="mobile-nav-profile"
          onClick={() => setCurrentView('profile')}
          className={`flex-1 py-1.5 px-2 flex flex-col items-center justify-center min-h-[44px] rounded-xl transition ${
            currentView === 'profile'
              ? 'text-purple-400 bg-purple-500/10 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4 mb-1" />
          <span className="text-[10px] tracking-tight">Profile & KYC</span>
        </button>
      </nav>
    </div>
  );
}
