import React, { useState, useRef, useEffect } from 'react';
import { 
  Channel, 
  ChatMessage, 
  DealAgreement, 
  UserProfile, 
  UserRole,
  WorkDelivery,
  ViewOnceMedia
} from '../types';
import { 
  Phone, 
  Video, 
  Paperclip, 
  Smile, 
  Mic, 
  Send, 
  Play, 
  Pause, 
  FileText, 
  Check, 
  CheckCheck, 
  Sparkles, 
  ShieldAlert, 
  Film, 
  ShieldCheck, 
  MoreVertical, 
  Users, 
  User, 
  Search, 
  ArrowRight,
  Handshake,
  Download,
  AlertTriangle,
  UploadCloud,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Clock,
  MessageSquare,
  Image as ImageIcon,
  Flame,
  X
} from 'lucide-react';
import { WatermarkVideoPreview } from './WatermarkVideoPreview';
import { ViewOnceSecurityModal } from './ViewOnceSecurityModal';
import { GalleryPermissionModal } from './GalleryPermissionModal';
import { isMobileDevice, hasGalleryAccess } from '../lib/galleryPermission';
import { soundEffects } from '../lib/soundEffects';

interface ChatSectionProps {
  currentUser: UserProfile;
  activeChannel?: Channel | null;
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendViewOnceMedia?: (media: ViewOnceMedia, caption?: string) => void;
  onExpireViewOnceMedia?: (mediaId: string) => void;
  onOpenDealModal: () => void;
  onSubmitWork: () => void;
  onApproveAndRelease: () => void;
  onFundEscrow?: () => void;
  onRaiseDispute?: (reason: string) => void;
  activeDeal: DealAgreement | null;
  workDelivery: WorkDelivery | null;
  onToggleUserRole: () => void;
  onOpenOnboarding: () => void;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  currentUser,
  activeChannel,
  channels,
  onSelectChannel,
  messages,
  onSendMessage,
  onSendViewOnceMedia,
  onExpireViewOnceMedia,
  onOpenDealModal,
  onSubmitWork,
  onApproveAndRelease,
  onFundEscrow,
  onRaiseDispute,
  activeDeal,
  workDelivery,
  onToggleUserRole,
  onOpenOnboarding,
}) => {
  const [inputText, setInputText] = useState('');
  const [chatTypeTab, setChatTypeTab] = useState<'direct' | 'group'>('direct');
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(35);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [activeViewOnceMedia, setActiveViewOnceMedia] = useState<ViewOnceMedia | null>(null);
  const [showSendViewOnceModal, setShowSendViewOnceModal] = useState(false);
  const [viewOnceType, setViewOnceType] = useState<'video' | 'image'>('video');
  const [viewOnceTitle, setViewOnceTitle] = useState('Teaser Hook 4K Edit Proof');
  const [viewOnceCaption, setViewOnceCaption] = useState('1-Time protected draft cut. Disappears after viewing.');

  // View Once Toggle for Messaging/Chat Attachments
  const [isViewOnceToggleActive, setIsViewOnceToggleActive] = useState<boolean>(false);
  const [pendingAttachment, setPendingAttachment] = useState<{
    file?: File;
    previewUrl: string;
    name: string;
    sizeMb: string;
    type: 'video' | 'image' | 'file';
  } | null>(null);

  // Mobile Gallery Permission for Chat Media Attachments
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const [isGalleryPermModalOpen, setIsGalleryPermModalOpen] = useState(false);

  const handleTriggerChatAttach = () => {
    if (isMobileDevice() && !hasGalleryAccess()) {
      setIsGalleryPermModalOpen(true);
    } else {
      chatFileInputRef.current?.click();
    }
  };

  const handleGalleryPermGranted = () => {
    setTimeout(() => {
      chatFileInputRef.current?.click();
    }, 150);
  };

  const handleChatFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const mediaType: 'video' | 'image' | 'file' = file.type.startsWith('video')
        ? 'video'
        : file.type.startsWith('image')
        ? 'image'
        : 'file';
      const previewUrl = URL.createObjectURL(file);

      setPendingAttachment({
        file,
        previewUrl,
        name: file.name,
        sizeMb: `${sizeMb} MB`,
        type: mediaType,
      });
      e.target.value = '';
    }
  };

  const handleRemovePendingAttachment = () => {
    setPendingAttachment(null);
  };

  const handleToggleViewOnce = () => {
    setIsViewOnceToggleActive((prev) => !prev);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, workDelivery]);

  const handleOpenViewOnce = (media: ViewOnceMedia) => {
    if (media.isExpired) return;
    setActiveViewOnceMedia(media);
  };

  const handleCloseAndExpireViewOnce = (mediaId: string) => {
    if (onExpireViewOnceMedia) {
      onExpireViewOnceMedia(mediaId);
    }
    setActiveViewOnceMedia(null);
  };

  const handleSendCustomViewOnce = () => {
    const newMedia: ViewOnceMedia = {
      id: `vo-${Date.now()}`,
      mediaType: viewOnceType,
      title: viewOnceTitle.trim() || (viewOnceType === 'video' ? 'Protected Video Preview' : 'Protected Image Preview'),
      url: viewOnceType === 'video'
        ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        : 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1200&auto=format&fit=crop&q=80',
      thumbnailUrl: viewOnceType === 'video'
        ? 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=300&auto=format&fit=crop&q=80',
      fileSize: viewOnceType === 'video' ? '18.4 MB • 4K 60FPS' : '4.2 MB • RAW TIFF',
      isExpired: false,
    };

    if (onSendViewOnceMedia) {
      onSendViewOnceMedia(newMedia, viewOnceCaption);
    } else {
      onSendMessage(`🔒 [View Once ${viewOnceType === 'video' ? 'Video' : 'Photo'}: ${newMedia.title}]`);
    }

    setShowSendViewOnceModal(false);
    setViewOnceCaption('');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (pendingAttachment) {
      if (isViewOnceToggleActive) {
        // Send as View Once protected media attachment
        const newMedia: ViewOnceMedia = {
          id: `vo-${Date.now()}`,
          mediaType: pendingAttachment.type === 'video' ? 'video' : 'image',
          title: pendingAttachment.name,
          url: pendingAttachment.previewUrl,
          thumbnailUrl: pendingAttachment.previewUrl,
          fileSize: pendingAttachment.sizeMb,
          isExpired: false,
        };
        if (onSendViewOnceMedia) {
          onSendViewOnceMedia(newMedia, inputText.trim() || undefined);
        } else {
          onSendMessage(`🔒 [View Once ${pendingAttachment.type === 'video' ? 'Video' : 'Photo'}: ${pendingAttachment.name}]`);
        }
      } else {
        // Normal Attachment Message
        const caption = inputText.trim();
        const icon = pendingAttachment.type === 'video' ? '🎥' : pendingAttachment.type === 'image' ? '🖼️' : '📎';
        const fileTag = `${icon} [Attached: ${pendingAttachment.name} • ${pendingAttachment.sizeMb}]`;
        onSendMessage(caption ? `${caption}\n${fileTag}` : fileTag);
      }

      setPendingAttachment(null);
      setInputText('');
      setShowEmojiPicker(false);
      return;
    }

    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  // Context-Aware Quick Replies based on current active deal status & user role
  interface QuickReplyItem {
    id: string;
    label: string;
    icon: string;
    highlight?: boolean;
    description?: string;
    action: () => void;
  }

  const getContextQuickReplies = (): QuickReplyItem[] => {
    if (!activeDeal) {
      return [
        {
          id: 'create-deal',
          label: 'Create Escrow Deal',
          icon: '🤝',
          description: 'Lock funds in 3% Escrow',
          action: () => onOpenDealModal(),
        },
        {
          id: 'request-quote',
          label: 'Request Quotation',
          icon: '📋',
          description: 'Ask for scope & pricing',
          action: () => onSendMessage('Hi! Can you share the timeline and scope details for this project? Let’s lock it with a VERILANCE Escrow deal.'),
        },
        {
          id: 'vakra-check',
          label: 'Scan Contract Terms',
          icon: '🛡️',
          description: 'Run VAKRA anti-fraud scan',
          action: () => onSendMessage('Checking the terms against VERILANCE 3% anti-fraud escrow guidelines. Can you confirm the final milestone?'),
        },
        {
          id: 'view-portfolio',
          label: 'Review Work Samples',
          icon: '🎬',
          description: 'Request watermarked preview',
          action: () => onSendMessage('Can you send a 1-time View Once proof or sample of your previous cuts?'),
        },
      ];
    }

    const isClient = currentUser.role === 'creator';
    const status = activeDeal.status;

    // Status: Pending funding / agreement drafted
    if (status === 'pending_funding' || status === 'pending') {
      return [
        {
          id: 'fund-escrow',
          label: 'Fund Escrow (Razorpay)',
          icon: '🔒',
          highlight: true,
          action: () => {
            if (onFundEscrow) onFundEscrow();
            else onOpenDealModal();
          },
        },
        {
          id: 'check-status',
          label: 'Check Escrow Status',
          icon: '⚡',
          action: () => onSendMessage(`⚡ [Escrow Status]: Contract for "${activeDeal.title || activeDeal.serviceType}" (₹${activeDeal.amount.toLocaleString('en-IN')}) is awaiting Escrow deposit. 3% platform commission reserved.`),
        },
        {
          id: 'request-revision',
          label: 'Modify Terms',
          icon: '✏️',
          action: () => onOpenDealModal(),
        },
        {
          id: 'vakra-escrow-help',
          label: 'Escrow Guarantee Info',
          icon: '🛡️',
          action: () => onSendMessage('Can we confirm the deadline and revision terms before locking funds into the RBI-compliant escrow vault?'),
        },
      ];
    }

    // Status: Escrow Secured & Active Work in progress
    if (status === 'escrow_secured' && !workDelivery) {
      return [
        {
          id: 'check-escrow-status',
          label: 'Check Escrow Status',
          icon: '🔒',
          action: () => onSendMessage(`🔒 [Escrow Secured]: ₹${activeDeal.amount.toLocaleString('en-IN')} is locked in VERILANCE Escrow. Freelancer net payout ₹${activeDeal.netPayout.toLocaleString('en-IN')} (3% commission: ₹${activeDeal.commissionFee}). Deadline: ${activeDeal.deadline}.`),
        },
        {
          id: 'submit-work-now',
          label: isClient ? 'Request Status Update' : 'Submit Draft Proof',
          icon: isClient ? '⏱️' : '🎬',
          highlight: !isClient,
          action: () => {
            if (isClient) {
              onSendMessage('Hi! How is the edit pacing coming along? Looking forward to reviewing the watermarked draft!');
            } else {
              onSubmitWork();
            }
          },
        },
        {
          id: 'send-view-once',
          label: 'Send View-Once Proof',
          icon: '①',
          action: () => setShowSendViewOnceModal(true),
        },
        {
          id: 'timeline-reminder',
          label: 'Deadline Check',
          icon: '📅',
          action: () => onSendMessage(`Reminder: Target delivery deadline is ${activeDeal.deadline}. Everything on track?`),
        },
      ];
    }

    // Status: Work Submitted (Watermarked delivery under review)
    if (status === 'work_submitted' || (activeDeal && workDelivery && !workDelivery.isApproved)) {
      return [
        {
          id: 'approve-release',
          label: 'Looks Good! Approve & Release',
          icon: '🎉',
          highlight: true,
          action: () => {
            soundEffects.playNotificationSound();
            onApproveAndRelease();
          },
        },
        {
          id: 'request-revision',
          label: 'Request Revision',
          icon: '🔄',
          action: () => {
            soundEffects.playTabClick();
            onSendMessage('🔄 [Revision Requested]: Reviewed the draft proof. Could you tweak the audio normalization and speed up the intro cut by 2 seconds?');
          },
        },
        {
          id: 'check-escrow-status',
          label: 'Check Escrow Status',
          icon: '🔒',
          action: () => onSendMessage(`🔒 [Escrow Status]: ₹${activeDeal.netPayout.toLocaleString('en-IN')} held securely. Funds only release when Client approves the watermark preview.`),
        },
        {
          id: 'raise-dispute',
          label: 'Dispute / Arbitration',
          icon: '🚨',
          action: () => {
            if (onRaiseDispute) {
              onRaiseDispute('Work quality or deadline variance inquiry.');
            } else {
              onSendMessage('🚨 [Notice]: Requesting review from VERILANCE dispute resolution team regarding current milestone.');
            }
          },
        },
      ];
    }

    // Status: Released / Settled
    if (status === 'released') {
      return [
        {
          id: 'post-new-deal',
          label: 'Start Next Milestone',
          icon: '🤝',
          highlight: true,
          action: () => onOpenDealModal(),
        },
        {
          id: 'rate-review',
          label: '5★ Feedback Sent',
          icon: '⭐',
          action: () => onSendMessage('⭐️⭐️⭐️⭐️⭐️ Outstanding collaboration! 100% on time, clean cut, and instant escrow settlement. Looking forward to the next project!'),
        },
        {
          id: 'download-receipt',
          label: 'Escrow Receipt Confirmed',
          icon: '📄',
          action: () => onSendMessage(`📄 [VERILANCE Receipt]: Escrow ID ${activeDeal.id} successfully settled. ₹${activeDeal.netPayout.toLocaleString('en-IN')} disbursed. 3% platform commission: ₹${activeDeal.commissionFee}.`),
        },
        {
          id: 'check-wallet',
          label: 'Wallet Updated',
          icon: '💼',
          action: () => onSendMessage(`💼 Funds successfully reflected in wallet balance (₹${currentUser.walletBalance.toLocaleString('en-IN')}).`),
        },
      ];
    }

    // Status: Disputed
    return [
      {
        id: 'arbitration-status',
        label: 'Arbitration Status',
        icon: '⚖️',
        highlight: true,
        action: () => onSendMessage('⚖️ [VERILANCE Multi-Sig Tribunal]: Escrow is frozen in neutral multi-sig vault. Both parties may upload timestamped chat and raw source logs.'),
      },
      {
        id: 'submit-evidence',
        label: 'Submit Evidence',
        icon: '📁',
        action: () => onSendMessage('📁 Source timeline project files and original draft logs submitted for tribunal arbitration.'),
      },
      {
        id: 'settle-amicably',
        label: 'Approve & Settle Now',
        icon: '🤝',
        action: () => onApproveAndRelease(),
      },
      {
        id: 'contact-sentinel',
        label: 'Ask VAKRA AI',
        icon: '🛡️',
        action: () => onSendMessage('VAKRA: How does escrow arbitration work for partial delivery?'),
      },
    ];
  };

  const filteredChannels = channels.filter((c) => {
    const matchesTab = chatTypeTab === 'group' ? c.isGroup : !c.isGroup;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const safeActiveChannel: Channel = activeChannel || channels[0] || {
    id: 'ch-default',
    name: 'Direct Escrow Workspace',
    subtitle: 'End-to-End Encrypted',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    isGroup: false,
    unreadCount: 0,
    isOnline: true,
    lastActive: 'Active',
  };

  const popularEmojis = ['🤝', '🔥', '🎬', '🔒', '⚡', '👍', '✨', '💻', '💯', '🚀', '👀', '❤️'];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#090b0f]">
      {/* 1. LEFT PANEL: Minimalist Toggle Navigation between One-to-One and Group Chat */}
      <div 
        id="left-chat-channels-panel"
        className="w-full md:w-80 lg:w-72 xl:w-80 border-r border-white/10 flex flex-col bg-[#0b0e14] shrink-0 h-auto md:h-full"
      >
        {/* User Identity / Role Switcher Header */}
        <div className="p-3.5 border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div 
              onClick={onOpenOnboarding}
              className="flex items-center gap-2.5 cursor-pointer group"
              title="Click to edit profile & KYC"
            >
              <div className="relative">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10 group-hover:ring-cyan-400/50 transition"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-[#0b0e14]" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition truncate max-w-[110px]">
                    {currentUser.name}
                  </span>
                  {currentUser.hasVerifiedBadge && (
                    <span 
                      className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-[9px] font-extrabold text-white flex items-center gap-0.5 shadow-sm"
                      title="Gold-Tier Verified Escrow Badge (₹2,000 / 3 mo)"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      TRUST
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 capitalize block">
                  Role: <span className={currentUser.role === 'creator' ? 'text-cyan-400 font-semibold' : 'text-teal-400 font-semibold'}>
                    {currentUser.role === 'creator' ? 'Creator (Client)' : 'Video Editor (Freelancer)'}
                  </span>
                </span>
              </div>
            </div>

            {/* Quick Role Switcher Button */}
            <button
              id="btn-quick-switch-role"
              onClick={onToggleUserRole}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 hover:text-white transition flex items-center gap-1"
              title="Toggle role between Creator and Editor for demo testing"
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Switch</span>
            </button>
          </div>

          {/* Minimalist Toggle Navigation: One-to-One vs Group Chat */}
          <div className="grid grid-cols-2 p-1 bg-[#121620] rounded-xl border border-white/5">
            <button
              id="tab-direct-chat"
              onClick={() => {
                soundEffects.playTabClick();
                setChatTypeTab('direct');
              }}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                chatTypeTab === 'direct'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>One-to-One</span>
            </button>

            <button
              id="tab-group-chat"
              onClick={() => {
                soundEffects.playTabClick();
                setChatTypeTab('group');
              }}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                chatTypeTab === 'group'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Group Chat</span>
            </button>
          </div>

          {/* Channels Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141822] border border-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/40 transition"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredChannels.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-300">No active chats</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Connect with creators in the Marketplace to start a conversation.
                </p>
              </div>
            </div>
          ) : (
            filteredChannels.map((channel) => {
              const isSelected = safeActiveChannel.id === channel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => {
                    soundEffects.playSubTabClick();
                    onSelectChannel(channel);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition flex items-center gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/30 border border-cyan-500/30 text-white'
                      : 'hover:bg-white/5 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img 
                      src={channel.avatar} 
                      alt={channel.name} 
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10"
                    />
                    {channel.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-[#0b0e14]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">
                        {channel.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {channel.lastActive}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {channel.subtitle}
                    </p>
                  </div>

                  {channel.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {channel.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. MAIN CHAT AREA (WhatsApp Style UX with High-End Layout) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090c12] relative">
        {/* Chat Header */}
        <div 
          id="chat-header-bar"
          className="px-4 py-3 bg-[#0d1017]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0 z-20"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={safeActiveChannel.avatar} 
                alt={safeActiveChannel.name} 
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-cyan-500/30"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-[#0d1017]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide font-['Space_Grotesk']">
                  {safeActiveChannel.name}
                </h3>
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[9px] font-bold flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  KYC Verified
                </span>
              </div>
              <p className="text-[11px] text-cyan-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Online • Escrow Vault Protected
              </p>
            </div>
          </div>

          {/* Functional layout placeholders for Voice Calling & Video Calling with Coming Soon hover */}
          <div className="flex items-center gap-1.5">
            {/* Voice Calling Icon with "Coming Soon" hover state */}
            <div className="relative group">
              <button
                id="btn-voice-calling-placeholder"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
                aria-label="Voice Calling"
              >
                <Phone className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-cyan-500/30 text-[10px] text-cyan-300 font-semibold shadow-lg whitespace-nowrap">
                  📞 Voice Calling — Coming Soon
                </span>
              </div>
            </div>

            {/* Video Calling Icon with "Coming Soon" hover state */}
            <div className="relative group">
              <button
                id="btn-video-calling-placeholder"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
                aria-label="Video Calling"
              >
                <Video className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-cyan-500/30 text-[10px] text-cyan-300 font-semibold shadow-lg whitespace-nowrap">
                  📹 Video Calling — Coming Soon
                </span>
              </div>
            </div>

            {/* Quick Deal Icon in Header */}
            <button
              onClick={onOpenDealModal}
              className="px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5"
              title="Create Escrow Deal"
            >
              <span>🤝</span>
              <span className="hidden sm:inline">Deal</span>
            </button>
          </div>
        </div>

        {/* Scrollable Chat Feed Area */}
        <div 
          id="chat-feed-scroll"
          className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4"
        >
          {/* Daily Milestone Timestamp Separator */}
          <div className="flex items-center justify-center my-2">
            <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-white/5 border border-white/5 text-slate-400 shadow-sm">
              Today • Cryptographic End-to-End Escrow Channel
            </span>
          </div>

          {/* Active Deal Status Card inside Chat Feed */}
          {activeDeal && (
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0e141f] to-[#121926] p-4 shadow-xl text-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl shrink-0">
                  🤝
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white tracking-wide">
                      Active Escrow Deal: {activeDeal.serviceType}
                    </h4>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/10 text-cyan-300 font-semibold">
                      ₹{activeDeal.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Target Deadline: {activeDeal.deadline} • 3% Platform Fee Protected (₹{activeDeal.commissionFee})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {workDelivery ? (
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Work Submitted
                  </span>
                ) : (
                  <button
                    onClick={onSubmitWork}
                    className="px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow transition flex items-center gap-1"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Submit Work</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Render All Messages or Clean Slate Empty State */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[320px] py-12 px-6 text-center space-y-4 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/10 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="text-sm font-bold text-white tracking-wide font-['Space_Grotesk']">
                  Clean Slate • Escrow Chat Ready
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No chat history recorded. Send a message below, attach files, or initialize a verified milestone agreement with <strong className="text-cyan-300">Post Deal</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Anti-Screenshot & VAKRA Sentinel Active</span>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
            const isMe = msg.senderRole === currentUser.role || msg.senderId === currentUser.id;
            const isVakra = msg.senderRole === 'vakra';
            const isSystem = msg.senderRole === 'system';

            if (isVakra) {
              return (
                <div key={msg.id} className="flex justify-center my-3">
                  <div className="max-w-lg w-full rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-200 space-y-1.5 shadow-lg">
                    <div className="flex items-center justify-between text-amber-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" />
                        VAKRA Security Sentinel
                      </span>
                      <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                    </div>
                    <p className="leading-relaxed text-[11px] text-amber-100">
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            }

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="text-[11px] px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-cyan-400" />
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-[10px] font-semibold text-slate-400">
                    {msg.senderName}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {msg.timestamp}
                  </span>
                </div>

                {/* Message Bubble Variants */}
                <div 
                  className={`max-w-[85%] sm:max-w-md rounded-2xl p-3.5 text-xs leading-relaxed transition-all shadow-md ${
                    isMe
                      ? 'bg-gradient-to-tr from-[#132230] to-[#162d3f] border border-cyan-500/30 text-white rounded-tr-none'
                      : 'bg-[#141822] border border-white/10 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* Type 1: Regular Text */}
                  {msg.type === 'text' && (
                    <p className="text-xs text-slate-100 leading-relaxed break-words whitespace-pre-line">
                      {msg.text}
                    </p>
                  )}

                  {/* Type 2: Voice Message UI Player Node */}
                  {msg.type === 'voice' && (
                    <div className="space-y-2 w-64 sm:w-72">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsVoicePlaying(!isVoicePlaying)}
                          className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/30 transition"
                        >
                          {isVoicePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>

                        <div className="flex-1 space-y-1">
                          {/* Audio Waveform simulation bars */}
                          <div className="flex items-center gap-0.5 h-6">
                            {[40, 75, 55, 90, 30, 85, 100, 45, 60, 95, 80, 50, 65, 35, 70, 90, 55, 40, 80, 60, 45, 90, 70].map((h, i) => {
                              const isActive = (i / 23) * 100 <= voiceProgress;
                              return (
                                <div
                                  key={i}
                                  className={`flex-1 rounded-full transition-all ${
                                    isActive ? 'bg-cyan-400' : 'bg-white/20'
                                  }`}
                                  style={{ height: `${h}%` }}
                                />
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{isVoicePlaying ? '0:18' : '0:00'}</span>
                            <span>{msg.voiceDuration || '0:42'}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 italic">
                        Voice Note: Client explaining YouTube video pacing and sound effects.
                      </p>
                    </div>
                  )}

                  {/* Type 3: File Sharing / Image & Video Attachments Layout */}
                  {msg.type === 'file' && msg.fileAttachment && (
                    <div className="space-y-2">
                      <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0c1017]">
                        {msg.fileAttachment.type === 'video' ? (
                          <div className="relative aspect-video bg-slate-900 flex items-center justify-center group cursor-pointer">
                            <img 
                              src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80" 
                              alt="Footage thumbnail" 
                              className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-cyan-500/90 text-slate-950 flex items-center justify-center shadow-lg">
                                <Play className="w-5 h-5 ml-0.5" />
                              </div>
                            </div>
                            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-cyan-300 font-mono">
                              4K 60FPS
                            </span>
                          </div>
                        ) : null}

                        <div className="p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Film className="w-4 h-4 text-cyan-400 shrink-0" />
                            <div className="truncate">
                              <span className="text-xs font-bold text-white block truncate">
                                {msg.fileAttachment.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {msg.fileAttachment.size}
                              </span>
                            </div>
                          </div>

                          <button 
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white transition shrink-0"
                            title="Download project asset"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {msg.text && <p className="text-xs text-slate-200">{msg.text}</p>}
                    </div>
                  )}

                  {/* Type 4: View Once Media (WhatsApp Style Anti-Screen Capture) */}
                  {(msg.type === 'view_once' || msg.viewOnceMedia) && msg.viewOnceMedia && (
                    <div className="space-y-2.5 w-full max-w-sm">
                      <div className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                        msg.viewOnceMedia.isExpired 
                          ? 'bg-[#0f1117] border-white/10 opacity-80'
                          : 'bg-gradient-to-br from-[#121824] via-[#0d121c] to-[#0a0e17] border-cyan-500/40 shadow-xl shadow-cyan-950/50'
                      }`}>
                        {/* Background subtle neon glow when active */}
                        {!msg.viewOnceMedia.isExpired && (
                          <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
                        )}

                        <div className="flex items-start gap-3 relative z-10">
                          {/* Circular "①" badge */}
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                            msg.viewOnceMedia.isExpired
                              ? 'bg-slate-800/80 text-slate-500 border border-slate-700'
                              : 'bg-gradient-to-tr from-cyan-500/20 to-teal-500/30 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                          }`}>
                            {msg.viewOnceMedia.isExpired ? (
                              <EyeOff className="w-5 h-5 text-slate-500" />
                            ) : (
                              <div className="flex flex-col items-center justify-center">
                                <span className="text-base font-black font-mono leading-none text-cyan-300">1</span>
                                <span className="text-[7px] uppercase tracking-tighter font-bold text-cyan-400">ONCE</span>
                              </div>
                            )}
                          </div>

                          {/* Media Header & Description */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-extrabold uppercase tracking-wider ${
                                msg.viewOnceMedia.isExpired ? 'text-slate-400' : 'text-cyan-300'
                              }`}>
                                {msg.viewOnceMedia.isExpired
                                  ? 'Opened • Expired'
                                  : msg.viewOnceMedia.mediaType === 'video'
                                  ? 'Watch Video (1-Time Preview)'
                                  : 'View Photo (1-Time Preview)'}
                              </span>
                              {!msg.viewOnceMedia.isExpired && (
                                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-[9px] font-bold text-cyan-300 border border-cyan-500/40">
                                  PROTECTED
                                </span>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                              {msg.viewOnceMedia.title}
                            </p>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                              <span>{msg.viewOnceMedia.fileSize}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                                <Lock className="w-3 h-3 text-cyan-400" />
                                <span>Single View • Closes Permanently on Exit</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Clear Sender & Receiver View Once Indication */}
                        <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-[10px]">
                          <span className="text-cyan-300 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            {msg.senderId === currentUser.id ? 'You sent View Once attachment' : 'View Once attachment received'}
                          </span>
                          <span className="text-slate-400 font-mono text-[9px]">
                            {msg.viewOnceMedia.isExpired ? 'BUFFER PURGED' : 'ONE-TIME ACCESS'}
                          </span>
                        </div>

                        {/* Security Warning Badge */}
                        <div className={`mt-3 px-3 py-2 rounded-xl text-[11px] flex items-center gap-2 border ${
                          msg.viewOnceMedia.isExpired
                            ? 'bg-slate-900/60 border-slate-800 text-slate-500'
                            : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300/90'
                        }`}>
                          <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" />
                          <span className="leading-snug text-[10px] sm:text-[11px]">
                            {msg.viewOnceMedia.isExpired
                              ? 'Media buffer purged. Screenshots and re-opening blocked.'
                              : 'VERILANCE Protected Content • View Once • Anti-Screen Capture'}
                          </span>
                        </div>

                        {/* Action CTA Button */}
                        <div className="mt-3 pt-0.5">
                          {msg.viewOnceMedia.isExpired ? (
                            <button
                              disabled
                              className="w-full py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-500 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Opened • Access Destroyed</span>
                            </button>
                          ) : (
                            <button
                              id={`btn-open-viewonce-${msg.viewOnceMedia.id}`}
                              onClick={() => handleOpenViewOnce(msg.viewOnceMedia!)}
                              className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:brightness-110 active:scale-[0.99] text-slate-950 font-extrabold text-xs tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer group"
                            >
                              <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              <span>
                                {msg.viewOnceMedia.mediaType === 'video'
                                  ? 'Watch Video (1-Time Preview)'
                                  : 'View Photo (1-Time Preview)'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                      {msg.text && (
                        <p className="text-xs text-slate-200 px-1 leading-relaxed">{msg.text}</p>
                      )}
                    </div>
                  )}

                  {/* Read Receipts */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                    <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                </div>
              </div>
            );
          }))}

          {/* Inline Watermarked Video Preview if work submitted */}
          {workDelivery && (
            <div className="my-4">
              <WatermarkVideoPreview
                delivery={workDelivery}
                isClient={currentUser.role === 'creator'}
                onApproveAndRelease={onApproveAndRelease}
                isApproved={activeDeal?.status === 'released'}
                deadlineString={activeDeal?.deadline || '25 September 2026'}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. THE 🤝 DEAL ICON & TRANSACTION FORM TYPING BAR */}
        <div 
          id="chat-typing-bar-container"
          className="p-3 bg-[#0c0f16] border-t border-white/10 relative z-20"
        >
          {/* Interactive Emoji & Sticker Picker Popup */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-4 mb-2 p-3 rounded-2xl bg-[#121622] border border-cyan-500/30 shadow-2xl z-40 w-72">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-slate-300 font-semibold">
                <span>Emojis & Quick Reactions</span>
                <button 
                  onClick={() => setShowEmojiPicker(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2 text-xl">
                {popularEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleAddEmoji(emoji)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition text-center hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Shortcuts Bar (Submit Work & Scan Alert) */}
          <div className="flex items-center justify-between mb-2 px-1 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenDealModal}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center gap-1.5 transition"
              >
                <span>🤝 Create Escrow Agreement</span>
              </button>

              <button
                type="button"
                onClick={onSubmitWork}
                className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[11px] font-semibold flex items-center gap-1.5 transition"
              >
                <UploadCloud className="w-3 h-3" />
                <span>Submit Work (Watermarked)</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-400 hidden sm:inline">
              🔒 3% Fee Managed by VERILANCE
            </span>
          </div>

          {/* Pending Attachment Preview Tray with View Once Toggle */}
          {pendingAttachment && (
            <div className="mb-2.5 p-2.5 rounded-xl bg-[#101522] border border-cyan-500/30 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                {pendingAttachment.type === 'image' ? (
                  <img 
                    src={pendingAttachment.previewUrl} 
                    alt="Preview" 
                    className="w-10 h-10 rounded-lg object-cover border border-cyan-500/40 shrink-0"
                  />
                ) : pendingAttachment.type === 'video' ? (
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <Paperclip className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                    {pendingAttachment.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {pendingAttachment.sizeMb} • {pendingAttachment.type.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* View Once Toggle Button for Attachment */}
                <button
                  type="button"
                  id="btn-toggle-pending-view-once"
                  onClick={handleToggleViewOnce}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    isViewOnceToggleActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                  title="Toggle View Once mode for this attachment"
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-black font-mono leading-none ${
                    isViewOnceToggleActive ? 'border-cyan-400 text-cyan-300' : 'border-slate-500 text-slate-400'
                  }`}>
                    1
                  </div>
                  <span>View Once: <span className={isViewOnceToggleActive ? 'text-cyan-300 font-extrabold' : 'text-slate-400'}>{isViewOnceToggleActive ? 'ON' : 'OFF'}</span></span>
                </button>

                <button
                  type="button"
                  onClick={handleRemovePendingAttachment}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                  title="Remove attachment"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Active View Once Mode Banner if toggled without attachment yet */}
          {!pendingAttachment && isViewOnceToggleActive && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border border-cyan-400 bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[9px] font-black font-mono">
                  1
                </div>
                <span><strong>View Once Mode ON</strong>: Attach an image or video to send as a 1-time viewable asset.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSendViewOnceModal(true)}
                  className="text-[11px] underline hover:text-cyan-100 font-semibold"
                >
                  Samples
                </button>
                <button
                  type="button"
                  onClick={() => setIsViewOnceToggleActive(false)}
                  className="text-slate-400 hover:text-white text-[11px]"
                >
                  Turn Off
                </button>
              </div>
            </div>
          )}

          {/* CONTEXT-AWARE QUICK-REPLY ACTION BUTTONS (Apple x Linear Dark-Mode Cyberpunk) */}
          <div className="mb-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar no-scrollbar text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0 px-1 hidden sm:inline">
                Quick Actions:
              </span>
              {getContextQuickReplies().map((qr) => {
                const isHighlight = qr.highlight;
                return (
                  <button
                    key={qr.id}
                    type="button"
                    onClick={() => {
                      soundEffects.playSubTabClick();
                      qr.action();
                    }}
                    className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-sm active:scale-95 group ${
                      isHighlight
                        ? 'bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-cyan-500/30 border-cyan-400/60 text-cyan-200 hover:border-cyan-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                        : 'bg-[#10141e]/90 hover:bg-[#161c2a] border-white/10 hover:border-white/20 text-slate-300 hover:text-white'
                    }`}
                    title={qr.label}
                  >
                    <span className="text-xs group-hover:scale-110 transition-transform select-none">
                      {qr.icon}
                    </span>
                    <span className="whitespace-nowrap font-medium tracking-tight">
                      {qr.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2">
            {/* THE 🤝 DEAL ICON BUTTON */}
            <button
              type="button"
              id="deal-handshake-icon-btn"
              onClick={onOpenDealModal}
              title="Click to Create Escrow Deal (Protected Payment)"
              className="p-3 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-teal-400/20 hover:from-cyan-500/30 hover:to-teal-400/30 border border-cyan-500/40 text-cyan-300 hover:text-white transition shadow-md shadow-cyan-950/40 shrink-0 group relative"
              aria-label="Create Escrow Deal"
            >
              <span className="text-xl leading-none select-none group-hover:scale-110 transition inline-block">
                🤝
              </span>
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 shadow whitespace-nowrap">
                Create Deal
              </span>
            </button>

            {/* Attachment Button with Mobile Gallery Permission */}
            <button
              type="button"
              id="btn-chat-attach-media"
              onClick={handleTriggerChatAttach}
              className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 border border-white/10 transition shrink-0"
              title="Attach media, photos, or footage"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={chatFileInputRef}
              accept="image/*,video/*,.pdf,.zip"
              className="hidden"
              onChange={handleChatFileSelected}
            />

            {/* Dedicated View Once Toggle Button ("1" Icon) directly next to Attachment Button */}
            <button
              type="button"
              id="btn-toggle-view-once"
              onClick={handleToggleViewOnce}
              className={`p-2.5 rounded-xl border transition shrink-0 relative group ${
                isViewOnceToggleActive
                  ? 'bg-gradient-to-tr from-cyan-500/25 to-teal-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white'
              }`}
              title={isViewOnceToggleActive ? 'View Once is ON (Click to toggle OFF)' : 'Toggle View Once for attachments'}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black font-mono leading-none transition ${
                isViewOnceToggleActive ? 'border-cyan-400 text-cyan-200 bg-cyan-950/60 scale-105' : 'border-slate-500 text-slate-400'
              }`}>
                1
              </div>
              {isViewOnceToggleActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 shadow whitespace-nowrap z-30">
                {isViewOnceToggleActive ? '① View Once: Enabled' : '① View Once: Disabled'}
              </span>
            </button>

            {/* Emoji & Sticker Picker Icon */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition shrink-0"
              title="Emojis & Stickers"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Chat Text Input Field */}
            <div className="flex-1 relative">
              <input
                id="input-chat-message"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message, click ① for View Once, or 🤝 for Escrow..."
                className="w-full bg-[#141924] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition"
              />
            </div>

            {/* Voice Message Simulation Button */}
            <button
              type="button"
              onClick={() => {
                setIsRecording(!isRecording);
                if (!isRecording) {
                  setTimeout(() => {
                    setIsRecording(false);
                    onSendMessage("🎙️ [Voice Message • 0:34 seconds]");
                  }, 1200);
                }
              }}
              className={`p-2.5 rounded-xl border transition shrink-0 ${
                isRecording
                  ? 'bg-red-500 text-white border-red-400 animate-pulse'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
              }`}
              title="Simulate Voice Message"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Send Button */}
            <button
              type="submit"
              id="btn-send-chat"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 transition shrink-0 shadow-md shadow-cyan-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* ========================================================= */}
        {/* SEND VIEW ONCE MEDIA MODAL (EDITOR / USER CREATION MODAL) */}
        {/* ========================================================= */}
        {showSendViewOnceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-3xl bg-[#0f131d] border border-cyan-500/40 shadow-2xl shadow-cyan-950/80 p-6 space-y-5 text-slate-100 relative">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full border-2 border-cyan-400 flex items-center justify-center bg-cyan-500/20 text-cyan-300 font-bold font-mono text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Send View Once Media
                    </h3>
                    <p className="text-xs text-cyan-400 font-mono">
                      VERILANCE Anti-Screen Capture Protection Active
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSendViewOnceModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Media Type Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTabClick();
                    setViewOnceType('video');
                    setViewOnceTitle('Gadget Teardown Hook Cut (4K)');
                  }}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition ${
                    viewOnceType === 'video'
                      ? 'bg-cyan-500/15 border-cyan-500/60 text-white shadow-lg shadow-cyan-500/10'
                      : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div className="text-left">
                    <span className="text-xs font-bold block">1-Time Video</span>
                    <span className="text-[10px] text-slate-400">Single View + Capture Shield</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTabClick();
                    setViewOnceType('image');
                    setViewOnceTitle('Color Grade LUT Style Frame');
                  }}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition ${
                    viewOnceType === 'image'
                      ? 'bg-teal-500/15 border-teal-500/60 text-white shadow-lg shadow-teal-500/10'
                      : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-5 h-5 text-teal-400 shrink-0" />
                  <div className="text-left">
                    <span className="text-xs font-bold block">1-Time Photo</span>
                    <span className="text-[10px] text-slate-400">Single View Draft Proof</span>
                  </div>
                </button>
              </div>

              {/* Media Title Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Media Asset Title
                </label>
                <input
                  type="text"
                  value={viewOnceTitle}
                  onChange={(e) => setViewOnceTitle(e.target.value)}
                  placeholder="e.g., 4K Teaser Reel, Sound FX Cut..."
                  className="w-full bg-[#151a26] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              {/* Optional Caption Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Accompanying Note (Optional)
                </label>
                <input
                  type="text"
                  value={viewOnceCaption}
                  onChange={(e) => setViewOnceCaption(e.target.value)}
                  placeholder="e.g., Watch this 1-time hook cut and let me know if pacing is good."
                  className="w-full bg-[#151a26] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              {/* Protection Guarantees Checklist */}
              <div className="p-3.5 rounded-2xl bg-[#090c13] border border-white/10 space-y-2 text-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Integrated VERILANCE Anti-Theft Controls:</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Dynamic Floating Watermark: Viewer ID + IP stamped</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Auto-Blackout / Blur on Window Blur or Tab Switch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Right-click, Save-as, and Keyboard Screen Capture blocked</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSendViewOnceModal(false)}
                  className="w-1/3 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-bold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendCustomViewOnce}
                  className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:brightness-110 active:scale-[0.99] text-slate-950 font-extrabold text-xs tracking-wide shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Send 1-Time Protected Media</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW ONCE FULLSCREEN SECURITY MODAL OVERLAY */}
        {/* ========================================================= */}
        {activeViewOnceMedia && (
          <ViewOnceSecurityModal
            media={activeViewOnceMedia}
            currentUser={currentUser}
            onCloseAndExpire={() => handleCloseAndExpireViewOnce(activeViewOnceMedia.id)}
          />
        )}
        {/* Mobile Gallery Permission Dialog */}
        <GalleryPermissionModal
          isOpen={isGalleryPermModalOpen}
          onClose={() => setIsGalleryPermModalOpen(false)}
          onPermissionGranted={handleGalleryPermGranted}
          mediaType="all"
          sourceTitle="Chat Media & Footage Upload"
        />
      </div>
    </div>
  );
};
