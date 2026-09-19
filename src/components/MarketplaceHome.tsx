import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  Lock, 
  Star, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Video, 
  Film, 
  Tv, 
  Layers, 
  Zap, 
  Award, 
  MessageSquare, 
  Check, 
  Clock, 
  Briefcase,
  Database,
  RefreshCw,
  Plus,
  Loader2,
  AlertCircle,
  X,
  Upload,
  ExternalLink,
  Shield,
  UserCheck
} from 'lucide-react';
import { CreatorProfile, UserRole } from '../types';
import { VerilanceLogo } from './VerilanceLogo';
import { 
  subscribeCreators, 
  saveCreatorToDB,
  fetchCreatorsFromDB
} from '../lib/firebase';

interface MarketplaceHomeProps {
  onOpenDealModal: () => void;
  onOpenProfile: () => void;
  onOpenChat: (talentName?: string) => void;
  currentUserRole: UserRole;
  onToggleRole: () => void;
}

export const MarketplaceHome: React.FC<MarketplaceHomeProps> = ({
  onOpenDealModal,
  onOpenProfile,
  onOpenChat,
  currentUserRole,
  onToggleRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'creators' | 'jobs'>('creators');

  // Real Database State (Dynamically fetched from Firestore)
  const [talents, setTalents] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);

  // New Creator Listing Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCreatorName, setNewCreatorName] = useState('');
  const [newCreatorUsername, setNewCreatorUsername] = useState('');
  const [newCreatorRole, setNewCreatorRole] = useState('Senior Video Editor');
  const [newCreatorRate, setNewCreatorRate] = useState('₹2,500 / video');
  const [newCreatorTags, setNewCreatorTags] = useState('Premiere Pro, After Effects, Color Grading');
  const [newCreatorBio, setNewCreatorBio] = useState('');
  const [newCreatorDelivery, setNewCreatorDelivery] = useState('24-48 Hours');
  const [newCreatorSampleTitle, setNewCreatorSampleTitle] = useState('Commercial Brand Showreel 4K');
  const [isSubmittingNewCreator, setIsSubmittingNewCreator] = useState(false);

  // Quick categories
  const categories = [
    { name: 'Video Editing', icon: Video, count: 'Top Editors' },
    { name: '3D Motion', icon: Layers, count: 'CGI Specialists' },
    { name: 'YouTube Shorts', icon: Film, count: 'High Retention' },
    { name: 'Reels', icon: Tv, count: 'Viral Hooks' },
    { name: 'Thumbnail Design', icon: Sparkles, count: 'CTR Optimized' },
    { name: 'VFX & Color Grading', icon: Zap, count: 'Post Specialists' },
  ];

  // Dynamic real-time subscription to Firebase Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initDatabase() {
      setLoading(true);
      setDbError(null);
      try {
        // Subscribe to live changes in Firestore
        unsubscribe = subscribeCreators((liveList) => {
          setTalents(liveList);
          setLoading(false);
          setIsLiveConnected(true);
        });
      } catch (err) {
        console.error('[MarketplaceHome] Error initializing Firestore database:', err);
        setDbError('Could not sync with Firestore database. Please verify connection.');
        setIsLiveConnected(false);
        setLoading(false);
      }
    }

    initDatabase();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchCreatorsFromDB();
      setTalents(data);
      setIsLiveConnected(true);
      setDbError(null);
    } catch (err) {
      console.error('Refresh error:', err);
      setDbError('Database refresh failed. Check network.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreatorName.trim() || !newCreatorRole.trim()) return;

    setIsSubmittingNewCreator(true);
    try {
      const tagsArray = newCreatorTags.split(',').map(t => t.trim()).filter(Boolean);
      const cleanUsername = newCreatorUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || 
        newCreatorName.trim().toLowerCase().replace(/\s+/g, '_');

      const newCreator: CreatorProfile = {
        id: `creator-${Date.now()}`,
        userId: `usr-${Date.now()}`,
        name: newCreatorName.trim(),
        username: cleanUsername,
        avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 500)}?w=200&auto=format&fit=crop&q=80`,
        role: newCreatorRole.trim(),
        rating: 5.0,
        reviewsCount: 1,
        hourlyRate: newCreatorRate.trim(),
        tags: tagsArray.length ? tagsArray : ['Video Editing', 'Post-Production'],
        bio: newCreatorBio.trim() || 'Verified professional creator on Verilance with protected escrow backing.',
        verifiedPro: true,
        sampleVideoTitle: newCreatorSampleTitle.trim() || '4K Client Cut Preview',
        dealsCompleted: 1,
        deliveryTime: newCreatorDelivery.trim() || '24-48 Hours',
        createdAt: new Date().toISOString()
      };

      await saveCreatorToDB(newCreator);
      setIsCreateModalOpen(false);
      // Reset form
      setNewCreatorName('');
      setNewCreatorUsername('');
      setNewCreatorBio('');
    } catch (err) {
      console.error('Failed to create creator listing:', err);
      alert('Failed to save to Firestore database. Please try again.');
    } finally {
      setIsSubmittingNewCreator(false);
    }
  };

  const filteredTalents = talents.filter((t) => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory = 
      selectedCategory === 'All' || 
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(selectedCategory.toLowerCase()))) ||
      t.role.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full bg-[#0A0B10] text-slate-100 min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. HERO SECTION (Upwork-inspired) */}
      <section className="relative pt-10 pb-14 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06] overflow-hidden">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          {/* Live Database Status Indicator Banner */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wide shadow-sm">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Anti-Scam Freelance Escrow Protocol</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>

            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border ${
              isLiveConnected 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Firestore DB: {isLiveConnected ? 'Connected (Real-time)' : 'Connecting...'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-400 font-sans">
                ({talents.length} Real Records)
              </span>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5 disabled:opacity-50"
              title="Refresh Firestore Database"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Sync DB</span>
            </button>
          </div>

          {/* Prominent Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-['Space_Grotesk'] leading-[1.15] max-w-4xl mx-auto">
            Find trusted creators & video editors for <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">top quality work</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Zero ghosting. Real verified creators loaded live from Firestore backend database with automated digital escrow and watermarked proof-of-work deliveries.
          </p>

          {/* Search Box with input for skill/service search */}
          <div className="max-w-3xl mx-auto pt-2">
            <div className="p-2 rounded-2xl bg-[#121216] border border-white/10 shadow-2xl flex flex-col sm:flex-row items-center gap-2 focus-within:border-cyan-500/50 transition-all">
              <div className="flex items-center gap-3 w-full px-3 py-2 text-slate-400">
                <Search className="w-5 h-5 text-cyan-400 shrink-0" />
                <input
                  id="marketplace-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search live creator database by name, handle, or skill (e.g., Premiere, 3D, Shorts)..."
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-500 hover:text-white px-2 py-0.5 rounded"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                <button
                  id="btn-hero-search-action"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.35)] transition flex items-center justify-center gap-2 shrink-0"
                >
                  <span>Search Talent</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick-Category Tag Row */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              <span className="text-xs text-slate-500 font-medium">Popular Categories:</span>
              {['Video Editing', '3D Motion', 'YouTube Shorts', 'Reels', 'Thumbnail Design', 'VFX'].map((tag) => (
                <button
                  key={tag}
                  id={`quick-tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => {
                    setSearchQuery(tag);
                    setSelectedCategory(tag);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                    searchQuery === tag || selectedCategory === tag
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                      : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-white hover:border-white/20'
                  }`}
                >
                  {tag}
                </button>
              ))}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="text-xs text-cyan-400 hover:underline px-2 py-1"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY CARDS GRID */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Space_Grotesk']">
              Browse Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Select a specialized creative vertical to filter verified talent listings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>+ Publish Creator Profile</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(isSelected ? 'All' : cat.name)}
                className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-500/20 to-teal-500/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                    : 'bg-[#121216] border-white/[0.06] hover:border-white/20 hover:bg-[#16171d]'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors mb-4 ${
                  isSelected 
                    ? 'bg-cyan-500 text-slate-950 font-bold' 
                    : 'bg-white/5 text-slate-300 group-hover:text-cyan-400 group-hover:bg-cyan-500/10'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {cat.count}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. DYNAMIC REAL-TIME CREATOR DIRECTORY */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Space_Grotesk']">
                Verified Creator & Editor Listings
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-semibold">
                Live Backend
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Fetched dynamically from Firebase Firestore. Every creator undergoes biometric or legal ID verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Showing <strong className="text-white">{filteredTalents.length}</strong> real {filteredTalents.length === 1 ? 'creator' : 'creators'}
            </span>
          </div>
        </div>

        {/* Database Error Banner if any */}
        {dbError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{dbError}</span>
            </div>
            <button
              onClick={handleManualRefresh}
              className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-white font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State: Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="p-6 rounded-2xl bg-[#121216] border border-white/[0.06] space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-white/10 rounded w-1/3" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-white/5 rounded w-full" />
                <div className="h-3 bg-white/5 rounded w-4/5" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-16 bg-white/5 rounded-full" />
                  <div className="h-6 w-20 bg-white/5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTalents.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 rounded-2xl bg-[#121216] border border-dashed border-white/10 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6 text-slate-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
                No creators matched your query in the live database
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'All' 
                  ? 'Try clearing your search query or selecting "All" categories to see all active database profiles.'
                  : 'Be the very first verified creator to publish a listing on Verilance!'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              {(searchQuery || selectedCategory !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white transition"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold text-xs transition"
              >
                + Publish New Creator Profile
              </button>
            </div>
          </div>
        ) : (
          /* Real Creator Cards from Firestore */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTalents.map((talent) => (
              <div
                key={talent.id}
                id={`talent-card-${talent.id}`}
                className="p-6 rounded-2xl bg-[#121216] border border-white/[0.07] hover:border-cyan-500/30 transition-all duration-300 space-y-5 relative group flex flex-col justify-between"
              >
                {/* Creator Header: Avatar, Name, Verified Badge, Rating, Rate */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img
                          src={talent.avatar}
                          alt={talent.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10 group-hover:ring-cyan-500/40 transition"
                        />
                        {talent.verifiedPro && (
                          <div 
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white ring-2 ring-[#121216]"
                            title="Verified Pro Escrow Badge"
                          >
                            <Sparkles className="w-3 h-3 fill-white" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {talent.name}
                          </h3>
                          {talent.username && (
                            <span className="text-xs text-cyan-400/80 font-mono">
                              @{talent.username}
                            </span>
                          )}
                          {talent.verifiedPro && (
                            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-purple-400/30 text-purple-300 text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              VERIFIED PRO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {talent.role}
                        </p>
                      </div>
                    </div>

                    {/* Hourly/Project Rate Pill */}
                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
                        {talent.hourlyRate}
                      </span>
                      <p className="text-[10px] text-slate-500">Escrow Protected</p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {talent.bio}
                  </p>

                  {/* Skill Tags */}
                  {talent.tags && talent.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {talent.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[11px] text-slate-300 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Sample Video Work Preview Box */}
                  {talent.sampleVideoTitle && (
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 text-slate-300 truncate">
                        <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                          <Video className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate text-slate-300 font-medium">
                          {talent.sampleVideoTitle}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold shrink-0">
                        Watermarked Proof
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Row: Stats & Action Buttons */}
                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{talent.rating.toFixed(1)}</span>
                      <span className="text-slate-500 font-normal">({talent.reviewsCount || 1})</span>
                    </span>
                    <span className="hidden sm:inline-block text-slate-600">•</span>
                    <span className="hidden sm:flex items-center gap-1 text-slate-400 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{talent.deliveryTime}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenChat(talent.name)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Message</span>
                    </button>

                    <button
                      onClick={onOpenDealModal}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Hire via Escrow</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. MODAL: PUBLISH REAL CREATOR PROFILE DIRECTLY TO FIRESTORE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#12141c] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl text-slate-100 my-8">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-teal-400/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                  Publish Creator Profile to Database
                </h3>
                <p className="text-xs text-slate-400">
                  Writes directly to the live Firestore <code className="text-cyan-400">/creators</code> collection.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCreatorName}
                    onChange={(e) => setNewCreatorName(e.target.value)}
                    placeholder="e.g., Vikram Sen"
                    className="w-full px-3 py-2 bg-[#171b26] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Username Handle *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-xs">@</span>
                    <input
                      type="text"
                      required
                      value={newCreatorUsername}
                      onChange={(e) => setNewCreatorUsername(e.target.value)}
                      placeholder="vikram_cuts"
                      className="w-full pl-7 pr-3 py-2 bg-[#171b26] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Professional Specialty / Role *
                </label>
                <input
                  type="text"
                  required
                  value={newCreatorRole}
                  onChange={(e) => setNewCreatorRole(e.target.value)}
                  placeholder="e.g., Cinematic YouTube Editor & Colorist"
                  className="w-full px-3 py-2 bg-[#171b26] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Rate & Pricing *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCreatorRate}
                    onChange={(e) => setNewCreatorRate(e.target.value)}
                    placeholder="e.g., ₹2,500 / video"
                    className="w-full px-3 py-2 bg-[#171b26] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Delivery Speed
                  </label>
                  <input
                    type="text"
                    value={newCreatorDelivery}
                    onChange={(e) => setNewCreatorDelivery(e.target.value)}
                    placeholder="e.g., 24-48 Hours"
                    className="w-full px-3 py-2 bg-[#171b26] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Skills & Tools (Comma separated)
                </label>
                <input
                  type="text"
                  value={newCreatorTags}
                  onChange={(e) => setNewCreatorTags(e.target.value)}
                  placeholder="Premiere Pro, After Effects, Sound Design, VFX"
                  className="w-full px-3 py-2 bg-[#171b26] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Short Bio / Portfolio Pitch
                </label>
                <textarea
                  rows={2}
                  value={newCreatorBio}
                  onChange={(e) => setNewCreatorBio(e.target.value)}
                  placeholder="Tell clients about your pacing, retention strategies, and past channel experience..."
                  className="w-full px-3 py-2 bg-[#171b26] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Sample Video Work Title
                </label>
                <input
                  type="text"
                  value={newCreatorSampleTitle}
                  onChange={(e) => setNewCreatorSampleTitle(e.target.value)}
                  placeholder="e.g., YouTube Documentary 4K Master Cut"
                  className="w-full px-3 py-2 bg-[#171b26] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewCreator}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 font-bold text-xs tracking-wide transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingNewCreator ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Writing to Database...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Publish to Live Firestore</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. TRUST & METRICS SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-b border-white/[0.06] bg-[#0c0d12] relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Space_Grotesk']">
              Engineered for 100% Anti-Scam Security
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Why top YouTube agencies and freelance video editors prefer Verilance over legacy freelance portals.
            </p>
          </div>

          {/* 3 Key Trust Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#121216] border border-white/[0.07] space-y-3 relative">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                100% Escrow Protection
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clients deposit funds upfront into secure escrow before editors cut a single frame. Funds are never released without mutual consent.
              </p>
              <div className="pt-2 text-[11px] text-cyan-300 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Zero Ghosting Guarantee
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#121216] border border-white/[0.07] space-y-3 relative">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                Verified Creators Only
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mandatory government ID verification (Aadhaar, PAN, Passport) eliminates multi-accounting scammers and anonymous ghost-buyers.
              </p>
              <div className="pt-2 text-[11px] text-purple-300 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Government Hash Verification
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#121216] border border-white/[0.07] space-y-3 relative">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                Automated Smart Contracts
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every deal locks into a binding digital agreement with transparent 3% fees, exact deadlines, revision caps, and diagonal watermark proofs.
              </p>
              <div className="pt-2 text-[11px] text-teal-300 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 3% Fixed Transparent Commission
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
