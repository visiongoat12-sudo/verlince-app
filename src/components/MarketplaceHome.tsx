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
  UserCheck,
  ChevronDown,
  ArrowUpRight,
  HelpCircle,
  Cpu,
  Palette,
  Camera,
  Play
} from 'lucide-react';
import { CreatorProfile, UserRole } from '../types';
import { VerilanceLogo } from './VerilanceLogo';
import { 
  subscribeCreators, 
  saveCreatorToDB,
  fetchCreatorsFromDB
} from '../lib/firebase';
import { getRandomDefaultAvatar } from '../lib/defaultAvatars';
import { soundEffects } from '../lib/soundEffects';

interface MarketplaceHomeProps {
  onOpenDealModal: () => void;
  onOpenProfile: () => void;
  onOpenChat: (talentName?: string) => void;
  currentUserRole: UserRole;
  onToggleRole: () => void;
  onOpenWhyVerilance?: () => void;
}

export const MarketplaceHome: React.FC<MarketplaceHomeProps> = ({
  onOpenDealModal,
  onOpenProfile,
  onOpenChat,
  currentUserRole,
  onToggleRole,
  onOpenWhyVerilance,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchType, setSearchType] = useState<'Talent' | 'Projects' | 'Jobs'>('Talent');
  const [activeMode, setActiveMode] = useState<'hire' | 'work'>('hire');
  const [howItWorksTab, setHowItWorksTab] = useState<'hire' | 'work'>('hire');

  // Real Database State (Dynamically fetched from Firestore)
  const [talents, setTalents] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);

  // Project Scoping / VAKRA AI Assessment Interactive State
  const [scopingPriority, setScopingPriority] = useState<string>('Save time');
  const [scopingStep, setScopingStep] = useState<number>(1);
  const [scopingResult, setScopingResult] = useState<{
    estimatedDays: string;
    suggestedBudget: string;
    matchCount: number;
    recommendedRole: string;
  }>({
    estimatedDays: '1 - 2 business days',
    suggestedBudget: '₹2,500 - ₹5,000 / deliverable',
    matchCount: 14,
    recommendedRole: 'Senior Video Editor & Retention Specialist',
  });

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

  // Upwork-style category cards with real skill counts & ratings
  const categoryCards = [
    { name: 'Video & Audio Post', icon: Video, skills: '1,200 skills', rating: '4.95/5' },
    { name: 'AI Services & Tools', icon: Cpu, skills: '185 skills', rating: '4.9/5' },
    { name: '3D Motion & VFX', icon: Layers, skills: '340 skills', rating: '4.9/5' },
    { name: 'Shorts & Reels', icon: Film, skills: '520 skills', rating: '4.9/5' },
    { name: 'Thumbnail & Art', icon: Palette, skills: '380 skills', rating: '4.9/5' },
    { name: 'Scripting & Creative', icon: FileText, skills: '510 skills', rating: '4.8/5' },
    { name: 'Color Grading & LUTs', icon: Zap, skills: '290 skills', rating: '4.9/5' },
    { name: 'Camera & Lighting', icon: Camera, skills: '210 skills', rating: '4.85/5' },
  ];

  // Dynamic real-time subscription to Firebase Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initDatabase() {
      setLoading(true);
      setDbError(null);
      try {
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
        avatar: getRandomDefaultAvatar().svgDataUri,
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

  const handleSelectScopingGoal = (goal: string) => {
    soundEffects.playSubTabClick();
    setScopingPriority(goal);
    if (goal === 'Save time') {
      setScopingResult({
        estimatedDays: '1 - 2 business days',
        suggestedBudget: '₹2,500 - ₹5,000 / video',
        matchCount: 18,
        recommendedRole: 'Fast-Turnaround Senior YouTube Editor',
      });
    } else if (goal === 'Grow audience / revenue') {
      setScopingResult({
        estimatedDays: '3 - 5 business days',
        suggestedBudget: '₹5,000 - ₹12,000 / asset',
        matchCount: 12,
        recommendedRole: 'Viral Hook Specialist & Retention Designer',
      });
    } else if (goal === 'Boost retention & CTR') {
      setScopingResult({
        estimatedDays: '2 - 3 business days',
        suggestedBudget: '₹3,500 - ₹7,500 / cut',
        matchCount: 15,
        recommendedRole: 'Pacing & Sound FX Retention Editor',
      });
    } else if (goal === 'Make better quality cuts') {
      setScopingResult({
        estimatedDays: '3 - 7 business days',
        suggestedBudget: '₹8,000 - ₹18,000 / project',
        matchCount: 9,
        recommendedRole: 'Cinematic Colorist & 4K Documentary Master',
      });
    } else {
      setScopingResult({
        estimatedDays: '4 - 6 business days',
        suggestedBudget: '₹6,000 - ₹15,000 / package',
        matchCount: 11,
        recommendedRole: 'Brand Identity & Motion Graphics Director',
      });
    }
  };

  return (
    <div className="w-full bg-[#07090d] text-slate-100 min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* 0. UPWORK-STYLE SUBHEADER NAVIGATION BAR */}
      <nav className="border-b border-white/[0.06] bg-[#0a0d13]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-slate-300">
          <div className="flex items-center gap-6 overflow-x-auto py-1 scrollbar-none">
            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-white transition">
              <span>Hire talent</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition" />
            </div>
            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-white transition">
              <span>Find work</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition" />
            </div>
            <button
              onClick={() => {
                soundEffects.playNavTabClick();
                if (onOpenWhyVerilance) onOpenWhyVerilance();
              }}
              className="hover:text-cyan-300 transition cursor-pointer font-medium"
            >
              Why Verilance
            </button>
            <a href="#pricing-plans" className="hover:text-cyan-300 transition">
              Enterprise & Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundEffects.playNavTabClick();
                if (onOpenWhyVerilance) onOpenWhyVerilance();
              }}
              className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold transition cursor-pointer"
              title="Click to see why VERILANCE 3% Escrow protects you"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>3% Transparent Escrow</span>
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Publish Profile</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION (UPWORK VIDEO STYLE) */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06] overflow-hidden">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-cyan-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-7">
          {/* Live Database Status Indicator Banner */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wide shadow-sm">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Anti-Scam Freelance Escrow Protocol</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>

            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border ${
              isLiveConnected 
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Firestore DB: {isLiveConnected ? 'Connected (Real-time)' : 'Connecting...'}</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] text-slate-400 font-sans">
                ({talents.length} Verified Records)
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

          {/* Mode Switcher Pills: "I want to hire" vs "I want to work" in Cyan */}
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-[#11151f] border border-white/10 shadow-lg">
            <button
              onClick={() => {
                soundEffects.playTabClick();
                setActiveMode('hire');
              }}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeMode === 'hire'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              I want to hire
            </button>
            <button
              onClick={() => {
                soundEffects.playTabClick();
                setActiveMode('work');
              }}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeMode === 'work'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              I want to work
            </button>
          </div>

          {/* Upwork Prominent Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-['Space_Grotesk'] leading-[1.12] max-w-4xl mx-auto">
            {activeMode === 'hire' ? (
              <>
                How work <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-200 bg-clip-text text-transparent">should work</span>
              </>
            ) : (
              <>
                Find top deals with <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-200 bg-clip-text text-transparent">100% upfront escrow</span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Forget old freelance scams, ghosting, and stolen video edits. Verilance connects vetted creators and clients with encrypted milestone escrow, diagonal watermarking, and instant release.
          </p>

          {/* Upwork-style Big Search Bar with "Talent" filter and Cyan CTA */}
          <div className="max-w-3xl mx-auto pt-2">
            <div className="p-2 rounded-2xl bg-[#11151f] border border-white/10 shadow-2xl flex flex-col sm:flex-row items-center gap-2 focus-within:border-cyan-500/50 transition-all">
              <div className="flex items-center gap-3 w-full px-3 py-2 text-slate-400">
                <Search className="w-5 h-5 text-cyan-400 shrink-0" />
                <input
                  id="marketplace-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What need do you have? (e.g. YouTube shorts, Premiere Pro, 3D motion)..."
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

              {/* Type selector (Talent / Projects / Jobs) */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                <div className="relative">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as any)}
                    className="bg-[#171c2a] border border-white/10 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400 appearance-none pr-7 cursor-pointer"
                  >
                    <option value="Talent">Talent</option>
                    <option value="Projects">Projects</option>
                    <option value="Jobs">Jobs</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Primary Search Button in Vibrant Cyan */}
                <button
                  id="btn-hero-search-action"
                  onClick={() => {
                    const el = document.getElementById('verified-talent-directory');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] text-slate-950 font-extrabold text-xs tracking-wide shadow-[0_0_25px_rgba(6,182,212,0.4)] transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <span>Search</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Popular Categories Pill Tag Row */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              <span className="text-xs text-slate-500 font-medium">Popular:</span>
              {['Video Editing', 'AI Automation', '3D Motion & VFX', 'YouTube Shorts', 'Color Grading', 'Thumbnail Design', 'Cinematic Cuts'].map((tag) => (
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

      {/* 2. "FIND FREELANCERS FOR EVERY TYPE OF WORK" CATEGORY GRID */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Space_Grotesk']">
              Find freelancers for every type of work
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Connect with top verified talent across production, motion, 3D, and AI workflows.
            </p>
          </div>

          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Explore all categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryCards.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => {
                  soundEffects.playSubTabClick();
                  setSelectedCategory(isSelected ? 'All' : cat.name);
                  const el = document.getElementById('verified-talent-directory');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`p-5 rounded-2xl border text-left transition-all group flex flex-col justify-between h-36 ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-500/20 to-teal-500/10 border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
                    : 'bg-[#0f121a] border-white/[0.07] hover:border-cyan-500/40 hover:bg-[#131824]'
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected 
                      ? 'bg-cyan-400 text-slate-950 font-bold' 
                      : 'bg-white/5 text-slate-300 group-hover:text-cyan-400 group-hover:bg-cyan-500/10'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{cat.rating}</span>
                    </span>
                    <span>•</span>
                    <span>{cat.skills}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. FREE AI PROJECT SCOPING (UPWORK VIDEO FEATURE) */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#111520] via-[#0d1017] to-[#121622] border border-cyan-500/30 relative overflow-hidden shadow-2xl">
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Free AI Project Scoping</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
                Not sure where to start with your project?
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Answer three quick questions. VAKRA Sentinel instantly scopes your video milestones, estimates pricing, and matches verified editors.
              </p>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Step 1 of 3: What's your top creative goal?
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    'Save time',
                    'Grow audience / revenue',
                    'Boost retention & CTR',
                    'Make better quality cuts',
                    'Build signature style'
                  ].map((goal) => (
                    <button
                      key={goal}
                      onClick={() => handleSelectScopingGoal(goal)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                        scopingPriority === goal
                          ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-md shadow-cyan-400/20'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Recommendation Result Card */}
            <div className="lg:col-span-5">
              <div className="p-5 rounded-2xl bg-[#090c13] border border-cyan-500/30 space-y-4 text-xs shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Scoping Recommendation</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                    Instant AI Match
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recommended Role:</span>
                    <strong className="text-white text-right">{scopingResult.recommendedRole}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Turnaround:</span>
                    <strong className="text-cyan-300">{scopingResult.estimatedDays}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Escrow:</span>
                    <strong className="text-cyan-400">{scopingResult.suggestedBudget}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verified Matches:</span>
                    <span className="text-white font-bold">{scopingResult.matchCount} creators ready</span>
                  </div>
                </div>

                <button
                  onClick={onOpenDealModal}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 transition flex items-center justify-center gap-2"
                >
                  <HandshakeIcon className="w-3.5 h-3.5" />
                  <span>Start This Project via Escrow</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. "HOW IT WORKS" (UPWORK VIDEO SECTION) */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Space_Grotesk']">
            How it works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            A frictionless workflow engineered to safeguard clients and freelance video editors every step of the way.
          </p>

          {/* Mode Tabs: For hiring vs For finding work in Cyan */}
          <div className="inline-flex items-center p-1 rounded-xl bg-[#11151f] border border-white/10 mt-2">
            <button
              onClick={() => {
                soundEffects.playTabClick();
                setHowItWorksTab('hire');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                howItWorksTab === 'hire'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              For hiring
            </button>
            <button
              onClick={() => {
                soundEffects.playTabClick();
                setHowItWorksTab('work');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                howItWorksTab === 'work'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              For finding work
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0f121a] border border-white/[0.07] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
              1
            </div>
            <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
              {howItWorksTab === 'hire' ? 'Posting jobs is always free' : 'Browse verified client listings'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {howItWorksTab === 'hire'
                ? 'Check out verified editor profiles, review watermarked portfolios, and inspect ratings before spending a rupee.'
                : 'Discover high-paying client contracts with verified deposits. No spam, no ghosting, and no uncompensated spec work.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f121a] border border-white/[0.07] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
              2
            </div>
            <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
              {howItWorksTab === 'hire' ? 'Get proposals and hire' : 'Submit proposals & lock escrow'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {howItWorksTab === 'hire'
                ? 'Lock project funds into secure digital escrow. Editors begin cutting frames only once funds are confirmed safe.'
                : 'Receive binding smart agreement terms. When the client funds escrow, your payout is guaranteed upon milestone delivery.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f121a] border border-white/[0.07] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
              3
            </div>
            <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
              {howItWorksTab === 'hire' ? 'Pay when work is done' : 'Get paid automatically'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {howItWorksTab === 'hire'
                ? 'Review work with diagonal watermarks or single-view previews. Release funds only after approving the final video.'
                : 'Deliver watermarked draft cuts with anti-leak protection. Payout releases straight to your verified UPI/bank account.'}
            </p>
          </div>
        </div>
      </section>

      {/* 5.5. DYNAMIC 'WHY VERILANCE' SPOTLIGHT & INTERACTIVE MODAL TRIGGER */}
      <section id="why-verilance" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#0c101a] via-[#101524] to-[#0a0d14] border border-cyan-500/30 p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(6,182,212,0.15)] overflow-hidden">
          {/* Ambient Cyber glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>The VERILANCE Advantage</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-['Space_Grotesk'] leading-tight">
                Why 10,000+ Creators & VFX Editors Trust <span className="bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">VERILANCE</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Traditional platforms take 20% of your earnings and leave you vulnerable to chargebacks or leaked preview files. VERILANCE combines <strong>3% micro-commissions</strong>, <strong>view-once anti-screen protection</strong>, and <strong>autonomous VAKRA AI dispute arbitration</strong>.
              </p>

              {/* USP mini pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                  <span className="block text-cyan-400 font-black text-sm font-mono">3% Fee</span>
                  <span className="text-[10px] text-slate-400">vs 20% typical</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                  <span className="block text-teal-400 font-black text-sm font-mono">View Once</span>
                  <span className="text-[10px] text-slate-400">No timers / leaks</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                  <span className="block text-purple-400 font-black text-sm font-mono">VAKRA AI</span>
                  <span className="text-[10px] text-slate-400">Moveable HUD</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                  <span className="block text-emerald-400 font-black text-sm font-mono">100% Escrow</span>
                  <span className="text-[10px] text-slate-400">KYC guaranteed</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
              <button
                id="btn-explore-why-verilance"
                onClick={() => {
                  soundEffects.playTabClick();
                  if (onOpenWhyVerilance) onOpenWhyVerilance();
                }}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:brightness-110 active:scale-98 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Sparkles className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
                <span>Explore Why VERILANCE & 3% Calculator</span>
                <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenDealModal}
                className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <HandshakeIcon className="w-4 h-4 text-cyan-400" />
                <span>Create Protected Escrow Deal</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. "CHOOSE HOW YOU WANT TO HIRE" (UPWORK VIDEO PRICING PLANS) */}
      <section id="pricing-plans" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Space_Grotesk']">
            Choose how you want to hire
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Transparent pricing with zero hidden fees. Scale from one-off cuts to full channel production.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Plan 1: Basic */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0e1119] border border-white/10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">Basic</h3>
                <p className="text-xs text-slate-400">For occasional hiring and one-off projects</p>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-2.5 text-xs text-slate-300">
                <p className="font-semibold text-white">Basic includes:</p>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Marketplace access</strong> - skilled freelancers across thousands of skills</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Talent profiles</strong> - portfolios, ratings, and work history</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Hiring tools</strong> - proposals and terms in one place</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Project workspace</strong> - messages, files, and status in one view</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Protected payments</strong> - escrow backed pay tied to milestones</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenDealModal}
              className="w-full py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-white transition cursor-pointer"
            >
              Get started for free
            </button>
          </div>

          {/* Plan 2: Business Plus (With Cyan Popular Badge) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0f1422] border-2 border-cyan-500/50 flex flex-col justify-between space-y-6 relative shadow-[0_0_35px_rgba(6,182,212,0.15)]">
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow-md">
              Popular
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">Business Plus</h3>
                <p className="text-xs text-slate-400">For ongoing work, repeat hiring, and teams</p>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-2.5 text-xs text-slate-300">
                <p className="font-semibold text-cyan-300">Everything in Basic, plus:</p>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Curated shortlists</strong> - we surface top matches so you hire faster</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Expert-Vetted talent</strong> - access to the top 1% of video editors</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Team workspace</strong> - shared hiring with roles and permissions</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Priority support</strong> - dedicated arbitration managers</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>View Once security</strong> - single-view protected media & anti-capture</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenProfile}
              className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-400/30 transition cursor-pointer"
            >
              Get started
            </button>
          </div>
        </div>
      </section>

      {/* 7. SIGNATURE CALL TO ACTION BANNER (IN VIBRANT CYAN INSTEAD OF GREEN) */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-400 text-slate-950 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 font-['Space_Grotesk'] leading-tight">
              Find freelancers who can help you build what's next
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-900/80">
              Join thousands of verified creators and video editors working with guaranteed milestone security.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                const el = document.getElementById('verified-talent-directory');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 active:scale-[0.98] text-white font-extrabold text-xs tracking-wide shadow-xl transition cursor-pointer"
            >
              Explore Freelancers
            </button>
            <button
              onClick={onOpenDealModal}
              className="px-6 py-3.5 rounded-xl bg-white/25 hover:bg-white/35 active:scale-[0.98] text-slate-950 font-extrabold text-xs tracking-wide transition cursor-pointer"
            >
              Post a Job
            </button>
          </div>
        </div>
      </section>

      {/* 9. DYNAMIC REAL-TIME CREATOR DIRECTORY (FIRESTORE DATABASE) */}
      <section id="verified-talent-directory" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Space_Grotesk']">
                Verified Creator & Editor Listings
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-semibold">
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
              className="underline text-red-300 hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton Indicator */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-6 rounded-2xl bg-[#0f121a] border border-white/5 animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10" />
                  <div className="space-y-2 flex-1">
                    <div className="w-32 h-4 rounded bg-white/10" />
                    <div className="w-24 h-3 rounded bg-white/5" />
                  </div>
                </div>
                <div className="w-full h-12 rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : filteredTalents.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#0f121a] border border-white/10 space-y-4">
            <UserCheck className="w-12 h-12 text-cyan-400 mx-auto opacity-75" />
            <h3 className="text-base font-bold text-white">No creators matched this search</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Be the first creator to list your service, or click reset to view all verified profiles.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 transition"
              >
                Publish Profile Now
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredTalents.map((talent) => (
              <div
                key={talent.id}
                id={`talent-card-${talent.id}`}
                className="p-5 sm:p-6 rounded-3xl bg-[#0e1119] border border-white/[0.07] hover:border-cyan-500/40 hover:bg-[#121622] transition-all flex flex-col justify-between space-y-5 shadow-lg group"
              >
                <div className="space-y-4">
                  {/* Top Row: Avatar, Name, Handle, Pro Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img
                          src={talent.avatar}
                          alt={talent.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover ring-2 ring-white/10 group-hover:ring-cyan-400/40 transition"
                        />
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 ring-2 ring-[#0e1119]" />
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition">
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
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1" title="Government ID & Bank Account KYC Verified">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                            KYC VERIFIED
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {talent.role}
                        </p>
                      </div>
                    </div>

                    {/* Hourly/Project Rate Pill */}
                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-bold text-cyan-400 font-mono">
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
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition flex items-center gap-1.5"
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

      {/* 10. MODAL: PUBLISH REAL CREATOR PROFILE DIRECTLY TO FIRESTORE */}
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
                    placeholder=""
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
                      placeholder=""
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
                  className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs tracking-wide transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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

      {/* 11. FOOTER (UPWORK STYLE) */}
      <footer className="border-t border-white/[0.08] bg-[#06080c] py-14 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-3">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">For Clients</p>
            <ul className="space-y-2">
              <li><a href="#how-it-works" className="hover:text-cyan-400 transition">How to hire</a></li>
              <li><a href="#talent-directory" className="hover:text-cyan-400 transition">Talent Marketplace</a></li>
              <li><a href="#pricing-plans" className="hover:text-cyan-400 transition">Project Catalog</a></li>
              <li><a href="#pricing-plans" className="hover:text-cyan-400 transition">Enterprise Solutions</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">For Talent</p>
            <ul className="space-y-2">
              <li><a href="#how-it-works" className="hover:text-cyan-400 transition">How to find work</a></li>
              <li><a href="#profile" className="hover:text-cyan-400 transition">Direct Contracts</a></li>
              <li><a href="#profile" className="hover:text-cyan-400 transition">KYC Trust Badge</a></li>
              <li><a href="#why-verilance" className="hover:text-cyan-400 transition">Freelance Protection</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">Resources</p>
            <ul className="space-y-2">
              <li><a href="#help" className="hover:text-cyan-400 transition">Help & Support</a></li>
              <li><a href="#community" className="hover:text-cyan-400 transition">Success Stories</a></li>
              <li><a href="#reviews" className="hover:text-cyan-400 transition">Verilance Reviews</a></li>
              <li><a href="#blog" className="hover:text-cyan-400 transition">Creator Academy</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">Company</p>
            <ul className="space-y-2">
              <li><a href="#about" className="hover:text-cyan-400 transition">About Us</a></li>
              <li><a href="#leadership" className="hover:text-cyan-400 transition">Leadership</a></li>
              <li><a href="#careers" className="hover:text-cyan-400 transition">Security & Trust</a></li>
              <li><a href="#terms" className="hover:text-cyan-400 transition">Arbitration Rules</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div className="flex items-center gap-2">
            <VerilanceLogo size="sm" />
            <span>© 2026 VERILANCE Global Escrow Protocol. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="#terms" className="hover:text-slate-300">Terms of Service</a>
            <a href="#privacy" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#security" className="hover:text-slate-300">CA Notice at Collection</a>
            <a href="#accessibility" className="hover:text-slate-300">Accessibility</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

function HandshakeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l10 7 4-4" />
      <path d="m3 7 9 7" />
    </svg>
  );
}
