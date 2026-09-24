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
import { VakraFloatingAssistant } from './components/VakraFloatingAssistant';
import { DealModal } from './components/DealModal';
import { AgreementSidebar } from './components/AgreementSidebar';
import { ChatSection } from './components/ChatSection';
import { ProfileVerificationDashboard } from './components/ProfileVerificationDashboard';
import { MarketplaceHome } from './components/MarketplaceHome';
import { VerilanceLogo } from './components/VerilanceLogo';
import { RazorpaySecureCheckoutModal, RazorpayPaymentResult } from './components/RazorpaySecureCheckoutModal';
import { WhyVerilanceModal } from './components/WhyVerilanceModal';
import { NotificationCenterModal, AppNotification } from './components/NotificationCenterModal';
import { HotkeyCheatsheetModal } from './components/HotkeyCheatsheetModal';
import { AdminDelegationPanel } from './components/AdminDelegationPanel';
import { AdminBadge } from './components/AdminBadge';
import { isRootOwner, isUserAdmin, canManageAdmins, canManageKYCEscrow, ROOT_OWNER_EMAIL } from './lib/adminSecurity';
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
  Trash2, 
  Volume2, 
  VolumeX,
  Keyboard,
  Crown
} from 'lucide-react';
import { 
  fetchUserFromDB, 
  saveUserToDB, 
  saveMessageToDB, 
  subscribeMessages, 
  updateViewOnceMediaInDB, 
  saveDealToDB, 
  subscribeDeals 
} from './lib/firebase';
import { 
  initializeCleanSlateAuth, 
  clearAllStorageData, 
  CLEAN_SLATE_USER, 
  executeFullDatabaseWipe 
} from './lib/dataReset';
import { getRandomDefaultAvatar, DEFAULT_AVATARS } from './lib/defaultAvatars';
import { soundEffects } from './lib/soundEffects';

export default function App() {
  // Check and enforce clean-slate auth logic on startup
  const initialAuth = initializeCleanSlateAuth();

  // Sound effects enabled toggle state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundEffects.isEnabled());

  // Navigation View State: 'marketplace' vs 'profile' vs 'escrow' vs 'admin'
  const [currentView, setCurrentView] = useState<'marketplace' | 'profile' | 'escrow' | 'admin'>('marketplace');

  // Authentication & Onboarding Gate State (Clean Slate: unauthenticated by default)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuth.isAuthenticated);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(initialAuth.isAuthModalOpen);

  // 1. Current User State (Zero balances, clean fields, no mock persona)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const u = initialAuth.initialUser;
    const isRoot = isRootOwner(u.email);
    if (isRoot) {
      return {
        ...u,
        isRootOwner: true,
        isAdmin: true,
        permissions: { canManageAdmins: true, canManageKYC_Escrow: true, grantedAt: new Date().toISOString(), grantedBy: 'SYSTEM_ROOT' }
      };
    }
    return u;
  });

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
  const [isRazorpayCheckoutOpen, setIsRazorpayCheckoutOpen] = useState(false);
  const [pendingFundingDeal, setPendingFundingDeal] = useState<DealAgreement | null>(null);
  const [isWhyVerilanceOpen, setIsWhyVerilanceOpen] = useState(false);

  // 6. Work Delivery State (Clean Slate: null initially)
  const [workDelivery, setWorkDelivery] = useState<WorkDelivery | null>(null);

  // 7. Real-Time Holographic Notification Toast & Center State
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      title: '🔒 Cyber-Escrow Protocol Online',
      description: 'Razorpay 5% multi-sig vault active. Funds held securely until 4K master approval.',
      type: 'escrow',
      timestamp: 'Just now',
      read: false,
      actionView: 'escrow',
    },
    {
      id: 'notif-2',
      title: '🛡️ View Once DRM Shield Ready',
      description: 'Single-view anti-screenshot protection configured. Buffer auto-purges on close.',
      type: 'security',
      timestamp: '2m ago',
      read: false,
      actionView: 'escrow',
    },
    {
      id: 'notif-3',
      title: '⚡ Global Hotkeys Active',
      description: 'Press Ctrl+D for Post Deal, Ctrl+N for Notifications, or ? for shortcuts.',
      type: 'info',
      timestamp: '5m ago',
      read: false,
    },
  ]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isHotkeyCheatsheetOpen, setIsHotkeyCheatsheetOpen] = useState<boolean>(false);

  const [toastNotification, setToastNotification] = useState<{
    id: string;
    title: string;
    description: string;
    type: 'info' | 'success' | 'alert' | 'escrow' | 'security';
  } | null>(null);

  const showNotification = (notif: {
    title: string;
    description: string;
    type?: 'info' | 'success' | 'alert' | 'escrow' | 'security';
    actionView?: 'marketplace' | 'profile' | 'escrow' | 'admin';
  }) => {
    if (notif.type === 'alert') {
      soundEffects.playAlertWarningSound();
    } else {
      soundEffects.playNotificationSound();
    }
    setToastNotification({
      id: String(Date.now()),
      title: notif.title,
      description: notif.description,
      type: notif.type || 'info',
    });
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: notif.title,
        description: notif.description,
        type: notif.type || 'info',
        timestamp: 'Just now',
        read: false,
        actionView: notif.actionView,
      },
      ...prev,
    ]);
  };

  useEffect(() => {
    if (!toastNotification) return;
    const timer = setTimeout(() => {
      setToastNotification(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastNotification]);

  // Global Hotkey System using standard event listeners
  // Handles: Post Deal (Ctrl+D), Open Notifications (Ctrl+N), Marketplace (Ctrl+M),
  // Escrow (Ctrl+E), Profile (Ctrl+P), Why Verilance (Ctrl+W), Cheatsheet (?), Escape (Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isMod = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();

      // Check if target is currently an editable input or textarea
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // 1. Post Deal: Ctrl+D or Cmd+D
      if (isMod && key === 'd') {
        e.preventDefault();
        e.stopPropagation();
        soundEffects.playTabClick();
        setIsDealModalOpen(true);
        showNotification({
          title: '⚡ Hotkey Activated (Ctrl+D)',
          description: 'Opened Escrow Deal Creator.',
          type: 'info',
        });
        return;
      }

      // 2. Open Notifications: Ctrl+N or Cmd+N
      if (isMod && key === 'n') {
        e.preventDefault();
        e.stopPropagation();
        soundEffects.playNotificationSound();
        setIsNotificationsOpen((prev) => !prev);
        return;
      }

      // 3. Switch to Marketplace: Ctrl+M or Cmd+M
      if (isMod && key === 'm') {
        e.preventDefault();
        e.stopPropagation();
        soundEffects.playNavTabClick();
        setCurrentView('marketplace');
        return;
      }

      // 4. Switch to Escrow & Chat: Ctrl+E or Cmd+E
      if (isMod && key === 'e') {
        e.preventDefault();
        e.stopPropagation();
        soundEffects.playNavTabClick();
        setCurrentView('escrow');
        return;
      }

      // 5. Switch to Profile & KYC: Ctrl+P or Cmd+P
      if (isMod && key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        soundEffects.playNavTabClick();
        setCurrentView('profile');
        return;
      }

      // 6. Admin HUD / Governance Matrix: Ctrl+A or Cmd+A (Root Owner / Authorized Admins)
      if (isMod && key === 'a') {
        e.preventDefault();
        e.stopPropagation();
        if (isRootOwner(currentUser.email) || isUserAdmin(currentUser)) {
          soundEffects.playNavTabClick();
          setCurrentView((prev) => (prev === 'admin' ? 'marketplace' : 'admin'));
          showNotification({
            title: '👑 Admin HUD Activated (Ctrl+A)',
            description: 'Switched to Admin Role Delegation and Control HUD.',
            type: 'info',
            actionView: 'admin',
          });
        }
        return;
      }

      // 7. Why VERILANCE & Calculator: Ctrl+W or Ctrl+Y
      if (isMod && (key === 'w' || key === 'y')) {
        e.preventDefault();
        e.stopPropagation();
        soundEffects.playTabClick();
        setIsWhyVerilanceOpen((prev) => !prev);
        return;
      }

      // 7. Cheatsheet Help: ? key (when not typing in an input) or Ctrl+/
      if ((e.key === '?' && !isInputFocused) || (isMod && e.key === '/')) {
        e.preventDefault();
        e.stopPropagation();
        soundEffects.playTabClick();
        setIsHotkeyCheatsheetOpen((prev) => !prev);
        return;
      }

      // 8. Escape: Close any open dialog or slideover
      if (e.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsHotkeyCheatsheetOpen(false);
        setIsDealModalOpen(false);
        setIsWhyVerilanceOpen(false);
        setIsOnboardingOpen(false);
        setIsRazorpayCheckoutOpen(false);
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // Firebase Real-time Chat Messages Subscription
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const unsubscribe = subscribeMessages(null, (realtimeMsgs) => {
        if (realtimeMsgs && realtimeMsgs.length > 0) {
          setMessages(realtimeMsgs);
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn('[App] Firestore realtime messages listener notice:', err);
    }
  }, [isAuthenticated]);

  // Firebase Real-time Deals Subscription
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const unsubscribe = subscribeDeals((realtimeDeals) => {
        if (realtimeDeals && realtimeDeals.length > 0) {
          setActiveDeal((prev) => {
            if (!prev) return realtimeDeals[realtimeDeals.length - 1];
            const found = realtimeDeals.find((d) => d.id === prev.id);
            return found || prev;
          });
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn('[App] Firestore realtime deals listener notice:', err);
    }
  }, [isAuthenticated]);

  // Sync real profile from Firestore on load & trigger full blank-slate wipe if uninitiated
  useEffect(() => {
    const isWipedV6 = localStorage.getItem('verilance_wipe_v6_clean') === 'true';
    if (!isWipedV6) {
      console.log('[App] Initializing fresh database blank slate (0 users, 0 deals, 0 profiles)...');
      executeFullDatabaseWipe().then(() => {
        localStorage.setItem('verilance_wipe_v6_clean', 'true');
        setCurrentUser({ ...CLEAN_SLATE_USER, avatar: getRandomDefaultAvatar().svgDataUri });
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
    const isRoot = isRootOwner(authenticatedUser.email);
    const enrichedUser: UserProfile = {
      ...authenticatedUser,
      isRootOwner: isRoot ? true : !!authenticatedUser.isRootOwner,
      isAdmin: isRoot ? true : !!authenticatedUser.isAdmin,
      permissions: isRoot
        ? { canManageAdmins: true, canManageKYC_Escrow: true, grantedAt: new Date().toISOString(), grantedBy: 'SYSTEM_ROOT' }
        : authenticatedUser.permissions || { canManageAdmins: false, canManageKYC_Escrow: false },
    };
    setCurrentUser(enrichedUser);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    saveUserToDB(enrichedUser).catch(err => {
      console.error('[App] Failed to save user on auth success:', err);
    });

    showNotification({
      title: isRoot ? '👑 Welcome, Root Owner' : `Welcome, ${enrichedUser.name}`,
      description: isRoot
        ? 'Root owner verified (visiongoat12@gmail.com). Highest authority tier active.'
        : `Authenticated as ${enrichedUser.role}. Escrow platform protection online.`,
      type: isRoot ? 'security' : 'success',
      actionView: isRoot ? 'admin' : 'marketplace',
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
      createdAt: new Date().toISOString(),
      channelId: activeChannel?.id || 'global',
    };
    setMessages((prev) => [...prev, newMsg]);
    saveMessageToDB(newMsg, activeChannel?.id || 'global').catch((err) => {
      console.warn('[App] Realtime message broadcast notice:', err);
    });
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
      viewOnceMedia: {
        ...media,
        opened: false,
        isExpired: false,
      },
      createdAt: new Date().toISOString(),
      channelId: activeChannel?.id || 'global',
    };
    setMessages((prev) => [...prev, newMsg]);
    saveMessageToDB(newMsg, activeChannel?.id || 'global').catch((err) => {
      console.warn('[App] Realtime view once broadcast notice:', err);
    });
    showNotification({
      title: '🔒 View Once Media Sent',
      description: `Dispatched single-view protected attachment: "${media.title}". Destroys upon viewer close.`,
      type: 'security',
    });
  };

  const handleExpireViewOnceMedia = (mediaId: string) => {
    // 1. Sync state to Firestore so recipient AND sender immediately see "opened: true" and locked "Opened" badge
    const targetMsg = messages.find((m) => m.viewOnceMedia && m.viewOnceMedia.id === mediaId);
    if (targetMsg) {
      updateViewOnceMediaInDB(targetMsg.id, {
        isExpired: true,
        opened: true,
        openedAt: new Date().toISOString(),
        openedByUserId: currentUser.id,
      }).catch((err) => {
        console.warn('[App] Realtime expire sync notice:', err);
      });
    }

    // 2. Update local state
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.viewOnceMedia && msg.viewOnceMedia.id === mediaId) {
          return {
            ...msg,
            viewOnceMedia: {
              ...msg.viewOnceMedia,
              isExpired: true,
              opened: true,
              url: '', // wipe raw media URL from memory
              openedAt: new Date().toISOString(),
            },
          };
        }
        return msg;
      })
    );

    showNotification({
      title: '🔒 View Once Buffer Purged',
      description: 'Single-use preview has been destroyed. Media locked with "Opened" status.',
      type: 'info',
    });
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
    showNotification({
      title: '🚨 VAKRA Anti-Scam Threat Alert',
      description: alertText,
      type: 'alert',
    });
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

  // Confirm Deal from Modal with optional immediate funding
  const handleConfirmDeal = (deal: DealAgreement, triggerPaymentImmediately: boolean = true) => {
    setActiveDeal(deal);
    setWorkDelivery(null); // Reset delivery state for new deal
    saveDealToDB(deal).catch((err) => console.warn('[App] Firestore deal save notice:', err));

    if (triggerPaymentImmediately) {
      setPendingFundingDeal(deal);
      setIsRazorpayCheckoutOpen(true);
    } else {
      showNotification({
        title: '📋 Escrow Contract Drafted',
        description: `Contract for ₹${deal.amount.toLocaleString('en-IN')} drafted. Ready for Razorpay escrow funding.`,
        type: 'info',
        actionView: 'escrow',
      });
      const draftMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        senderId: 'trustway-system',
        senderName: 'Trustway Protocol',
        senderRole: 'system',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'deal_invite',
        text: `📋 ESCROW AGREEMENT DRAFTED: ₹${deal.amount.toLocaleString('en-IN')} for ${deal.serviceType}. Awaiting escrow funding deposit.`,
        createdAt: new Date().toISOString(),
        channelId: activeChannel?.id || 'global',
      };
      setMessages((prev) => [...prev, draftMsg]);
      saveMessageToDB(draftMsg, activeChannel?.id || 'global').catch(() => {});
    }
  };

  // Handle successful Razorpay Escrow Authorization
  const handleRazorpayPaymentSuccess = (result: RazorpayPaymentResult) => {
    setActiveDeal((prev) => {
      if (!prev) return null;
      const updated: DealAgreement = {
        ...prev,
        status: 'escrow_secured',
        paymentMethod: `Razorpay (${result.method})`,
        history: [
          ...prev.history,
          {
            id: `h-pay-${Date.now()}`,
            title: `Funds Secured in Escrow 🔒 (ID: ${result.paymentId})`,
            detail: `₹${result.amount.toLocaleString('en-IN')} authorized via Razorpay ${result.method}. VERILANCE 5% commission (₹${result.commissionFee}) reserved; ₹${result.netPayout.toLocaleString('en-IN')} escrow-locked for freelancer.`,
            timestamp: result.timestamp,
            type: 'secure',
          },
        ],
      };
      saveDealToDB(updated).catch((err) => console.warn('[App] Firestore deal funding notice:', err));
      return updated;
    });

    showNotification({
      title: '🔒 Razorpay Escrow Secured',
      description: `₹${result.amount.toLocaleString('en-IN')} authorized & locked in Escrow. 5% platform commission allocated.`,
      type: 'escrow',
      actionView: 'escrow',
    });

    const fundedMsg: ChatMessage = {
      id: `pay-${Date.now()}`,
      senderId: 'trustway-system',
      senderName: 'Trustway Protocol',
      senderRole: 'system',
      timestamp: result.timestamp,
      type: 'deal_invite',
      text: `🔒 ESCROW SECURED VIA RAZORPAY: ₹${result.amount.toLocaleString('en-IN')} authorized (Ref: ${result.paymentId}). VERILANCE 5% insurance fee (₹${result.commissionFee}) allocated. ₹${result.netPayout.toLocaleString('en-IN')} will disburse to Editor upon your watermarked proof approval.`,
      createdAt: new Date().toISOString(),
      channelId: activeChannel?.id || 'global',
    };
    setMessages((prev) => [...prev, fundedMsg]);
    saveMessageToDB(fundedMsg, activeChannel?.id || 'global').catch(() => {});
    setIsRazorpayCheckoutOpen(false);
    setPendingFundingDeal(null);
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
    showNotification({
      title: '🎬 Watermarked Draft Submitted',
      description: 'Editor submitted 4K preview with diagonal security watermark.',
      type: 'success',
      actionView: 'escrow',
    });

    if (activeDeal) {
      const updated: DealAgreement = {
        ...activeDeal,
        status: 'work_submitted',
        history: [
          ...activeDeal.history,
          {
            id: `h-submit-${Date.now()}`,
            title: 'Watermarked Work Submitted 🎬',
            detail: `Editor uploaded draft cut (1.42 GB) with diagonal watermark security. Mapped against ${targetDeadline}.`,
            timestamp: 'Just now',
            type: 'submitted',
          },
        ],
      };
      setActiveDeal(updated);
      saveDealToDB(updated).catch((err) => console.warn('[App] Firestore work submission notice:', err));
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
      createdAt: new Date().toISOString(),
      channelId: activeChannel?.id || 'global',
    };
    setMessages((prev) => [...prev, workMsg]);
    saveMessageToDB(workMsg, activeChannel?.id || 'global').catch(() => {});
  };

  // Approve & Release Funds (Client role)
  const handleApproveAndRelease = () => {
    if (!activeDeal) return;

    // Strict KYC Escrow Check: Restrict payout releases until status is 'verified'
    if (currentUser.kycStatus !== 'verified') {
      showNotification({
        title: '⚠️ KYC Verification Required',
        description: 'Escrow payouts are restricted until your account KYC status is "Verified". Please complete ID & Bank verification in Settings.',
        type: 'alert',
        actionView: 'profile',
      });
      soundEffects.playToggleSound();
      setCurrentView('profile');
      return;
    }

    const updated: DealAgreement = {
      ...activeDeal,
      status: 'released',
      history: [
        ...activeDeal.history,
        {
          id: `h-release-${Date.now()}`,
          title: 'Funds Released & Transferred ⚡',
          detail: `Authorized release. ₹${activeDeal.netPayout.toLocaleString('en-IN')} disbursed to KYC-verified bank account. Watermark cleared.`,
          timestamp: 'Just now',
          type: 'released',
        },
      ],
    };
    setActiveDeal(updated);
    saveDealToDB(updated).catch((err) => console.warn('[App] Firestore release notice:', err));

    if (workDelivery) {
      setWorkDelivery((prev) => (prev ? { ...prev, isApproved: true, watermarked: false } : null));
    }

    // Update wallet
    setCurrentUser((prev) => ({
      ...prev,
      walletBalance: prev.walletBalance + (activeDeal?.netPayout || 1940),
    }));

    showNotification({
      title: '🎉 Escrow Settled & Funds Released',
      description: `₹${activeDeal.netPayout.toLocaleString('en-IN')} paid to Editor! Clean 4K Master export unlocked.`,
      type: 'success',
    });

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

    showNotification({
      title: `🚨 Dispute Opened (${caseId})`,
      description: 'Funds frozen in multi-sig vault. Trustway arbitrator reviewing evidence.',
      type: 'alert',
      actionView: 'escrow',
    });

    const updated: DealAgreement = {
      ...activeDeal,
      status: 'disputed',
      dispute: {
        caseId,
        reason,
        openedAt: new Date().toISOString(),
        status: 'under_investigation',
      },
      history: [
        ...activeDeal.history,
        {
          id: `h-disp-${Date.now()}`,
          title: 'Dispute Raised & Funds Frozen 🚨',
          detail: `Case ${caseId} opened: "${reason}". Payouts suspended pending Trustway mediator arbitration.`,
          timestamp: 'Just now',
          type: 'disputed',
        },
      ],
    };
    setActiveDeal(updated);
    saveDealToDB(updated).catch((err) => console.warn('[App] Firestore dispute raise notice:', err));

    const dispMsg: ChatMessage = {
      id: `disp-msg-${Date.now()}`,
      senderId: 'vakra-ai',
      senderName: 'VAKRA Cyber Sentinel',
      senderRole: 'vakra',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'vakra_alert',
      text: `🚨 ESCROW FROZEN: Case ${caseId} opened. Reason: "${reason}". Funds are securely locked in Trustway Multi-Sig while support investigates transcripts and delivery hashes.`,
      createdAt: new Date().toISOString(),
      channelId: activeChannel?.id || 'global',
    };
    setMessages((prev) => [...prev, dispMsg]);
    saveMessageToDB(dispMsg, activeChannel?.id || 'global').catch(() => {});
  };

  // Resolve Dispute
  const handleResolveDispute = () => {
    if (!activeDeal) return;

    const updated: DealAgreement = {
      ...activeDeal,
      status: workDelivery ? 'work_submitted' : 'escrow_secured',
      dispute: undefined,
      history: [
        ...activeDeal.history,
        {
          id: `h-res-${Date.now()}`,
          title: 'Dispute Resolved & Unfrozen 🤝',
          detail: 'Both parties agreed to terms. Normal escrow milestones restored.',
          timestamp: 'Just now',
          type: 'neutral',
        },
      ],
    };
    setActiveDeal(updated);
    saveDealToDB(updated).catch((err) => console.warn('[App] Firestore dispute resolve notice:', err));

    const resMsg: ChatMessage = {
      id: `res-msg-${Date.now()}`,
      senderId: 'trustway-system',
      senderName: 'Trustway Protocol',
      senderRole: 'system',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      text: '🤝 Dispute unfreezed: Normal escrow protocol resumed. Freelancer and Client can proceed with revisions or release.',
      createdAt: new Date().toISOString(),
      channelId: activeChannel?.id || 'global',
    };
    setMessages((prev) => [...prev, resMsg]);
    saveMessageToDB(resMsg, activeChannel?.id || 'global').catch(() => {});
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
      {/* 0. HOLOGRAPHIC NOTIFICATION TOAST POPUP */}
      {toastNotification && (
        <div 
          id="verilance-toast-notification"
          className="fixed top-4 right-4 z-50 max-w-sm sm:max-w-md p-3.5 sm:p-4 rounded-2xl bg-[#0c111c]/95 backdrop-blur-2xl border border-cyan-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(6,182,212,0.25)] flex items-start justify-between gap-3 text-white animate-in slide-in-from-top-4 fade-in duration-300"
        >
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              toastNotification.type === 'alert'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : toastNotification.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : toastNotification.type === 'escrow'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : toastNotification.type === 'security'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
            }`}>
              {toastNotification.type === 'alert' ? (
                <AlertCircle className="w-5 h-5" />
              ) : toastNotification.type === 'success' || toastNotification.type === 'security' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : toastNotification.type === 'escrow' ? (
                <Lock className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 font-['Space_Grotesk']">
                {toastNotification.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                {toastNotification.description}
              </p>
            </div>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP APP HEADER BAR */}
      <header 
        id="app-header-bar"
        className="h-16 border-b border-white/10 bg-[#0a0d13]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shrink-0 z-30"
      >
        {/* Logo & Platform Identity */}
        <div 
          onClick={() => {
            soundEffects.playNavTabClick();
            setCurrentView('marketplace');
          }}
          className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
        >
          <VerilanceLogo size="md" />
        </div>

        {/* Center Navigation Switcher Tabs (Hidden on mobile; moved to bottom navigation bar for touch ergonomic design) */}
        <div className="hidden md:flex items-center gap-1.5 p-1 bg-[#131722] rounded-xl border border-white/10 shadow-inner">
          <button
            id="nav-tab-marketplace"
            onClick={() => {
              soundEffects.playNavTabClick();
              setCurrentView('marketplace');
            }}
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
            onClick={() => {
              soundEffects.playNavTabClick();
              setCurrentView('profile');
            }}
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
            onClick={() => {
              soundEffects.playNavTabClick();
              setCurrentView('escrow');
            }}
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

          <button
            id="nav-tab-why-verilance"
            onClick={() => {
              soundEffects.playNavTabClick();
              setIsWhyVerilanceOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 text-cyan-400/90 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30"
            title="Explore Why VERILANCE, 5% Fee Calculator & Core USPs"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Why VERILANCE</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
              5%
            </span>
          </button>

          {/* Admin HUD Navigation Tab (Visible to Root Owner & Delegated Admins) */}
          {(isRootOwner(currentUser.email) || isUserAdmin(currentUser)) && (
            <button
              id="nav-tab-admin-delegation-hud"
              onClick={() => {
                soundEffects.playNavTabClick();
                setCurrentView('admin');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentView === 'admin'
                  ? 'bg-gradient-to-r from-amber-500/25 via-purple-500/25 to-cyan-500/25 text-amber-200 border border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20'
              }`}
              title="Admin Roles & Delegation Control Panel (Ctrl+A)"
            >
              {isRootOwner(currentUser.email) ? (
                <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>Admin HUD</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-black ${
                  isRootOwner(currentUser.email)
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                }`}
              >
                {isRootOwner(currentUser.email) ? 'Root' : 'Admin'}
              </span>
            </button>
          )}
        </div>

        {/* Center / Right Control Badges */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Sound FX Mute/Unmute Toggle */}
          <button
            id="header-sound-effects-toggle"
            onClick={() => {
              const next = soundEffects.toggleSound();
              setSoundEnabled(next);
            }}
            className={`p-2 rounded-xl border text-xs transition flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 shadow-sm shadow-cyan-500/10'
                : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Futuristic Sound Effects Active (Click to Mute)' : 'Sound Effects Muted (Click to Enable)'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="hidden 2xl:inline text-[10px] font-mono">
              {soundEnabled ? 'FX ON' : 'FX OFF'}
            </span>
          </button>

          {/* Global Hotkeys Cheatsheet Button */}
          <button
            id="header-hotkeys-cheatsheet-btn"
            onClick={() => {
              soundEffects.playTabClick();
              setIsHotkeyCheatsheetOpen(true);
            }}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-300 transition flex items-center gap-1.5"
            title="Keyboard Shortcuts Cheatsheet (Press ?)"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <kbd className="hidden lg:inline text-[10px] font-mono text-cyan-300/80 bg-white/10 px-1 py-0.2 rounded border border-white/10">
              ?
            </kbd>
          </button>

          {/* Real-time Cyber Notification Bell (Ctrl+N) */}
          <button
            id="header-notification-center-btn"
            onClick={() => {
              soundEffects.playNotificationSound();
              setIsNotificationsOpen((prev) => !prev);
            }}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-300 transition relative flex items-center gap-1.5"
            title="Open Notification Center (Ctrl+N)"
          >
            <div className="relative">
              <Bell className="w-3.5 h-3.5" />
              {notifications.some((n) => !n.read) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#0a0d13] animate-pulse" />
              )}
            </div>
            <kbd className="hidden 2xl:inline text-[9px] font-mono text-cyan-400/80 bg-white/10 px-1.5 py-0.2 rounded border border-white/10">
              Ctrl+N
            </kbd>
          </button>

          {/* Create Deal Quick Action Button (Ctrl+D) */}
          <button
            id="header-create-deal-btn"
            onClick={() => {
              soundEffects.playTabClick();
              setIsDealModalOpen(true);
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20 cursor-pointer"
            title="Post New Deal / Escrow Contract (Ctrl+D)"
          >
            <Handshake className="w-3.5 h-3.5" />
            <span>Post Deal</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.2 rounded bg-slate-950/25 text-slate-950 text-[9px] font-mono font-black border border-slate-950/20">
              Ctrl+D
            </kbd>
          </button>

          {/* Active Role Indicator & Switcher */}
          <button
            id="header-role-toggle-pill"
            onClick={() => {
              soundEffects.playToggleSound();
              handleToggleUserRole();
            }}
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
            onClick={() => {
              soundEffects.playNavTabClick();
              setCurrentView('profile');
            }}
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
            <span className="font-bold text-cyan-400">
              ₹{currentUser.walletBalance.toLocaleString('en-IN')}
            </span>
          </div>

          {/* User Account Pill & Sign Out / Switch Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            {isAuthenticated ? (
              <>
                <button
                  id="header-user-profile-menu-btn"
                  onClick={() => {
                    soundEffects.playNavTabClick();
                    setCurrentView('profile');
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#141822] hover:bg-[#1a202d] border border-white/10 transition group"
                  title="View Profile & Security"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name || 'User'}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-cyan-500/40"
                  />
                  <div className="hidden md:flex flex-col text-left leading-none">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                        {currentUser.name ? currentUser.name.split(' ')[0] : 'Member'}
                      </span>
                      <AdminBadge user={currentUser} size="sm" />
                    </div>
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
                    avatar: getRandomDefaultAvatar().svgDataUri,
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
            onOpenWhyVerilance={() => setIsWhyVerilanceOpen(true)}
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
            onOpenAdminPanel={() => setCurrentView('admin')}
          />
        </main>
      ) : currentView === 'admin' ? (
        /* MULTI-TIERED ADMIN DELEGATION & CONTROL HUD */
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0B10] pb-20 md:pb-0">
          <AdminDelegationPanel
            currentUser={currentUser}
            onClose={() => setCurrentView('marketplace')}
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
                onFundEscrow={() => {
                  if (activeDeal) {
                    setPendingFundingDeal(activeDeal);
                    setIsRazorpayCheckoutOpen(true);
                  }
                }}
                onRaiseDispute={handleRaiseDispute}
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
              onFundEscrow={() => {
                if (activeDeal) {
                  setPendingFundingDeal(activeDeal);
                  setIsRazorpayCheckoutOpen(true);
                }
              }}
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
                    onFundEscrow={() => {
                      setIsMobileSidebarOpen(false);
                      if (activeDeal) {
                        setPendingFundingDeal(activeDeal);
                        setIsRazorpayCheckoutOpen(true);
                      }
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

      {/* Razorpay Authentic Secure Escrow Gateway Modal */}
      {isRazorpayCheckoutOpen && pendingFundingDeal && (
        <RazorpaySecureCheckoutModal
          isOpen={isRazorpayCheckoutOpen}
          onClose={() => {
            setIsRazorpayCheckoutOpen(false);
            setPendingFundingDeal(null);
          }}
          dealTitle={pendingFundingDeal.title || pendingFundingDeal.serviceType}
          beneficiaryName={
            pendingFundingDeal.senderRole === 'client'
              ? pendingFundingDeal.receiverName
              : pendingFundingDeal.senderName
          }
          amount={pendingFundingDeal.amount}
          commissionFee={pendingFundingDeal.commissionFee}
          netPayout={pendingFundingDeal.netPayout}
          onPaymentSuccess={handleRazorpayPaymentSuccess}
        />
      )}

      {/* Why VERILANCE Interactive High-Impact Modal with 5% Calculator */}
      <WhyVerilanceModal
        isOpen={isWhyVerilanceOpen}
        onClose={() => setIsWhyVerilanceOpen(false)}
        onOpenDealModal={() => {
          setIsWhyVerilanceOpen(false);
          setIsDealModalOpen(true);
        }}
        onOpenKyc={() => {
          setIsWhyVerilanceOpen(false);
          setCurrentView('profile');
        }}
      />

      {/* Futuristic Cyberpunk Notification Center Slide-over Modal (Ctrl+N) */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onClearAll={() => setNotifications([])}
        onMarkAllAsRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
        onSelectAction={(targetView) => {
          setCurrentView(targetView);
          setIsNotificationsOpen(false);
        }}
      />

      {/* Global Hotkey Cheatsheet Modal (?) */}
      <HotkeyCheatsheetModal
        isOpen={isHotkeyCheatsheetOpen}
        onClose={() => setIsHotkeyCheatsheetOpen(false)}
        onTriggerAction={(actionId) => {
          if (actionId === 'post_deal') {
            setIsDealModalOpen(true);
          } else if (actionId === 'notifications') {
            setIsNotificationsOpen(true);
          } else if (actionId === 'marketplace') {
            setCurrentView('marketplace');
          } else if (actionId === 'escrow') {
            setCurrentView('escrow');
          } else if (actionId === 'profile') {
            setCurrentView('profile');
          } else if (actionId === 'admin') {
            setCurrentView('admin');
          } else if (actionId === 'why_verilance') {
            setIsWhyVerilanceOpen(true);
          }
        }}
      />

      {/* 4. MOBILE BOTTOM NAVIGATION BAR (Touch-optimized for smartphones & tablets) */}
      <nav 
        id="mobile-bottom-navigation-bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0a0d13]/95 border-t border-white/10 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around shadow-[0_-10px_25px_rgba(0,0,0,0.6)]"
      >
        <button
          id="mobile-nav-marketplace"
          onClick={() => {
            soundEffects.playNavTabClick();
            setCurrentView('marketplace');
          }}
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
          onClick={() => {
            soundEffects.playNavTabClick();
            setCurrentView('escrow');
          }}
          className={`flex-1 py-1.5 px-2 flex flex-col items-center justify-center min-h-[44px] rounded-xl transition relative ${
            currentView === 'escrow'
              ? 'text-cyan-400 bg-cyan-500/10 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4 mb-1" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full ring-2 ring-[#0a0d13]" />
          </div>
          <span className="text-[10px] tracking-tight">Escrow</span>
        </button>

        <button
          id="mobile-nav-deal"
          onClick={() => {
            soundEffects.playTabClick();
            setIsDealModalOpen(true);
          }}
          className="flex-1 py-1.5 px-2 flex flex-col items-center justify-center min-h-[44px] rounded-xl text-teal-300 hover:text-teal-200 transition"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 flex items-center justify-center mb-0.5 shadow-md shadow-cyan-500/20">
            <Handshake className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] tracking-tight font-bold">Post Deal</span>
        </button>

        {(isRootOwner(currentUser.email) || isUserAdmin(currentUser)) && (
          <button
            id="mobile-nav-admin"
            onClick={() => {
              soundEffects.playNavTabClick();
              setCurrentView('admin');
            }}
            className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center min-h-[44px] rounded-xl transition ${
              currentView === 'admin'
                ? 'text-amber-300 bg-amber-500/10 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4 mb-1 text-amber-400" />
            <span className="text-[10px] tracking-tight">Admin</span>
          </button>
        )}

        <button
          id="mobile-nav-why-verilance"
          onClick={() => {
            soundEffects.playNavTabClick();
            setIsWhyVerilanceOpen(true);
          }}
          className="flex-1 py-1.5 px-1 flex flex-col items-center justify-center min-h-[44px] rounded-xl text-cyan-400 hover:text-cyan-300 transition"
          title="Why VERILANCE"
        >
          <Sparkles className="w-4 h-4 mb-1" />
          <span className="text-[10px] tracking-tight font-bold">Why 5%</span>
        </button>

        <button
          id="mobile-nav-profile"
          onClick={() => {
            soundEffects.playNavTabClick();
            setCurrentView('profile');
          }}
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

      {/* 5. FLOATING & MOVEABLE VAKRA AI ASSISTANT WIDGET */}
      <VakraFloatingAssistant
        onAutoDraftAgreement={handleVakraAutoDraft}
        onOpenDealModal={() => setIsDealModalOpen(true)}
      />
    </div>
  );
}
