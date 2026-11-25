import React, { useState, useRef, useEffect } from 'react';
import {
  Channel,
  ChatMessage,
  DealAgreement,
  UserProfile,
  WorkDelivery,
  ViewOnceMedia,
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
  Check,
  CheckCheck,
  ShieldAlert,
  Film,
  ShieldCheck,
  Users,
  User,
  Search,
  Download,
  AlertTriangle,
  UploadCloud,
  Eye,
  EyeOff,
  Lock,
  MessageSquare,
  Image as ImageIcon,
  X,
  RefreshCw,
  Loader2,
  Maximize2,
  FileArchive,
} from 'lucide-react';
import { WatermarkVideoPreview } from './WatermarkVideoPreview';
import { ViewOnceSecurityModal } from './ViewOnceSecurityModal';
import { GalleryPermissionModal } from './GalleryPermissionModal';
import { isMobileDevice, hasGalleryAccess } from '../lib/galleryPermission';
import { soundEffects } from '../lib/soundEffects';
import {
  resolveChunkedMediaUrl,
  formatFileSize,
  formatUploadSpeed,
  formatEta,
  MAX_CHAT_MEDIA_STANDARD_BYTES,
  MAX_CHAT_MEDIA_EXTENDED_BYTES,
} from '../lib/mediaUpload';

interface ChatSectionProps {
  currentUser: UserProfile;
  activeChannel?: Channel | null;
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendMediaMessage?: (
    file: File,
    options: { caption?: string; viewOnce: boolean; allowLargeChat?: boolean }
  ) => void;
  onPauseMediaMessage?: (messageId: string) => void;
  onResumeMediaMessage?: (messageId: string) => void;
  onCancelMediaMessage?: (messageId: string) => void;
  onRetryMediaMessage?: (messageId: string) => void;
  onSendViewOnceMedia?: (media: ViewOnceMedia, caption?: string) => void;
  onExpireViewOnceMedia?: (mediaId: string) => void;
  onOpenDealModal: () => void;
  onSubmitWork: () => void;
  onApproveAndRelease: () => void;
  onFundEscrow?: () => void;
  onRaiseDispute?: (reason: string) => void;
  activeDeal: DealAgreement | null;
  workDelivery: WorkDelivery | null;
}

interface PendingAttachment {
  file?: File;
  previewUrl: string;
  name: string;
  sizeMb: string;
  sizeBytes: number;
  type: 'video' | 'image' | 'file';
}

interface ChatMediaAttachmentViewProps {
  msg: ChatMessage;
  onPause?: (messageId: string) => void;
  onResume?: (messageId: string) => void;
  onCancel?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  onExpandImage: (url: string, title: string) => void;
}

const ChatMediaAttachmentView: React.FC<ChatMediaAttachmentViewProps> = ({
  msg,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onExpandImage,
}) => {
  const att = msg.fileAttachment!;
  const [resolvedUrl, setResolvedUrl] = useState<string>(att.url || '');
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const needsChunks =
      !!att.chunkedMediaId && (!att.url || att.url.startsWith('blob:'));

    if (!needsChunks) {
      setResolvedUrl(att.url || '');
      setResolveError(null);
      setIsResolving(false);
      return;
    }

    setIsResolving(true);
    setResolveError(null);
    resolveChunkedMediaUrl(att.chunkedMediaId!, att.mimeType)
      .then((url) => {
        if (active) {
          setResolvedUrl(url);
          setIsResolving(false);
        }
      })
      .catch((err) => {
        if (active) {
          setResolveError(err?.message || 'Media could not be loaded.');
          setIsResolving(false);
        }
      });

    return () => {
      active = false;
    };
  }, [att.chunkedMediaId, att.mimeType, att.url]);

  const handleDownload = async () => {
    if (!resolvedUrl) return;
    try {
      const a = document.createElement('a');
      a.href = resolvedUrl;
      a.download = att.name || 'verilance-media';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // ignore
    }
  };

  if (att.deliveryStatus === 'uploading' || att.deliveryStatus === 'paused') {
    const pct = att.uploadProgress ?? 5;
    const isPaused = att.deliveryStatus === 'paused';
    const transferred = att.bytesUploaded ? formatFileSize(att.bytesUploaded) : '0 B';
    const speedLabel = isPaused
      ? 'Paused'
      : att.uploadSpeedBps
      ? formatUploadSpeed(att.uploadSpeedBps)
      : 'Streaming...';
    const etaLabel = isPaused
      ? '—'
      : att.etaSeconds !== undefined
      ? formatEta(att.etaSeconds)
      : 'Calculating...';

    return (
      <div className="rounded-xl overflow-hidden border border-cyan-500/30 bg-[#0b1019] p-3 space-y-2.5 w-64 sm:w-80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isPaused ? (
              <Pause className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
            )}
            <span className="text-xs font-bold text-white truncate">{att.name}</span>
          </div>
          <span className="text-[11px] font-mono text-cyan-300 font-bold shrink-0">
            {pct}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${
              isPaused ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-400 to-teal-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
          <span>
            {transferred} / {att.size}
          </span>
          <span>
            {speedLabel} • ETA: {etaLabel}
          </span>
        </div>
        <div className="flex items-center justify-end gap-1.5 pt-0.5">
          {isPaused ? (
            onResume && (
              <button
                type="button"
                onClick={() => onResume(msg.id)}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>Resume</span>
              </button>
            )
          ) : (
            onPause && (
              <button
                type="button"
                onClick={() => onPause(msg.id)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Pause className="w-3 h-3" />
                <span>Pause</span>
              </button>
            )
          )}
          {onCancel && (
            <button
              type="button"
              onClick={() => onCancel(msg.id)}
              className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-400/40 text-red-200 text-[10px] font-bold cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  if (att.deliveryStatus === 'failed' || att.deliveryStatus === 'cancelled') {
    return (
      <div className="rounded-xl overflow-hidden border border-red-500/40 bg-red-950/20 p-3 space-y-2 w-64 sm:w-72">
        <div className="flex items-start gap-2 text-red-300">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">{att.name}</p>
            <p className="text-[10px] text-red-200/80">
              {att.deliveryError ||
                (att.deliveryStatus === 'cancelled'
                  ? 'Upload cancelled.'
                  : 'Upload failed due to network interruption.')}
            </p>
          </div>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={() => onRetry(msg.id)}
            className="w-full py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Delivery</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0c1017]">
        {att.type === 'image' && (
          <div className="relative bg-black/60">
            {isResolving ? (
              <div className="w-64 h-44 flex flex-col items-center justify-center gap-2 text-cyan-300 text-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading photo...</span>
              </div>
            ) : resolveError || !resolvedUrl ? (
              <div className="w-64 h-36 flex flex-col items-center justify-center gap-1.5 p-3 text-center text-slate-400 text-xs">
                <ImageIcon className="w-6 h-6 text-slate-500" />
                <span>{resolveError || 'Photo unavailable'}</span>
              </div>
            ) : (
              <div className="relative group cursor-pointer" onClick={() => onExpandImage(resolvedUrl, att.name)}>
                <img
                  src={resolvedUrl}
                  alt={att.name}
                  className="max-h-72 w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 border border-white/15 text-white opacity-0 group-hover:opacity-100 transition">
                  <Maximize2 className="w-3.5 h-3.5" />
                </span>
              </div>
            )}
          </div>
        )}

        {att.type === 'video' && (
          <div className="relative bg-black">
            {isResolving ? (
              <div className="w-64 sm:w-80 h-44 flex flex-col items-center justify-center gap-2 text-cyan-300 text-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading video stream...</span>
              </div>
            ) : resolveError || !resolvedUrl ? (
              <div className="w-64 sm:w-80 h-40 flex flex-col items-center justify-center gap-1.5 p-3 text-center text-slate-400 text-xs">
                <Film className="w-6 h-6 text-slate-500" />
                <span>{resolveError || 'Video unavailable'}</span>
              </div>
            ) : (
              <video
                src={resolvedUrl}
                controls
                playsInline
                preload="metadata"
                className="max-h-72 w-full bg-black"
              />
            )}
          </div>
        )}

        <div className="p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {att.type === 'video' ? (
              <Film className="w-4 h-4 text-cyan-400 shrink-0" />
            ) : att.type === 'image' ? (
              <ImageIcon className="w-4 h-4 text-teal-400 shrink-0" />
            ) : (
              <FileArchive className="w-4 h-4 text-slate-300 shrink-0" />
            )}
            <div className="truncate">
              <span className="text-xs font-bold text-white block truncate max-w-[180px]">
                {att.name}
              </span>
              <span className="text-[10px] text-slate-400">{att.size}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!resolvedUrl}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white transition shrink-0 cursor-pointer"
            title="Download project asset"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {msg.text && <p className="text-xs text-slate-200 whitespace-pre-line">{msg.text}</p>}
    </div>
  );
};

export const ChatSection: React.FC<ChatSectionProps> = ({
  currentUser,
  activeChannel,
  channels,
  onSelectChannel,
  messages,
  onSendMessage,
  onSendMediaMessage,
  onPauseMediaMessage,
  onResumeMediaMessage,
  onCancelMediaMessage,
  onRetryMediaMessage,
  onSendViewOnceMedia,
  onExpireViewOnceMedia,
  onOpenDealModal,
  onSubmitWork,
  onApproveAndRelease,
  onFundEscrow,
  onRaiseDispute,
  activeDeal,
  workDelivery,
}) => {
  const [inputText, setInputText] = useState('');
  const [chatTypeTab, setChatTypeTab] = useState<'direct' | 'group'>('direct');
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [voiceProgress] = useState(35);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [activeViewOnceMedia, setActiveViewOnceMedia] = useState<ViewOnceMedia | null>(null);
  const [showSendViewOnceModal, setShowSendViewOnceModal] = useState(false);
  const [viewOnceType, setViewOnceType] = useState<'video' | 'image'>('video');
  const [viewOnceTitle, setViewOnceTitle] = useState('Teaser Hook 4K Edit Proof');
  const [viewOnceCaption, setViewOnceCaption] = useState(
    '1-Time protected draft cut. Disappears after viewing.'
  );
  const [expandedImage, setExpandedImage] = useState<{ url: string; title: string } | null>(null);

  // View Once Toggle, 5 GB Chat Mode & 1-Time Msg Confirmation Popup
  const [isViewOnceToggleActive, setIsViewOnceToggleActive] = useState<boolean>(false);
  const [allowLargeChat5GB, setAllowLargeChat5GB] = useState<boolean>(false);
  const [chatAttachError, setChatAttachError] = useState<string | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [pendingNonViewOnceConfirm, setPendingNonViewOnceConfirm] = useState<{
    attachment: PendingAttachment;
    caption: string;
  } | null>(null);

  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const [isGalleryPermModalOpen, setIsGalleryPermModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, workDelivery]);

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
      setChatAttachError(null);
      const activeLimit = allowLargeChat5GB
        ? MAX_CHAT_MEDIA_EXTENDED_BYTES
        : MAX_CHAT_MEDIA_STANDARD_BYTES;

      if (file.size > MAX_CHAT_MEDIA_EXTENDED_BYTES) {
        setChatAttachError(
          `File "${file.name}" (${formatFileSize(file.size)}) exceeds the 5 GB maximum transfer limit.`
        );
        e.target.value = '';
        return;
      }

      if (file.size > activeLimit) {
        setAllowLargeChat5GB(true);
      }

      const sizeMb = formatFileSize(file.size);
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
        sizeMb,
        sizeBytes: file.size,
        type: mediaType,
      });
      e.target.value = '';
    }
  };

  const handleRemovePendingAttachment = () => {
    if (pendingAttachment?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(pendingAttachment.previewUrl);
    }
    setPendingAttachment(null);
    setChatAttachError(null);
  };

  const dispatchMediaAttachment = (
    attachment: PendingAttachment,
    caption: string,
    useViewOnce: boolean
  ) => {
    if (attachment.file && onSendMediaMessage) {
      onSendMediaMessage(attachment.file, {
        caption: caption || undefined,
        viewOnce: useViewOnce,
        allowLargeChat: allowLargeChat5GB || attachment.sizeBytes > MAX_CHAT_MEDIA_STANDARD_BYTES,
      });
    } else if (useViewOnce) {
      const newMedia: ViewOnceMedia = {
        id: `vo-${Date.now()}`,
        mediaType: attachment.type === 'video' ? 'video' : 'image',
        title: attachment.name,
        url: attachment.previewUrl,
        thumbnailUrl: attachment.previewUrl,
        fileSize: attachment.sizeMb,
        isExpired: false,
      };
      if (onSendViewOnceMedia) {
        onSendViewOnceMedia(newMedia, caption || undefined);
      } else {
        onSendMessage(
          `[View Once ${attachment.type === 'video' ? 'Video' : 'Photo'}: ${attachment.name}]`
        );
      }
    } else {
      const tag = `[Attached: ${attachment.name} • ${attachment.sizeMb}]`;
      onSendMessage(caption ? `${caption}\n${tag}` : tag);
    }
  };

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
      title:
        viewOnceTitle.trim() ||
        (viewOnceType === 'video' ? 'Protected Video Preview' : 'Protected Image Preview'),
      url:
        viewOnceType === 'video'
          ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
          : 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1200&auto=format&fit=crop&q=80',
      thumbnailUrl:
        viewOnceType === 'video'
          ? 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=300&auto=format&fit=crop&q=80',
      fileSize: viewOnceType === 'video' ? '18.4 MB • 4K 60FPS' : '4.2 MB • RAW TIFF',
      isExpired: false,
    };

    if (onSendViewOnceMedia) {
      onSendViewOnceMedia(newMedia, viewOnceCaption);
    } else {
      onSendMessage(
        `[View Once ${viewOnceType === 'video' ? 'Video' : 'Photo'}: ${newMedia.title}]`
      );
    }

    setShowSendViewOnceModal(false);
    setViewOnceCaption('');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (pendingAttachment) {
      const caption = inputText.trim();
      const isPhotoOrVideo =
        pendingAttachment.type === 'image' || pendingAttachment.type === 'video';

      // Ask confirmation instead of blocking when View Once is OFF for photo/video
      if (isPhotoOrVideo && !isViewOnceToggleActive) {
        setPendingNonViewOnceConfirm({
          attachment: pendingAttachment,
          caption,
        });
        return;
      }

      dispatchMediaAttachment(pendingAttachment, caption, isViewOnceToggleActive);
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

  const handleConfirmSendAnyway = () => {
    if (!pendingNonViewOnceConfirm) return;
    const { attachment, caption } = pendingNonViewOnceConfirm;
    dispatchMediaAttachment(attachment, caption, false);
    setPendingNonViewOnceConfirm(null);
    setPendingAttachment(null);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleConfirmUseViewOnce = () => {
    if (!pendingNonViewOnceConfirm) return;
    const { attachment, caption } = pendingNonViewOnceConfirm;
    setIsViewOnceToggleActive(true);
    dispatchMediaAttachment(attachment, caption, true);
    setPendingNonViewOnceConfirm(null);
    setPendingAttachment(null);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  // Context-Aware Quick Replies
  interface QuickReplyItem {
    id: string;
    label: string;
    icon: string;
    highlight?: boolean;
    action: () => void;
  }

  const getContextQuickReplies = (): QuickReplyItem[] => {
    if (!activeDeal) {
      return [
        {
          id: 'create-deal',
          label: 'Create Escrow Deal',
          icon: '🤝',
          action: () => onOpenDealModal(),
        },
        {
          id: 'request-quote',
          label: 'Request Quotation',
          icon: '📋',
          action: () =>
            onSendMessage(
              'Hi! Can you share the timeline and scope details for this project? Let’s lock it with a VERILANCE Escrow deal.'
            ),
        },
        {
          id: 'vakra-check',
          label: 'Scan Contract Terms',
          icon: '🛡️',
          action: () =>
            onSendMessage(
              'Checking the terms against VERILANCE 2% anti-fraud escrow guidelines. Can you confirm the final milestone?'
            ),
        },
        {
          id: 'view-portfolio',
          label: 'Review Work Samples',
          icon: '🎬',
          action: () =>
            onSendMessage('Can you send a 1-time View Once proof or sample of your previous cuts?'),
        },
      ];
    }

    const isClient = currentUser.role === 'creator';
    const status = activeDeal.status;

    if (status === 'draft' || status === 'pending_funding' || status === 'pending') {
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
          action: () =>
            onSendMessage(
              `[Escrow Status]: Contract for "${activeDeal.title || activeDeal.serviceType}" (₹${activeDeal.amount.toLocaleString('en-IN')}) is awaiting Escrow deposit. 2% platform commission reserved.`
            ),
        },
        {
          id: 'request-revision',
          label: 'Modify Terms',
          icon: '✏️',
          action: () => onOpenDealModal(),
        },
      ];
    }

    if (status === 'escrow_secured' && !workDelivery) {
      return [
        {
          id: 'check-escrow-status',
          label: 'Check Escrow Status',
          icon: '🔒',
          action: () =>
            onSendMessage(
              `[Escrow Secured]: ₹${activeDeal.amount.toLocaleString('en-IN')} is locked in VERILANCE Escrow. Freelancer net payout ₹${activeDeal.netPayout.toLocaleString('en-IN')} (2% commission: ₹${activeDeal.commissionFee}). Deadline: ${activeDeal.deadline}.`
            ),
        },
        {
          id: 'submit-work-now',
          label: isClient ? 'Request Status Update' : 'Submit Draft Proof',
          icon: isClient ? '⏱️' : '🎬',
          highlight: !isClient,
          action: () => {
            if (isClient) {
              onSendMessage(
                'Hi! How is the edit pacing coming along? Looking forward to reviewing the watermarked draft!'
              );
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
      ];
    }

    if (
      status === 'work_submitted' ||
      status === 'revision_requested' ||
      (activeDeal && workDelivery && !workDelivery.isApproved)
    ) {
      return [
        {
          id: 'approve-release',
          label: 'Approve & Release',
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
            onSendMessage(
              '[Revision Requested]: Reviewed the draft proof. Please adjust pacing and audio mix as noted in the deliverables.'
            );
          },
        },
        {
          id: 'raise-dispute',
          label: 'Dispute / Arbitration',
          icon: '🚨',
          action: () => {
            if (onRaiseDispute) {
              onRaiseDispute('Work quality or deadline variance inquiry.');
            }
          },
        },
      ];
    }

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
          id: 'download-receipt',
          label: 'Escrow Receipt',
          icon: '📄',
          action: () =>
            onSendMessage(
              `[VERILANCE Receipt]: Escrow ID ${activeDeal.id} settled. ₹${activeDeal.netPayout.toLocaleString('en-IN')} disbursed. 2% platform fee: ₹${activeDeal.commissionFee}.`
            ),
        },
      ];
    }

    return [
      {
        id: 'arbitration-status',
        label: 'Arbitration Status',
        icon: '⚖️',
        highlight: true,
        action: () =>
          onSendMessage(
            '[VERILANCE Multi-Sig Tribunal]: Escrow is frozen while evidence and delivery hashes are reviewed.'
          ),
      },
      {
        id: 'settle-amicably',
        label: 'Approve & Settle Now',
        icon: '🤝',
        action: () => onApproveAndRelease(),
      },
    ];
  };

  // Never list self-conversation channels
  const peerChannels = channels.filter(
    (c) =>
      c.participantId !== currentUser.id &&
      (!c.participantUsername ||
        !currentUser.username ||
        c.participantUsername.toLowerCase() !== currentUser.username.toLowerCase())
  );

  const filteredChannels = peerChannels.filter((c) => {
    const matchesTab = chatTypeTab === 'group' ? c.isGroup : !c.isGroup;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const resolvedActiveChannel: Channel | null =
    (activeChannel && activeChannel.participantId !== currentUser.id ? activeChannel : null) ||
    peerChannels[0] ||
    null;

  const popularEmojis = ['🤝', '🔥', '🎬', '🔒', '⚡', '👍', '✨', '💻', '💯', '🚀', '👀', '❤️'];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#090b0f]">
      {/* 1. LEFT PANEL: Conversations List Only (No redundant self-profile card) */}
      <div
        id="left-chat-channels-panel"
        className="w-full md:w-80 lg:w-72 xl:w-80 border-r border-white/10 flex flex-col bg-[#0b0e14] shrink-0 h-auto md:h-full"
      >
        <div className="p-3.5 border-b border-white/5 space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Conversations
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 rounded-full">
              {peerChannels.length}
            </span>
          </div>

          {/* Minimalist Toggle Navigation: One-to-One vs Group Chat */}
          <div className="grid grid-cols-2 p-1 bg-[#121620] rounded-xl border border-white/5">
            <button
              type="button"
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
              type="button"
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
            <div className="py-10 px-4 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-300">No active chats</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Message another creator or editor from the Marketplace to start an escrow thread.
                </p>
              </div>
            </div>
          ) : (
            filteredChannels.map((channel) => {
              const isSelected = resolvedActiveChannel?.id === channel.id;
              return (
                <button
                  type="button"
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
                      <span className="text-[10px] text-slate-500">{channel.lastActive}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {channel.participantUsername ? `@${channel.participantUsername}` : channel.subtitle}
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

      {/* 2. MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090c12] relative">
        {/* Chat Header (Other Participant Only — never renders own email or self info) */}
        <div
          id="chat-header-bar"
          className="px-4 py-3 bg-[#0d1017]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0 z-20"
        >
          {resolvedActiveChannel ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={resolvedActiveChannel.avatar}
                  alt={resolvedActiveChannel.name}
                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-cyan-500/30"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-[#0d1017]" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide font-['Space_Grotesk']">
                    {resolvedActiveChannel.name}
                  </h3>
                  {resolvedActiveChannel.participantUsername && (
                    <span className="text-[11px] font-mono text-cyan-400/90">
                      @{resolvedActiveChannel.participantUsername}
                    </span>
                  )}
                  <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[9px] font-bold flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Escrow Thread
                  </span>
                </div>
                <p className="text-[11px] text-cyan-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Online • {resolvedActiveChannel.subtitle || 'End-to-End Escrow Protected'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide font-['Space_Grotesk']">
                  Escrow Workspace
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select a conversation or open a chat from the Marketplace
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <div className="relative group">
              <button
                type="button"
                id="btn-voice-calling-placeholder"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
                aria-label="Voice Calling"
              >
                <Phone className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-cyan-500/30 text-[10px] text-cyan-300 font-semibold shadow-lg whitespace-nowrap">
                  Voice Calling — Coming Soon
                </span>
              </div>
            </div>

            <div className="relative group">
              <button
                type="button"
                id="btn-video-calling-placeholder"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
                aria-label="Video Calling"
              >
                <Video className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-cyan-500/30 text-[10px] text-cyan-300 font-semibold shadow-lg whitespace-nowrap">
                  Video Calling — Coming Soon
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenDealModal}
              className="px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Create Escrow Deal"
            >
              <span>🤝</span>
              <span className="hidden sm:inline">Deal</span>
            </button>
          </div>
        </div>

        {/* Scrollable Chat Feed */}
        <div
          id="chat-feed-scroll"
          className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4"
        >
          <div className="flex items-center justify-center my-2">
            <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-white/5 border border-white/5 text-slate-400 shadow-sm">
              Today • End-to-End Protected Escrow Channel
            </span>
          </div>

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
                    Target Deadline: {activeDeal.deadline} • 2% Platform Fee Protected (₹{activeDeal.commissionFee})
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
                    type="button"
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

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] py-12 px-6 text-center space-y-4 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/10 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="text-sm font-bold text-white tracking-wide font-['Space_Grotesk']">
                  {resolvedActiveChannel
                    ? `Chat with ${resolvedActiveChannel.name}`
                    : 'Escrow Chat Ready'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Send messages, photos, or videos below. Enable <strong className="text-cyan-300">① View Once</strong> for 1-time anti-capture protection or initialize a milestone contract with <strong className="text-cyan-300">Post Deal</strong>.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
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
                      <p className="leading-relaxed text-[11px] text-amber-100">{msg.text}</p>
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
                      {isMe ? 'You' : msg.senderName}
                    </span>
                    <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-md rounded-2xl p-3.5 text-xs leading-relaxed transition-all shadow-md ${
                      isMe
                        ? 'bg-gradient-to-tr from-[#132230] to-[#162d3f] border border-cyan-500/30 text-white rounded-tr-none'
                        : 'bg-[#141822] border border-white/10 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.type === 'text' && (
                      <p className="text-xs text-slate-100 leading-relaxed break-words whitespace-pre-line">
                        {msg.text}
                      </p>
                    )}

                    {msg.type === 'voice' && (
                      <div className="space-y-2 w-64 sm:w-72">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setIsVoicePlaying(!isVoicePlaying)}
                            className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/30 transition"
                          >
                            {isVoicePlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" />
                            )}
                          </button>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-0.5 h-6">
                              {[40, 75, 55, 90, 30, 85, 100, 45, 60, 95, 80, 50, 65, 35, 70, 90, 55, 40, 80, 60, 45, 90, 70].map(
                                (h, i) => {
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
                                }
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>{isVoicePlaying ? '0:18' : '0:00'}</span>
                              <span>{msg.voiceDuration || '0:42'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {msg.type === 'file' && msg.fileAttachment && (
                      <ChatMediaAttachmentView
                        msg={msg}
                        onPause={onPauseMediaMessage}
                        onResume={onResumeMediaMessage}
                        onCancel={onCancelMediaMessage}
                        onRetry={onRetryMediaMessage}
                        onExpandImage={(url, title) => setExpandedImage({ url, title })}
                      />
                    )}

                    {(msg.type === 'view_once' || msg.viewOnceMedia) && msg.viewOnceMedia && (
                      <div className="space-y-2.5 w-full max-w-sm">
                        <div
                          className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                            msg.viewOnceMedia.isExpired
                              ? 'bg-[#0f1117] border-white/10 opacity-80'
                              : 'bg-gradient-to-br from-[#121824] via-[#0d121c] to-[#0a0e17] border-cyan-500/40 shadow-xl shadow-cyan-950/50'
                          }`}
                        >
                          <div className="flex items-start gap-3 relative z-10">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                                msg.viewOnceMedia.isExpired
                                  ? 'bg-slate-800/80 text-slate-500 border border-slate-700'
                                  : 'bg-gradient-to-tr from-cyan-500/20 to-teal-500/30 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                              }`}
                            >
                              {msg.viewOnceMedia.isExpired ? (
                                <EyeOff className="w-5 h-5 text-slate-500" />
                              ) : (
                                <div className="flex flex-col items-center justify-center">
                                  <span className="text-base font-black font-mono leading-none text-cyan-300">
                                    1
                                  </span>
                                  <span className="text-[7px] uppercase tracking-tighter font-bold text-cyan-400">
                                    ONCE
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-extrabold uppercase tracking-wider ${
                                    msg.viewOnceMedia.isExpired ? 'text-slate-400' : 'text-cyan-300'
                                  }`}
                                >
                                  {msg.viewOnceMedia.isExpired
                                    ? 'Opened • Expired'
                                    : msg.viewOnceMedia.mediaType === 'video'
                                    ? 'Watch Video (1-Time Msg)'
                                    : 'View Photo (1-Time Msg)'}
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
                                  <span>Destroys On Exit</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-[10px]">
                            <span className="text-cyan-300 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                              {isMe
                                ? 'You sent 1-Time Msg attachment'
                                : '1-Time Msg attachment received'}
                            </span>
                            <span className="text-slate-400 font-mono text-[9px]">
                              {msg.viewOnceMedia.isExpired ? 'BUFFER PURGED' : 'ONE-TIME ACCESS'}
                            </span>
                          </div>

                          <div className="mt-3 pt-0.5">
                            {msg.viewOnceMedia.isExpired ? (
                              <button
                                type="button"
                                disabled
                                className="w-full py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-500 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Opened • Access Destroyed</span>
                              </button>
                            ) : (
                              <button
                                type="button"
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

                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                      <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {workDelivery && (
            <div className="my-4">
              <WatermarkVideoPreview
                delivery={workDelivery}
                isClient={currentUser.role === 'creator'}
                onApproveAndRelease={onApproveAndRelease}
                isApproved={activeDeal?.status === 'released'}
                deadlineString={activeDeal?.deadline || '25 September 2026'}
                netPayout={activeDeal?.netPayout}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. CHAT COMPOSER BAR */}
        <div
          id="chat-typing-bar-container"
          className="p-3 bg-[#0c0f16] border-t border-white/10 relative z-20"
        >
          {showEmojiPicker && (
            <div className="absolute bottom-full left-4 mb-2 p-3 rounded-2xl bg-[#121622] border border-cyan-500/30 shadow-2xl z-40 w-72">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-slate-300 font-semibold">
                <span>Emojis & Quick Reactions</span>
                <button
                  type="button"
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

          <div className="flex items-center justify-between mb-2 px-1 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenDealModal}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>🤝 Create Escrow Agreement</span>
              </button>

              <button
                type="button"
                onClick={onSubmitWork}
                className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <UploadCloud className="w-3 h-3" />
                <span>Submit Work (Watermarked)</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Supports high-resolution videos &amp; project files up to 5 GB • 2% Fee
            </span>
          </div>

          {chatAttachError && (
            <div className="mb-2.5 p-2.5 rounded-xl bg-red-950/30 border border-red-500/40 flex items-center justify-between gap-2 text-xs text-red-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{chatAttachError}</span>
              </div>
              <button
                type="button"
                onClick={() => setChatAttachError(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pending Attachment Preview Tray */}
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
                  <video
                    src={pendingAttachment.previewUrl}
                    muted
                    className="w-12 h-10 rounded-lg object-cover border border-cyan-500/40 shrink-0 bg-black"
                  />
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
                <button
                  type="button"
                  onClick={() => setAllowLargeChat5GB((p) => !p)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                    allowLargeChat5GB || pendingAttachment.sizeBytes > MAX_CHAT_MEDIA_STANDARD_BYTES
                      ? 'bg-teal-500/20 text-teal-300 border-teal-400/50'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                  title="Toggle 5 GB Master Transfer mode in chat"
                >
                  {allowLargeChat5GB || pendingAttachment.sizeBytes > MAX_CHAT_MEDIA_STANDARD_BYTES
                    ? '5 GB Mode ON'
                    : 'Up to 500 MB'}
                </button>

                <button
                  type="button"
                  id="btn-toggle-pending-view-once"
                  onClick={() => setIsViewOnceToggleActive((p) => !p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    isViewOnceToggleActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                      : 'bg-white/5 text-slate-300 border border-white/15 hover:text-white hover:bg-white/10'
                  }`}
                  title="Toggle 1-Time Msg (View Once)"
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-black font-mono leading-none ${
                      isViewOnceToggleActive
                        ? 'border-cyan-400 text-cyan-300'
                        : 'border-slate-400 text-slate-300'
                    }`}
                  >
                    1
                  </div>
                  <span>
                    1-Time Msg:{' '}
                    <span
                      className={
                        isViewOnceToggleActive ? 'text-cyan-300 font-extrabold' : 'text-slate-400'
                      }
                    >
                      {isViewOnceToggleActive ? 'ON' : 'OFF'}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleRemovePendingAttachment}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                  title="Remove attachment"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {!pendingAttachment && isViewOnceToggleActive && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border border-cyan-400 bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[9px] font-black font-mono">
                  1
                </div>
                <span>
                  <strong>1-Time Msg ON</strong>: Attach a photo or video to send as View Once.
                </span>
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

          {/* Quick-Reply Action Chips */}
          <div className="mb-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar no-scrollbar text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0 px-1 hidden sm:inline">
                Quick Actions:
              </span>
              {getContextQuickReplies().map((qr) => (
                <button
                  key={qr.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playSubTabClick();
                    qr.action();
                  }}
                  className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-sm active:scale-95 group cursor-pointer ${
                    qr.highlight
                      ? 'bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-cyan-500/30 border-cyan-400/60 text-cyan-200 hover:border-cyan-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                      : 'bg-[#10141e]/90 hover:bg-[#161c2a] border-white/10 hover:border-white/20 text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="text-xs select-none">{qr.icon}</span>
                  <span className="whitespace-nowrap font-medium tracking-tight">{qr.label}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button
              type="button"
              id="deal-handshake-icon-btn"
              onClick={onOpenDealModal}
              title="Create Escrow Deal (Protected Payment)"
              className="p-3 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-teal-400/20 hover:from-cyan-500/30 hover:to-teal-400/30 border border-cyan-500/40 text-cyan-300 hover:text-white transition shadow-md shadow-cyan-950/40 shrink-0 group relative cursor-pointer"
              aria-label="Create Escrow Deal"
            >
              <span className="text-xl leading-none select-none group-hover:scale-110 transition inline-block">
                🤝
              </span>
            </button>

            <button
              type="button"
              id="btn-chat-attach-media"
              onClick={handleTriggerChatAttach}
              className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 border border-white/10 transition shrink-0 cursor-pointer"
              title="Attach photos, videos, or project files"
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

            <button
              type="button"
              id="btn-toggle-view-once"
              onClick={() => setIsViewOnceToggleActive((p) => !p)}
              className={`p-2.5 rounded-xl border transition shrink-0 relative group cursor-pointer ${
                isViewOnceToggleActive
                  ? 'bg-gradient-to-tr from-cyan-500/25 to-teal-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white'
              }`}
              title={
                isViewOnceToggleActive
                  ? '1-Time Msg (View Once) is ON'
                  : 'Toggle 1-Time Msg (View Once)'
              }
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black font-mono leading-none transition ${
                  isViewOnceToggleActive
                    ? 'border-cyan-400 text-cyan-200 bg-cyan-950/60 scale-105'
                    : 'border-slate-500 text-slate-400'
                }`}
              >
                1
              </div>
              {isViewOnceToggleActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition shrink-0 cursor-pointer"
              title="Emojis & Stickers"
            >
              <Smile className="w-4 h-4" />
            </button>

            <div className="flex-1 relative">
              <input
                id="input-chat-message"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  pendingAttachment
                    ? 'Add an optional caption or click Send...'
                    : 'Type a message, attach photo/video, or click ① for 1-Time Msg...'
                }
                className="w-full bg-[#141924] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setIsRecording(!isRecording);
                if (!isRecording) {
                  setTimeout(() => {
                    setIsRecording(false);
                    onSendMessage('[Voice Message • 0:34 seconds]');
                  }, 1200);
                }
              }}
              className={`p-2.5 rounded-xl border transition shrink-0 cursor-pointer ${
                isRecording
                  ? 'bg-red-500 text-white border-red-400 animate-pulse'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
              }`}
              title="Simulate Voice Message"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="submit"
              id="btn-send-chat"
              disabled={!inputText.trim() && !pendingAttachment}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 transition shrink-0 shadow-md shadow-cyan-500/20 cursor-pointer"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* ========================================================= */}
        {/* 1-TIME MSG CONFIRMATION MODAL (WHEN VIEW ONCE IS OFF)     */}
        {/* ========================================================= */}
        {pendingNonViewOnceConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div
              id="confirm-without-viewonce-modal"
              className="w-full max-w-md rounded-2xl bg-[#0f141e] border border-cyan-500/40 shadow-2xl p-6 space-y-4 text-slate-100"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-white font-['Space_Grotesk']">
                    Are you sure you want to send this message without 1-Time Msg?
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sending <span className="text-white font-semibold">{pendingNonViewOnceConfirm.attachment.name}</span> normally allows the recipient to view and replay it anytime. Switching to <span className="text-cyan-300 font-semibold">1-Time Msg</span> protects it with View Once & anti-capture guards.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  id="btn-cancel-confirm-viewonce"
                  onClick={() => setPendingNonViewOnceConfirm(null)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-send-anyway-normal"
                  onClick={handleConfirmSendAnyway}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-white transition cursor-pointer"
                >
                  Send Anyway
                </button>
                <button
                  type="button"
                  id="btn-use-one-time-msg"
                  onClick={handleConfirmUseViewOnce}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 text-xs font-extrabold shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span className="w-4 h-4 rounded-full border border-slate-950 flex items-center justify-center text-[9px] font-black font-mono">
                    1
                  </span>
                  <span>Use 1-Time Msg</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* IMAGE LIGHTBOX PREVIEW */}
        {expandedImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setExpandedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setExpandedImage(null)}
                className="absolute -top-10 right-0 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={expandedImage.url}
                alt={expandedImage.title}
                className="max-h-[85vh] w-auto rounded-2xl border border-white/15 object-contain"
              />
            </div>
          </div>
        )}

        {/* SEND VIEW ONCE MEDIA MODAL (SAMPLE PICKER) */}
        {showSendViewOnceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-3xl bg-[#0f131d] border border-cyan-500/40 shadow-2xl shadow-cyan-950/80 p-6 space-y-5 text-slate-100 relative">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full border-2 border-cyan-400 flex items-center justify-center bg-cyan-500/20 text-cyan-300 font-bold font-mono text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Send View Once Media</h3>
                    <p className="text-xs text-cyan-400 font-mono">
                      VERILANCE Anti-Screen Capture Protection Active
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSendViewOnceModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Media Asset Title</label>
                <input
                  type="text"
                  value={viewOnceTitle}
                  onChange={(e) => setViewOnceTitle(e.target.value)}
                  placeholder="e.g., 4K Teaser Reel, Sound FX Cut..."
                  className="w-full bg-[#151a26] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Accompanying Note (Optional)
                </label>
                <input
                  type="text"
                  value={viewOnceCaption}
                  onChange={(e) => setViewOnceCaption(e.target.value)}
                  className="w-full bg-[#151a26] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

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
                  className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:brightness-110 text-slate-950 font-extrabold text-xs tracking-wide shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Send 1-Time Protected Media</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeViewOnceMedia && (
          <ViewOnceSecurityModal
            media={activeViewOnceMedia}
            currentUser={currentUser}
            onCloseAndExpire={() => handleCloseAndExpireViewOnce(activeViewOnceMedia.id)}
          />
        )}

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
