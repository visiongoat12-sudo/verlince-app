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
  LogOut
} from 'lucide-react';
import { fetchUserFromDB, saveUserToDB } from './lib/firebase';

export default function App() {
  // Navigation View State: 'marketplace' (Default Upwork-inspired layout) vs 'profile' vs 'escrow'
  const [currentView, setCurrentView] = useState<'marketplace' | 'profile' | 'escrow'>('marketplace');

  // Authentication & Onboarding Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('verilance_auth_completed') === 'true';
    } catch {
      return false;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('verilance_auth_completed') !== 'true';
    } catch {
      return true;
    }
  });

  // 1. Current User State
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('verilance_auth_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read cached user', e);
    }
    return {
      id: 'user-001',
      name: 'Kabir Verma',
      username: 'kabir_vfx',
      email: 'kabir.vfx@verilance.io',
      recoveryEmail: 'kabir.recovery@gmail.com',
      role: 'editor', // 'creator' (client) or 'editor' (freelancer)
      idDocumentName: 'Aadhaar_Govt_Card_Verified.pdf',
      hasVerifiedBadge: true,
      badgePurchasedAt: '2026-09-01',
      badgeExpiresAt: '2026-12-01',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      kycStatus: 'verified',
      walletBalance: 24500,
    };
  });

  // Sync real profile from Firestore on load if available
  useEffect(() => {
    if (currentUser?.id) {
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
    try {
      localStorage.removeItem('verilance_auth_completed');
      localStorage.removeItem('verilance_auth_user');
    } catch (e) {
      console.warn(e);
    }
    setIsAuthenticated(false);
    setIsAuthModalOpen(true);
  };

  // 2. Modals State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Deal Form Pre-fills (e.g. from VAKRA Auto-Draft)
  const [dealInitialValues, setDealInitialValues] = useState<{
    serviceType?: string;
    amount?: number;
    deadline?: string;
    description?: string;
    senderRole?: 'client' | 'freelancer';
  }>({
    serviceType: 'YouTube Video Editing',
    amount: 2000,
    deadline: '2026-09-25',
    description: 'Edit 10-minute video, includes up to 2 revisions, dynamic zooms, color grade and 4K export.',
    senderRole: 'client',
  });

  // 3. Channels List
  const [channels, setChannels] = useState<Channel[]>([
    {
      id: 'ch-aarav',
      name: 'Aarav Sharma (Tech YouTuber)',
      subtitle: 'Need 10-min YouTube cut before 25 Sep...',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      isGroup: false,
      unreadCount: 1,
      isOnline: true,
      lastActive: '2m ago',
    },
    {
      id: 'ch-rohit',
      name: 'Rohit Visuals (Senior Colorist)',
      subtitle: 'Delivered LUTs for the documentary.',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      isGroup: false,
      unreadCount: 0,
      isOnline: true,
      lastActive: '1h ago',
    },
    {
      id: 'ch-group-studios',
      name: 'NeonVerse Editing Guild',
      subtitle: 'Priya: Who is available for 60s Reels?',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      isGroup: true,
      unreadCount: 4,
      isOnline: true,
      lastActive: '10m ago',
    },
    {
      id: 'ch-group-creators',
      name: 'Creator Escrow Alliance',
      subtitle: 'VAKRA bot updated safety guidelines.',
      avatar: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=150&auto=format&fit=crop&q=80',
      isGroup: true,
      unreadCount: 0,
      isOnline: false,
      lastActive: 'yesterday',
    },
  ]);

  const [activeChannel, setActiveChannel] = useState<Channel>(channels[0]);

  // 4. Chat Messages Feed
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      senderId: 'client-aarav',
      senderName: 'Aarav Sharma',
      senderRole: 'creator',
      timestamp: '11:15 AM',
      type: 'text',
      text: 'Hey Kabir! Saw your recent portfolio reel. I have a 10-minute gadget teardown video for YouTube that needs punchy edits, sound FX, and clean zooms.',
    },
    {
      id: 'm2',
      senderId: 'client-aarav',
      senderName: 'Aarav Sharma',
      senderRole: 'creator',
      timestamp: '11:16 AM',
      type: 'voice',
      voiceDuration: '0:42',
    },
    {
      id: 'm3',
      senderId: 'client-aarav',
      senderName: 'Aarav Sharma',
      senderRole: 'creator',
      timestamp: '11:18 AM',
      type: 'file',
      fileAttachment: {
        name: 'RAW_A_Roll_Camera_4K.zip',
        size: '2.4 GB',
        type: 'video',
      },
      text: 'Here is the raw footage archive. Target delivery is 25 September.',
    },
    {
      id: 'm4',
      senderId: 'vakra-ai',
      senderName: 'VAKRA Cyber Sentinel',
      senderRole: 'vakra',
      timestamp: '11:19 AM',
      type: 'vakra_alert',
      text: 'Warning: Never share raw, unwatermarked files outside the secure "Submit Work" system! Use the 🤝 Deal button below to secure ₹2,000 into VERILANCE Escrow before starting production.',
    },
    {
      id: 'm5',
      senderId: 'user-001',
      senderName: 'Kabir Verma',
      senderRole: 'editor',
      timestamp: '11:21 AM',
      type: 'text',
      text: 'Got it Aarav! I can deliver a high-energy edit with sound design and up to 2 revisions for ₹2,000. Let us lock the agreement in Escrow so both our files and funds are protected.',
    },
    {
      id: 'm6',
      senderId: 'user-001',
      senderName: 'Kabir Verma',
      senderRole: 'editor',
      timestamp: '11:22 AM',
      type: 'view_once',
      text: 'Here is a 1-Time protected draft cut of the gadget teardown hook. You can watch it once with anti-capture protection.',
      viewOnceMedia: {
        id: 'vo-sample-vid',
        mediaType: 'video',
        title: 'Gadget Teardown Hook Cut (4K)',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
        fileSize: '18.4 MB • 4K 60FPS',
        durationSeconds: 20,
        isExpired: false,
      },
    },
    {
      id: 'm7',
      senderId: 'user-001',
      senderName: 'Kabir Verma',
      senderRole: 'editor',
      timestamp: '11:24 AM',
      type: 'view_once',
      text: 'Color grade LUT test frame attached. Protected with VERILANCE View Once.',
      viewOnceMedia: {
        id: 'vo-sample-img',
        mediaType: 'image',
        title: 'Studio Lighting Color Grade Reference',
        url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=300&auto=format&fit=crop&q=80',
        fileSize: '3.8 MB • RAW PNG',
        durationSeconds: 15,
        isExpired: false,
      },
    },
  ]);

  // 5. Active Deal State (Pre-loaded with baseline agreement matching prompt: ₹2,000 for YouTube Video Editing)
  const [activeDeal, setActiveDeal] = useState<DealAgreement | null>({
    id: 'TRW-849201',
    title: 'YouTube Video Editing',
    senderRole: 'client',
    senderName: 'Aarav Sharma (Client)',
    receiverName: 'Kabir Verma (Editor)',
    serviceType: 'YouTube Video Editing',
    amount: 2000,
    commissionFee: 60, // 3% fee
    netPayout: 1940,   // ₹2,000 - ₹60 = ₹1,940
    deadline: '2026-09-25',
    description: 'Edit 10-minute video, includes up to 2 revisions, dynamic zooms, color grade and 4K export.',
    paymentMethod: 'UPI',
    status: 'escrow_secured',
    createdAt: '2026-09-19T11:25:00Z',
    history: [
      {
        id: 'h-1',
        title: 'Digital Agreement Sealed',
        detail: 'Both creator and editor signed cryptographically signed terms.',
        timestamp: '11:25 AM',
        type: 'neutral',
      },
      {
        id: 'h-2',
        title: 'Funds Secured in Escrow 🔒',
        detail: '₹2,000 locked in Trustway Multi-Sig Vault. 3% platform commission allocated.',
        timestamp: '11:26 AM',
        type: 'secure',
      },
    ],
  });

  // 6. Work Delivery State (Watermarked Video)
  const [workDelivery, setWorkDelivery] = useState<WorkDelivery | null>(null);

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
    setCurrentUser((prev) => ({
      ...prev,
      role: nextRole,
      name: nextRole === 'creator' ? 'Aarav Sharma' : 'Kabir Verma',
    }));
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

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07090d] text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. TOP APP HEADER BAR */}
      <header 
        id="app-header-bar"
        className="h-16 border-b border-white/10 bg-[#0a0d13]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-30"
      >
        {/* Logo & Platform Identity */}
        <div 
          onClick={() => setCurrentView('marketplace')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <VerilanceLogo size="md" />
        </div>

        {/* Center Navigation Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#131722] rounded-xl border border-white/10 shadow-inner">
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
            <button
              id="header-user-profile-menu-btn"
              onClick={() => setCurrentView('profile')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#141822] hover:bg-[#1a202d] border border-white/10 transition group"
              title="View Profile & Security"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-cyan-500/40"
              />
              <div className="hidden md:flex flex-col text-left leading-none">
                <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                  {currentUser.name.split(' ')[0]}
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
              <span className="hidden xl:inline text-[11px] font-medium">Switch</span>
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
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0B10]">
          <MarketplaceHome
            onOpenDealModal={() => setIsDealModalOpen(true)}
            onOpenProfile={() => setCurrentView('profile')}
            onOpenChat={(talentName) => {
              if (talentName) {
                // If a talent was clicked, switch to active chat with them
                const targetChannel = channels.find(c => c.name.toLowerCase().includes(talentName.toLowerCase().split(' ')[0])) || channels[0];
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
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0B10]">
          <ProfileVerificationDashboard 
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            onOpenAuthGate={handleSignOut}
            onOpenEditModal={() => setIsOnboardingOpen(true)}
          />
        </main>
      ) : (
        /* ESCROW WORKSPACE & CHAT */
        <div className="flex-1 flex overflow-hidden relative">
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
        clientName="Aarav Sharma"
        freelancerName="Kabir Verma"
      />
    </div>
  );
}
