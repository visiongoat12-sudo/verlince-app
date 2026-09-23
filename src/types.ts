export type UserRole = 'creator' | 'editor';

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  recoveryEmail?: string;
  role: UserRole;
  idDocumentName: string | null;
  hasVerifiedBadge: boolean;
  badgePurchasedAt?: string;
  badgeExpiresAt?: string;
  avatar: string;
  kycStatus: 'verified' | 'pending' | 'unverified' | 'rejected';
  walletBalance: number;
  kycData?: {
    legalName?: string;
    idType?: string;
    idNumber?: string;
    docFrontPreview?: string;
    docBackPreview?: string;
    selfiePreview?: string;
    bankAccount?: string;
    bankHolderName?: string;
    bankIfsc?: string;
    submittedAt?: string;
    reviewedAt?: string;
    rejectionReason?: string;
  };
}

export type DealStatus = 
  | 'no_deal'
  | 'pending_funding'
  | 'pending'
  | 'escrow_secured'
  | 'work_submitted'
  | 'released'
  | 'disputed';

export interface WorkDelivery {
  fileName: string;
  timestamp: string;
  formattedTime: string;
  deadlineComparison: string;
  isOnTime: boolean;
  fileSize: string;
  resolution: string;
  duration: string;
  watermarked: boolean;
  isApproved: boolean;
}

export interface DisputeInfo {
  caseId: string;
  reason: string;
  openedAt: string;
  status: 'under_investigation' | 'resolved';
}

export interface HistoryEvent {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: 'neutral' | 'secure' | 'submitted' | 'released' | 'disputed';
}

export interface DealAgreement {
  id: string;
  title: string;
  senderRole: 'client' | 'freelancer'; // client pays, freelancer receives
  senderName: string;
  receiverName: string;
  serviceType: string;
  amount: number;
  commissionFee: number;
  netPayout: number;
  deadline: string;
  description: string;
  paymentMethod: 'UPI' | 'PayPal' | 'Card' | string;
  status: DealStatus;
  createdAt: string;
  workDelivery?: WorkDelivery;
  dispute?: DisputeInfo;
  history: HistoryEvent[];
}

export interface ViewOnceMedia {
  id: string;
  mediaType: 'image' | 'video';
  title: string;
  url: string;
  thumbnailUrl?: string;
  fileSize: string;
  durationSeconds?: number;
  isExpired: boolean;
  openedAt?: string;
  openedByUserId?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole | 'system' | 'vakra';
  senderAvatar?: string;
  text?: string;
  timestamp: string;
  type: 'text' | 'voice' | 'file' | 'deal_invite' | 'vakra_alert' | 'work_card' | 'view_once';
  voiceDuration?: string;
  fileAttachment?: {
    name: string;
    size: string;
    type: 'video' | 'image' | 'zip';
    thumbnail?: string;
  };
  isWatermarkedPreview?: boolean;
  viewOnceMedia?: ViewOnceMedia;
}

export interface Channel {
  id: string;
  name: string;
  subtitle: string;
  avatar: string;
  isGroup: boolean;
  unreadCount: number;
  isOnline: boolean;
  lastActive: string;
  dealId?: string;
}

export interface CreatorProfile {
  id: string;
  userId?: string;
  name: string;
  username?: string;
  avatar: string;
  role: string;
  rating: number;
  reviewsCount: number;
  hourlyRate: string;
  tags: string[];
  bio: string;
  verifiedPro: boolean;
  sampleVideoTitle?: string;
  dealsCompleted: number;
  deliveryTime: string;
  createdAt?: string;
  portfolioUrl?: string;
}
