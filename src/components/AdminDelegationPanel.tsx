import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Crown, 
  UserCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Key, 
  UserX, 
  Check, 
  X, 
  Search, 
  Filter, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  UserPlus, 
  CheckCircle2, 
  FileText, 
  Wallet, 
  ExternalLink,
  History,
  Activity,
  Sliders,
  ChevronRight,
  ShieldOff,
  Eye,
  Info
} from 'lucide-react';
import { UserProfile, AdminPermissions, AdminAuditLog, DealAgreement } from '../types';
import { 
  isRootOwner, 
  isUserAdmin, 
  canManageAdmins, 
  canManageKYCEscrow, 
  getAdminTier, 
  ROOT_OWNER_EMAIL 
} from '../lib/adminSecurity';
import { 
  fetchAllUsersFromDB, 
  subscribeAllUsers, 
  updateUserPermissionsInDB, 
  revokeAdminAccessInDB, 
  updateUserKycStatusInDB,
  subscribeAuditLogs,
  fetchDealsFromDB,
  saveUserToDB
} from '../lib/firebase';
import { AdminBadge } from './AdminBadge';
import { soundEffects } from '../lib/soundEffects';
import { getRandomDefaultAvatar } from '../lib/defaultAvatars';

interface AdminDelegationPanelProps {
  currentUser: UserProfile;
  onClose?: () => void;
  onSelectUserForChat?: (user: UserProfile) => void;
}

export const AdminDelegationPanel: React.FC<AdminDelegationPanelProps> = ({
  currentUser,
  onClose,
  onSelectUserForChat,
}) => {
  // Access Guards
  const isRoot = isRootOwner(currentUser.email);
  const isAdmin = isRoot || isUserAdmin(currentUser);
  const userCanManageAdmins = isRoot || canManageAdmins(currentUser);
  const userCanManageKYC = isRoot || canManageKYCEscrow(currentUser);

  // Tabs: 'roles' (Delegation), 'kyc_escrow' (KYC & Escrow), 'audit' (Audit Logs)
  // If user cannot manage admins, default to 'kyc_escrow' or 'audit'
  const [activeTab, setActiveTab] = useState<'roles' | 'kyc_escrow' | 'audit'>(() => {
    if (userCanManageAdmins) return 'roles';
    if (userCanManageKYC) return 'kyc_escrow';
    return 'audit';
  });

  // State: Users list from Firestore
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'root' | 'admin' | 'standard'>('all');

  // Audit logs & deals
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [deals, setDeals] = useState<DealAgreement[]>([]);

  // Selected User for Promotion / Permission Editing Modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formCanManageAdmins, setFormCanManageAdmins] = useState<boolean>(false);
  const [formCanManageKYC, setFormCanManageKYC] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Quick 1-click Revoke Confirmation
  const [revokingUser, setRevokingUser] = useState<UserProfile | null>(null);

  // KYC Inspection Modal
  const [inspectingKycUser, setInspectingKycUser] = useState<UserProfile | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);

  // Real-time subscription to all registered users
  useEffect(() => {
    setIsLoadingUsers(true);
    const unsubscribeUsers = subscribeAllUsers((liveUsers) => {
      // Ensure Root Owner is always represented accurately
      let userList = [...liveUsers];
      const hasRootInList = userList.some(u => isRootOwner(u.email));

      if (!hasRootInList && isRoot) {
        userList.unshift(currentUser);
      }

      setUsers(userList);
      setIsLoadingUsers(false);
    });

    const unsubscribeAudit = subscribeAuditLogs((logs) => {
      setAuditLogs(logs);
    });

    fetchDealsFromDB().then((d) => setDeals(d)).catch(() => {});

    return () => {
      unsubscribeUsers();
      unsubscribeAudit();
    };
  }, [currentUser, isRoot]);

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (actionSuccessMessage || actionErrorMessage) {
      const t = setTimeout(() => {
        setActionSuccessMessage(null);
        setActionErrorMessage(null);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [actionSuccessMessage, actionErrorMessage]);

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const nameMatch = u.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const usernameMatch = u.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = !searchQuery || nameMatch || emailMatch || usernameMatch;

    if (!matchesSearch) return false;

    const isUserRoot = isRootOwner(u.email);
    const isUserAdm = isUserRoot || !!u.isAdmin;

    if (roleFilter === 'root') return isUserRoot;
    if (roleFilter === 'admin') return isUserAdm && !isUserRoot;
    if (roleFilter === 'standard') return !isUserAdm;
    return true;
  });

  // Action: Open Edit Permissions / Promote Modal
  const handleOpenEditModal = (targetUser: UserProfile) => {
    soundEffects.playTabClick();
    setEditingUser(targetUser);
    setFormCanManageAdmins(targetUser.permissions?.canManageAdmins ?? false);
    setFormCanManageKYC(targetUser.permissions?.canManageKYC_Escrow ?? true);
  };

  // Action: Save Delegation & Permissions to Firestore
  const handleSaveDelegation = async () => {
    if (!editingUser) return;

    // Security Verification: Only authorized delegators
    if (!userCanManageAdmins) {
      setActionErrorMessage('Access denied: You do not possess the `canManageAdmins` authorization.');
      soundEffects.playAlertWarningSound();
      return;
    }

    if (isRootOwner(editingUser.email)) {
      setActionErrorMessage('Root Owner has immutable tier-0 authority.');
      soundEffects.playAlertWarningSound();
      return;
    }

    setIsUpdating(true);
    setActionErrorMessage(null);

    try {
      const newPermissions: AdminPermissions = {
        canManageAdmins: formCanManageAdmins,
        canManageKYC_Escrow: formCanManageKYC,
        grantedAt: new Date().toISOString(),
        grantedBy: currentUser.email || 'Admin',
      };

      await updateUserPermissionsInDB(editingUser.id, {
        isAdmin: true,
        permissions: newPermissions,
        updatedByEmail: currentUser.email || 'Admin',
        updatedByName: currentUser.name,
        targetUserEmail: editingUser.email,
        targetUserName: editingUser.name,
      });

      soundEffects.playNotificationSound();
      setActionSuccessMessage(
        `Successfully delegated Admin rights to ${editingUser.name}. Permissions synced in Firestore.`
      );
      setEditingUser(null);
    } catch (err: any) {
      soundEffects.playAlertWarningSound();
      setActionErrorMessage(err.message || 'Failed to update user permissions in database.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Action: 1-Click Revoke Admin Access (Exclusive to Root Owner & Authorized Delegators)
  const handleConfirmRevoke = async () => {
    if (!revokingUser) return;

    if (!isRoot && !userCanManageAdmins) {
      setActionErrorMessage('Access denied: Only the Root Owner can revoke delegated admin access.');
      soundEffects.playAlertWarningSound();
      return;
    }

    if (isRootOwner(revokingUser.email)) {
      setActionErrorMessage('Critical Security Constraint: The Root Owner cannot be revoked.');
      soundEffects.playAlertWarningSound();
      return;
    }

    setIsUpdating(true);
    setActionErrorMessage(null);

    try {
      await revokeAdminAccessInDB(
        revokingUser.id,
        currentUser.email || 'Root Owner',
        currentUser.name
      );

      soundEffects.playAlertWarningSound();
      setActionSuccessMessage(
        `Admin access for ${revokingUser.name} has been revoked. Demoted back to standard user.`
      );
      setRevokingUser(null);
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Error revoking admin access.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Action: Quick in-line toggle for an admin user
  const handleToggleInlinePermission = async (
    targetUser: UserProfile,
    permissionKey: 'canManageAdmins' | 'canManageKYC_Escrow'
  ) => {
    if (!userCanManageAdmins) {
      setActionErrorMessage('Permission denied: You cannot modify admin delegations.');
      soundEffects.playAlertWarningSound();
      return;
    }

    if (isRootOwner(targetUser.email)) {
      setActionErrorMessage('The Root Owner authority cannot be modified.');
      soundEffects.playAlertWarningSound();
      return;
    }

    soundEffects.playToggleSound();
    const currentPerms = targetUser.permissions || { canManageAdmins: false, canManageKYC_Escrow: false };
    const updatedPerms: AdminPermissions = {
      ...currentPerms,
      [permissionKey]: !currentPerms[permissionKey],
      grantedAt: new Date().toISOString(),
      grantedBy: currentUser.email,
    };

    try {
      await updateUserPermissionsInDB(targetUser.id, {
        isAdmin: true,
        permissions: updatedPerms,
        updatedByEmail: currentUser.email || 'Admin',
        updatedByName: currentUser.name,
        targetUserEmail: targetUser.email,
        targetUserName: targetUser.name,
      });
      setActionSuccessMessage(`Updated ${permissionKey} = ${updatedPerms[permissionKey]} for ${targetUser.name}`);
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Failed to update toggle.');
    }
  };

  // Action: KYC Approval
  const handleApproveKyc = async (targetUser: UserProfile) => {
    if (!userCanManageKYC) {
      setActionErrorMessage('Permission denied: You do not possess `canManageKYC_Escrow` authorization.');
      return;
    }

    try {
      await updateUserKycStatusInDB(
        targetUser.id,
        'verified',
        currentUser.email || 'Admin',
        currentUser.name
      );
      soundEffects.playNotificationSound();
      setActionSuccessMessage(`KYC approved for ${targetUser.name}. User has been granted the Pro Verified Trust Shield.`);
      setInspectingKycUser(null);
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Failed to approve KYC.');
    }
  };

  // Action: KYC Rejection
  const handleRejectKyc = async (targetUser: UserProfile) => {
    if (!userCanManageKYC) {
      setActionErrorMessage('Permission denied: You do not possess `canManageKYC_Escrow` authorization.');
      return;
    }

    try {
      await updateUserKycStatusInDB(
        targetUser.id,
        'rejected',
        currentUser.email || 'Admin',
        currentUser.name,
        rejectionReasonInput || 'ID document unreadable or mismatched name.'
      );
      soundEffects.playAlertWarningSound();
      setActionSuccessMessage(`KYC rejected for ${targetUser.name}. Notification sent.`);
      setInspectingKycUser(null);
      setShowRejectInput(false);
      setRejectionReasonInput('');
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Failed to reject KYC.');
    }
  };

  // Helper: Quick seed test user so Root Owner can easily test role delegation
  const handleSeedDemoUser = async () => {
    const id = `user-test-${Date.now().toString().slice(-4)}`;
    const testUser: UserProfile = {
      id,
      name: 'Rohan Deshmukh',
      username: `rohan_cuts_${Math.floor(Math.random() * 900 + 100)}`,
      email: `rohan.editor${Math.floor(Math.random() * 900 + 100)}@verilance.io`,
      role: 'editor',
      idDocumentName: 'aadhaar_card_scan.pdf',
      hasVerifiedBadge: false,
      avatar: getRandomDefaultAvatar().svgDataUri,
      kycStatus: 'pending',
      walletBalance: 0,
      kycData: {
        legalName: 'Rohan Sanjay Deshmukh',
        idType: 'Aadhaar Card',
        idNumber: '8492-9182-3912',
        bankAccount: '0981029381029',
        bankHolderName: 'Rohan Deshmukh',
        bankIfsc: 'HDFC0001824',
        submittedAt: new Date().toISOString(),
      },
    };

    try {
      await saveUserToDB(testUser);
      soundEffects.playNotificationSound();
      setActionSuccessMessage('Created test user for delegation. You can now promote them to Admin!');
    } catch (err: any) {
      setActionErrorMessage('Failed to add demo user: ' + err.message);
    }
  };

  // Authority Tier Details for current logged in viewer
  const viewerTier = getAdminTier(currentUser);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 text-slate-200">
      {/* 1. TOP CYBERPUNK HUD BANNER */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0d121d] via-[#101726] to-[#0d121d] border border-white/10 p-5 sm:p-6 mb-6 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-amber-500/20 border border-white/10 shadow-inner">
              {isRoot ? (
                <Crown className="w-8 h-8 text-amber-400 animate-pulse" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-cyan-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-mono text-cyan-400/90 tracking-widest uppercase">
                  VERILANCE SEC-OPS // GOVERNANCE PROTOCOL
                </span>
                <AdminBadge user={currentUser} size="md" showDetails />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
                Multi-Tiered Admin Delegation & Control HUD
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Cryptographic authority delegation matrix. Hardcoded root owner tier ensures permanent platform custody while delegating operational privileges.
              </p>
            </div>
          </div>

          {/* Viewer Authority Card */}
          <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-3 self-start lg:self-center">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-slate-400 font-mono">Logged in authority:</div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
                <span>{currentUser.name}</span>
                <span className="text-cyan-400 font-mono">({currentUser.email})</span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end mt-0.5">
                <span>Role Assignment:</span>
                <span className={userCanManageAdmins ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {userCanManageAdmins ? '✓ Authorized' : '✗ Restricted'}
                </span>
                <span className="mx-1">•</span>
                <span>KYC/Escrow:</span>
                <span className={userCanManageKYC ? 'text-purple-400 font-bold' : 'text-slate-500'}>
                  {userCanManageKYC ? '✓ Authorized' : '✗ Restricted'}
                </span>
              </div>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition ml-2"
                title="Exit Admin HUD"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Global Success / Error Toast Alerts */}
        {actionSuccessMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-mono">{actionSuccessMessage}</span>
            </div>
            <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {actionErrorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="font-mono">{actionErrorMessage}</span>
            </div>
            <button onClick={() => setActionErrorMessage(null)} className="text-rose-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick Stat Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-slate-400 font-mono block">Registered Users</span>
            <span className="text-lg font-black text-white">{users.length}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] text-amber-300 font-mono block">Permanent Root Owner</span>
            <span className="text-lg font-black text-amber-300">1 (visiongoat12)</span>
          </div>

          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <span className="text-[10px] text-cyan-300 font-mono block">Delegated Admins</span>
            <span className="text-lg font-black text-cyan-300">
              {users.filter(u => u.isAdmin && !isRootOwner(u.email)).length}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <span className="text-[10px] text-purple-300 font-mono block">KYC Pending Review</span>
            <span className="text-lg font-black text-purple-300">
              {users.filter(u => u.kycStatus === 'pending').length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC ADMIN NAVIGATION TABS */}
      {/* Dynamic Guard: Show delegation tab ONLY to Root Owner or accounts where canManageAdmins === true */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0e131d] border border-white/10">
          {/* Tab 1: Roles & Delegation - Restricted to canManageAdmins */}
          {userCanManageAdmins ? (
            <button
              id="admin-tab-roles-delegation"
              onClick={() => {
                soundEffects.playTabClick();
                setActiveTab('roles');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'roles'
                  ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Admin Roles & Permissions</span>
              {isRoot && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold">
                  Root
                </span>
              )}
            </button>
          ) : (
            <div
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-500 cursor-not-allowed opacity-60"
              title="Restricted: Standard Admins without canManageAdmins cannot access delegation controls."
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Admin Roles & Permissions (Locked)</span>
            </div>
          )}

          {/* Tab 2: KYC & Escrow Overrides - Available if canManageKYC_Escrow */}
          {userCanManageKYC ? (
            <button
              id="admin-tab-kyc-escrow"
              onClick={() => {
                soundEffects.playTabClick();
                setActiveTab('kyc_escrow');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'kyc_escrow'
                  ? 'bg-gradient-to-r from-purple-500/25 to-pink-500/25 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span>KYC Approvals & Escrow Overrides</span>
              {users.filter(u => u.kycStatus === 'pending').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-[10px] font-bold">
                  {users.filter(u => u.kycStatus === 'pending').length}
                </span>
              )}
            </button>
          ) : (
            <div
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-500 cursor-not-allowed opacity-60"
              title="Restricted: Your account lacks canManageKYC_Escrow authority."
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>KYC & Escrow (Locked)</span>
            </div>
          )}

          {/* Tab 3: Security Audit Logs */}
          <button
            id="admin-tab-audit-logs"
            onClick={() => {
              soundEffects.playTabClick();
              setActiveTab('audit');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'audit'
                ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4 text-emerald-400" />
            <span>Security Audit Logs</span>
            <span className="text-[10px] font-mono text-slate-400">({auditLogs.length})</span>
          </button>
        </div>

        {/* Quick Actions (e.g. Seed test user if needed) */}
        {userCanManageAdmins && (
          <button
            onClick={handleSeedDemoUser}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-cyan-300 transition"
            title="Create a test user account to test delegation and revocation"
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Seed Test User</span>
          </button>
        )}
      </div>

      {/* 3. TAB CONTENT: ROLES & DELEGATION */}
      {activeTab === 'roles' && userCanManageAdmins && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d121c] border border-white/10 p-3.5 rounded-2xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or handle..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">Filter:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Users ({users.length})</option>
                <option value="root">Root Owner (1)</option>
                <option value="admin">Delegated Admins</option>
                <option value="standard">Standard Members</option>
              </select>
            </div>
          </div>

          {/* ADMIN ROLES & PERMISSIONS TABLE */}
          <div className="rounded-2xl bg-[#0d121c] border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-black/40 border-b border-white/10 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">User / Account</th>
                    <th className="py-3.5 px-3">Role Tier</th>
                    <th className="py-3.5 px-3 text-center">
                      <div className="flex flex-col items-center" title="Authority to assign and grant admin status">
                        <span>canManageAdmins</span>
                        <span className="text-[9px] text-cyan-400 font-normal">Role Delegation</span>
                      </div>
                    </th>
                    <th className="py-3.5 px-3 text-center">
                      <div className="flex flex-col items-center" title="Authority to approve KYC and override escrow">
                        <span>canManageKYC_Escrow</span>
                        <span className="text-[9px] text-purple-400 font-normal">KYC & Escrow</span>
                      </div>
                    </th>
                    <th className="py-3.5 px-3">KYC Status</th>
                    <th className="py-3.5 px-4 text-right">Delegation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                        Synchronizing real-time user registry from Firestore...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No registered users match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isUserRoot = isRootOwner(u.email);
                      const isUserAdminAccount = isUserRoot || !!u.isAdmin;
                      const hasAdminDelegation = isUserRoot || !!u.permissions?.canManageAdmins;
                      const hasKYCEscrow = isUserRoot || !!u.permissions?.canManageKYC_Escrow;

                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-white/[0.02] transition ${
                            isUserRoot ? 'bg-amber-500/[0.03]' : isUserAdminAccount ? 'bg-cyan-500/[0.02]' : ''
                          }`}
                        >
                          {/* User Avatar & Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                                  <span>{u.name}</span>
                                  {isUserRoot && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-black border border-amber-500/30">
                                      ROOT
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                                  <span>{u.email}</span>
                                  <span className="text-cyan-400/80">@{u.username || 'user'}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role Tier Badge */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <AdminBadge user={u} size="sm" />
                            {!isUserAdminAccount && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                                Standard {u.role === 'creator' ? 'Client' : 'Editor'}
                              </span>
                            )}
                          </td>

                          {/* Toggle 1: canManageAdmins */}
                          <td className="py-3.5 px-3 text-center">
                            {isUserRoot ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                                <Lock className="w-2.5 h-2.5" /> Immutable
                              </span>
                            ) : isUserAdminAccount ? (
                              <button
                                onClick={() => handleToggleInlinePermission(u, 'canManageAdmins')}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition border ${
                                  hasAdminDelegation
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 hover:bg-cyan-500/30'
                                    : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10 hover:text-slate-300'
                                }`}
                                title="Click to toggle canManageAdmins"
                              >
                                {hasAdminDelegation ? (
                                  <>
                                    <Check className="w-3 h-3 text-cyan-400" />
                                    <span>TRUE</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3 text-slate-500" />
                                    <span>FALSE</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-slate-600 font-mono text-[11px]">—</span>
                            )}
                          </td>

                          {/* Toggle 2: canManageKYC_Escrow */}
                          <td className="py-3.5 px-3 text-center">
                            {isUserRoot ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                                <Lock className="w-2.5 h-2.5" /> Immutable
                              </span>
                            ) : isUserAdminAccount ? (
                              <button
                                onClick={() => handleToggleInlinePermission(u, 'canManageKYC_Escrow')}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition border ${
                                  hasKYCEscrow
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/40 hover:bg-purple-500/30'
                                    : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10 hover:text-slate-300'
                                }`}
                                title="Click to toggle canManageKYC_Escrow"
                              >
                                {hasKYCEscrow ? (
                                  <>
                                    <Check className="w-3 h-3 text-purple-400" />
                                    <span>TRUE</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3 text-slate-500" />
                                    <span>FALSE</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-slate-600 font-mono text-[11px]">—</span>
                            )}
                          </td>

                          {/* KYC Status */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                                u.kycStatus === 'verified'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : u.kycStatus === 'pending'
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                                  : u.kycStatus === 'rejected'
                                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {u.kycStatus || 'unverified'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isUserRoot ? (
                              <span className="text-[11px] font-mono text-amber-400/70 inline-flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-400" />
                                Root Authority
                              </span>
                            ) : isUserAdminAccount ? (
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <button
                                  onClick={() => handleOpenEditModal(u)}
                                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 text-[11px] font-medium transition"
                                  title="Edit granular permissions"
                                >
                                  Configure
                                </button>

                                {/* 1-Click Revoke Admin Access for Root Owner & Delegators */}
                                <button
                                  onClick={() => setRevokingUser(u)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[11px] font-bold transition flex items-center gap-1"
                                  title="1-Click Revoke Admin Access"
                                >
                                  <ShieldOff className="w-3 h-3" />
                                  <span>Revoke</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenEditModal(u)}
                                className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 text-[11px] font-bold hover:brightness-110 shadow-md shadow-cyan-500/10 transition flex items-center gap-1 ml-auto"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>Promote to Admin</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: KYC & ESCROW OVERRIDES */}
      {activeTab === 'kyc_escrow' && userCanManageKYC && (
        <div className="space-y-6">
          {/* Pending KYC Submissions */}
          <div className="rounded-2xl bg-[#0d121c] border border-white/10 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">KYC Verification & Document Queue</h2>
              </div>
              <span className="text-xs font-mono text-purple-300 bg-purple-500/15 px-2.5 py-1 rounded-full border border-purple-500/30">
                {users.filter(u => u.kycStatus === 'pending').length} Pending Review
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-black/30 border-b border-white/10 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Applicant</th>
                    <th className="py-2.5 px-3">ID Type & Number</th>
                    <th className="py-2.5 px-3">Bank Details</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.filter(u => u.kycStatus === 'pending' || u.kycData?.legalName).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No pending KYC applications in the review pipeline.
                      </td>
                    </tr>
                  ) : (
                    users
                      .filter(u => u.kycStatus === 'pending' || u.kycData?.legalName)
                      .map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                              <div>
                                <span className="font-bold text-white block">{u.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <span className="text-white block">{u.kycData?.idType || 'Govt ID'}</span>
                            <span className="text-[10px] text-slate-400">{u.kycData?.idNumber || 'Pending number'}</span>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <span className="text-white block">A/C: {u.kycData?.bankAccount || 'None'}</span>
                            <span className="text-[10px] text-slate-400">IFSC: {u.kycData?.bankIfsc || 'N/A'}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                                u.kycStatus === 'verified'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : u.kycStatus === 'pending'
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {u.kycStatus}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                setInspectingKycUser(u);
                                setShowRejectInput(false);
                              }}
                              className="px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] font-medium transition"
                            >
                              Inspect & Verify
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Escrow Vaults & Overrides */}
          <div className="rounded-2xl bg-[#0d121c] border border-white/10 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Escrow Smart Vaults (2% Fee Protocol)</h2>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-500/15 px-2.5 py-1 rounded-full border border-cyan-500/30">
                {deals.length} Recorded Agreements
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-black/30 border-b border-white/10 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Deal ID / Title</th>
                    <th className="py-2.5 px-3">Client (Payer)</th>
                    <th className="py-2.5 px-3">Freelancer</th>
                    <th className="py-2.5 px-3">Vault Amount</th>
                    <th className="py-2.5 px-3">2% Fee / Payout</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {deals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No active escrow contracts in the vault registry.
                      </td>
                    </tr>
                  ) : (
                    deals.map((d) => (
                      <tr key={d.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{d.title || d.serviceType}</span>
                          <span className="text-[10px] text-cyan-400 font-mono">#{d.id}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{d.senderName}</td>
                        <td className="py-3 px-3 text-slate-300">{d.receiverName}</td>
                        <td className="py-3 px-3 font-mono font-bold text-white">
                          ₹{d.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <span className="text-cyan-400">2%: ₹{d.commissionFee}</span>
                          <span className="text-emerald-400 block">98%: ₹{d.netPayout}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: SECURITY AUDIT LEDGER */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl bg-[#0d121c] border border-white/10 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Cryptographic Security Audit Ledger</h2>
            </div>
            <span className="text-xs font-mono text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
              Immutable Operations Record
            </span>
          </div>

          <div className="space-y-2.5">
            {auditLogs.length === 0 ? (
              <div className="py-10 text-center text-slate-500 font-mono text-xs">
                No administrative mutations recorded in this session yet.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        log.action === 'promote_admin'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : log.action === 'revoke_admin'
                          ? 'bg-rose-500/20 text-rose-400'
                          : log.action === 'kyc_approved'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}
                    >
                      {log.action === 'promote_admin' ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : log.action === 'revoke_admin' ? (
                        <ShieldOff className="w-4 h-4" />
                      ) : log.action === 'kyc_approved' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Sliders className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white uppercase tracking-wide">
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300">By: {log.actorEmail}</span>
                      </div>
                      <p className="text-slate-400 mt-0.5">{log.details}</p>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 sm:text-right whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. MODAL: PROMOTE TO ADMIN & CONFIGURE DELEGATION TOGGLES */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0e131d] border border-cyan-500/30 p-6 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {editingUser.isAdmin ? 'Configure Delegated Admin Privileges' : 'Promote User to Delegated Admin'}
                </h3>
                <p className="text-xs text-slate-400">
                  Granular permission control stored in Firestore under <code className="text-cyan-400 font-mono">users/{editingUser.id}/permissions</code>
                </p>
              </div>
            </div>

            {/* Target User Info */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3 mb-5">
              <img src={editingUser.avatar} alt={editingUser.name} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <span className="font-bold text-white block">{editingUser.name}</span>
                <span className="text-xs text-cyan-400 font-mono">{editingUser.email}</span>
              </div>
            </div>

            {/* Granular Toggles */}
            <div className="space-y-4 mb-6">
              {/* Toggle A: canManageAdmins */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-mono">canManageAdmins</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      Sub-Delegation
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    If set to TRUE by Root Owner, this delegated Admin can also assign and grant Admin status to other users. If FALSE, role assignment is restricted.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playToggleSound();
                    setFormCanManageAdmins(prev => !prev);
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 cursor-pointer ${
                    formCanManageAdmins ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                      formCanManageAdmins ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle B: canManageKYC_Escrow */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-mono">canManageKYC_Escrow</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                      KYC & Vault
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Granular control allowing or disallowing access to KYC approvals and Escrow overrides.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playToggleSound();
                    setFormCanManageKYC(prev => !prev);
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 cursor-pointer ${
                    formCanManageKYC ? 'bg-purple-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                      formCanManageKYC ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDelegation}
                disabled={isUpdating}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 text-xs font-black hover:brightness-110 shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing with Firestore...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Delegated Permissions</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: 1-CLICK REVOKE CONFIRMATION FOR ROOT OWNER */}
      {revokingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0e131d] border border-rose-500/40 p-6 shadow-2xl relative animate-scaleIn">
            <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 w-12 h-12 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white">Revoke Delegated Admin Privileges?</h3>
            <p className="text-xs text-slate-400 mt-1">
              You are about to demote <strong className="text-white">{revokingUser.name}</strong> ({revokingUser.email}) back to a standard member. Their access to the Admin HUD, role assignment, and KYC approvals will be terminated instantly.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setRevokingUser(null)}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-semibold hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevoke}
                disabled={isUpdating}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black shadow-lg shadow-rose-500/20 transition flex items-center gap-1.5"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Revoking...</span>
                  </>
                ) : (
                  <>
                    <ShieldOff className="w-3.5 h-3.5" />
                    <span>Confirm 1-Click Revoke</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: INSPECT & VERIFY KYC */}
      {inspectingKycUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[#0e131d] border border-purple-500/40 p-6 shadow-2xl relative animate-scaleIn max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setInspectingKycUser(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">KYC Verification Dossier</h3>
                <p className="text-xs text-slate-400">Review legal identity documents & bank account for escrow payouts</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                <img src={inspectingKycUser.avatar} alt={inspectingKycUser.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <span className="font-bold text-white text-sm block">{inspectingKycUser.name}</span>
                  <span className="text-xs text-purple-400 font-mono">{inspectingKycUser.email}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Role: {inspectingKycUser.role}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 font-mono block">Legal Name</span>
                  <span className="text-xs font-bold text-white">
                    {inspectingKycUser.kycData?.legalName || inspectingKycUser.name}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 font-mono block">ID Type & Number</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {inspectingKycUser.kycData?.idType || 'Aadhaar Card'}: {inspectingKycUser.kycData?.idNumber || '8492-XXXX-XXXX'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 font-mono block">Bank Account Number</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {inspectingKycUser.kycData?.bankAccount || 'Not specified'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 font-mono block">Bank IFSC Code</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {inspectingKycUser.kycData?.bankIfsc || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-slate-400 font-mono block">Attached Document File</span>
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1 mt-1">
                  <FileText className="w-3.5 h-3.5" />
                  {inspectingKycUser.idDocumentName || 'Govt_ID_Scanned_Front_Back.pdf'}
                </span>
              </div>

              {showRejectInput && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                  <label className="text-xs font-bold text-rose-300 block">Rejection Reason</label>
                  <input
                    type="text"
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    placeholder="e.g. Mismatched legal name or blurry document scan"
                    className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-rose-500/40 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
              {!showRejectInput ? (
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold transition"
                >
                  Reject with Reason
                </button>
              ) : (
                <button
                  onClick={() => handleRejectKyc(inspectingKycUser)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
                >
                  Confirm Rejection
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectingKycUser(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-semibold hover:bg-white/10 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => handleApproveKyc(inspectingKycUser)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 text-xs font-black hover:brightness-110 shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve KYC Verification</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
