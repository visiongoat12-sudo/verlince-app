import React, { useState } from 'react';
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
  Play, 
  Award, 
  ExternalLink,
  MessageSquare,
  Handshake,
  Check,
  ChevronRight,
  Shield,
  Eye,
  SlidersHorizontal,
  Clock,
  Briefcase
} from 'lucide-react';
import { UserRole } from '../types';
import { VerilanceLogo } from './VerilanceLogo';

interface TalentCard {
  id: string;
  name: string;
  avatar: string;
  role: string;
  rating: number;
  reviewsCount: number;
  hourlyRate: string;
  tags: string[];
  bio: string;
  verifiedPro: boolean;
  sampleVideoTitle: string;
  dealsCompleted: number;
  deliveryTime: string;
}

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

  // Quick categories
  const categories = [
    { name: 'Video Editing', icon: Video, count: '1,420+ Editors' },
    { name: '3D Motion', icon: Layers, count: '680+ Artists' },
    { name: 'YouTube Shorts', icon: Film, count: '2,100+ Creators' },
    { name: 'Reels', icon: Tv, count: '1,890+ Creators' },
    { name: 'Thumbnail Design', icon: Sparkles, count: '940+ Designers' },
    { name: 'VFX & Color Grading', icon: Zap, count: '520+ Specialists' },
  ];

  // Talent Directory Data
  const talents: TalentCard[] = [
    {
      id: 't-1',
      name: 'Kabir Verma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Senior YouTube & Commercial Video Editor',
      rating: 4.9,
      reviewsCount: 24,
      hourlyRate: '₹2,000 / video',
      tags: ['Premiere Pro', 'After Effects', 'Sound Design', 'Color Grading'],
      bio: 'Specialized in high-retention cinematic edits, pacing retention curves for 1M+ subscriber channels.',
      verifiedPro: true,
      sampleVideoTitle: 'Tech Review 4K Cut (Watermarked Preview)',
      dealsCompleted: 24,
      deliveryTime: '24-48 Hours',
    },
    {
      id: 't-2',
      name: 'Ananya Deshmukh',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'Viral Shorts & TikTok Retention Specialist',
      rating: 5.0,
      reviewsCount: 38,
      hourlyRate: '₹800 / short',
      tags: ['Alex Hormozi Style', 'CapCut Pro', 'Motion Captions', 'B-Roll'],
      bio: 'Helped 15+ founders scale past 10M organic views with hook-driven dynamic typography and sound design.',
      verifiedPro: true,
      sampleVideoTitle: 'FinTech Founder Reel (1.2M Views)',
      dealsCompleted: 42,
      deliveryTime: 'Same Day',
    },
    {
      id: 't-3',
      name: 'Rohan Mehta',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: '3D Motion Graphics & Blender VFX Artist',
      rating: 4.8,
      reviewsCount: 19,
      hourlyRate: '₹4,500 / project',
      tags: ['Blender 3D', 'Cinema 4D', 'Product Animation', 'Octane'],
      bio: 'Crafting luxury CGI brand reveals and photorealistic product launch animations for modern consumer brands.',
      verifiedPro: true,
      sampleVideoTitle: 'Luxury Smartwatch 3D Commercial',
      dealsCompleted: 19,
      deliveryTime: '3-4 Days',
    },
    {
      id: 't-4',
      name: 'Siddharth Nair',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'Podcast Video Producer & Multicam Editor',
      rating: 4.9,
      reviewsCount: 31,
      hourlyRate: '₹3,200 / episode',
      tags: ['Multicam Sync', 'DaVinci Resolve', 'Dialogue Cleanup', 'Snackables'],
      bio: 'Full-service podcast turnaround: studio multi-cam switching, studio audio mastering, and 5 cut-down shorts.',
      verifiedPro: false,
      sampleVideoTitle: 'Episode 84: Venture Capital Uncut',
      dealsCompleted: 31,
      deliveryTime: '48 Hours',
    },
  ];

  const filteredTalents = talents.filter((t) => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = 
      selectedCategory === 'All' || 
      t.tags.some(tag => tag.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      t.role.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full bg-[#0A0B10] text-slate-100 min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. HERO SECTION (Upwork-inspired) */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06] overflow-hidden">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wide shadow-sm">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Anti-Scam Freelance Escrow Protocol</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>

          {/* Prominent Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-['Space_Grotesk'] leading-[1.15] max-w-4xl mx-auto">
            Find trusted creators & video editors for <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">top quality work</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Zero ghosting. 100% protected escrow funds with automated digital contracts and watermarked proof-of-work deliveries.
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
                  placeholder="Search for skill or service (e.g. YouTube Video Editing, 3D Motion, Shorts)..."
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
              <span className="text-xs text-slate-500 font-medium">Popular Tags:</span>
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
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['Space_Grotesk']">
              Browse by Creative Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Escrow-secured workflows tailored for content creators and post-production specialists.
            </p>
          </div>

          <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline">
            View All 28 Sub-Specialties <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <div
                key={cat.name}
                id={`category-card-${idx}`}
                onClick={() => setSelectedCategory(isSelected ? 'All' : cat.name)}
                className={`group p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#151722] border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                    : 'bg-[#121216] border-white/[0.07] hover:border-cyan-500/40 hover:bg-[#14161e]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 group-hover:text-cyan-300">
                    Escrow Ready
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {cat.count} • Escrow Protected Delivery
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-slate-500 group-hover:text-slate-300">
                  <span>Average Turnaround: 24h</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-cyan-400" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. VERIFIED TALENT DIRECTORY (UPWORK STYLE) */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 border-t border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['Space_Grotesk']">
                Top Rated Verified Talent
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-extrabold uppercase">
                Pro Shield
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Verified editors with locked identity records and 0% non-delivery dispute rates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onOpenDealModal}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-slate-300 hover:text-white transition flex items-center gap-2"
            >
              <Handshake className="w-3.5 h-3.5 text-cyan-400" />
              <span>Create Custom Deal</span>
            </button>
          </div>
        </div>

        {/* Talent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTalents.map((talent) => (
            <div 
              key={talent.id}
              className="p-5 rounded-2xl bg-[#121216] border border-white/[0.07] hover:border-white/15 transition-all space-y-4 shadow-xl relative"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={talent.avatar} 
                      alt={talent.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-1 ring-white/10" 
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-[#121216]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base font-['Space_Grotesk']">
                        {talent.name}
                      </h3>
                      {talent.verifiedPro && (
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-purple-500/40 text-purple-300 text-[10px] font-extrabold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>PRO</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{talent.role}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {talent.rating} ({talent.reviewsCount})
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">{talent.dealsCompleted} Deals Closed</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-white font-mono">{talent.hourlyRate}</span>
                  <p className="text-[10px] text-slate-500">Fixed Baseline</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                {talent.bio}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {talent.tags.map((tag) => (
                  <span key={tag} className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
                <span className="text-[11px] text-cyan-400/90 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Avg Delivery: {talent.deliveryTime}</span>
                </span>

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
      </section>

      {/* 4. TRUST & METRICS SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-b border-white/[0.06] bg-[#0c0d12] relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Space_Grotesk']">
              Engineered for 100% Anti-Scam Security
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Why top YouTube agencies and freelance video editors prefer Trustway over legacy freelance portals.
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
                <Check className="w-3.5 h-3.5" /> UIDAI & Government Hash Verification
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

          {/* Live Trust Metrics Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/[0.06]">
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">₹4.8M+</span>
              <p className="text-[11px] text-slate-400 mt-1">Escrow Funds Protected</p>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">0%</span>
              <p className="text-[11px] text-slate-400 mt-1">Non-Payment Incidents</p>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">1,420+</span>
              <p className="text-[11px] text-slate-400 mt-1">Verified Video Deliveries</p>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
              <span className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">&lt; 15 min</span>
              <p className="text-[11px] text-slate-400 mt-1">VAKRA Dispute Arbitration</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING & SUBSCRIPTION TIERS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-['Space_Grotesk']">
            Transparent Pricing Built for Trust
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            No hidden fees. Choose standard pay-as-you-go escrow or upgrade to the Verified Pro badge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Standard Free Escrow Tier */}
          <div className="p-7 sm:p-8 rounded-3xl bg-[#121216] border border-white/[0.08] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Standard Escrow</span>
                <span className="px-2.5 py-1 rounded-full bg-white/[0.05] text-slate-300 text-[11px] font-semibold">Free Forever</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-white font-mono">₹0</span>
                <span className="text-xs text-slate-400">/ setup or monthly fee</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full access to escrow contracts and watermarked proof-of-work deliveries. Only pay when you close a deal.
              </p>

              <div className="pt-2 space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3% fixed escrow commission per completed deal</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Standard VAKRA Anti-Scam Chat Monitoring</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automated digital contracts & watermark preview</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Standard 24-48h dispute resolution response</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenDealModal}
              className="w-full py-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-xs tracking-wide transition"
            >
              Start Free Escrow Deal
            </button>
          </div>

          {/* Card 2: Premium Verified Badge Tier (₹2,000 / 3 months) */}
          <div className="p-7 sm:p-8 rounded-3xl bg-gradient-to-b from-[#18152b] via-[#12111d] to-[#0d0c15] border border-purple-500/40 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Elite Security Tier</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-purple-500/40 text-purple-200 text-[11px] font-bold">
                  Recommended
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-white font-mono">₹2,000</span>
                <span className="text-xs font-semibold text-purple-300">/ every 3 months</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Elite Trust Shield for serious creators and agencies. Unlock top search rank and instant arbitration.
              </p>

              <div className="pt-2 space-y-3 text-xs text-slate-200">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-bold">Permanent Glowing Blue/Purple "VERIFIED PRO" Trust Badge</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Top placement in client search results and talent directory</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Dedicated priority dispute team (under 15 min response)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>100% Escrow chargeback protection warranty</span>
                </div>
              </div>
            </div>

            <button
              id="btn-pricing-upgrade-pro"
              onClick={onOpenProfile}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs tracking-wide shadow-[0_0_25px_rgba(147,51,234,0.45)] transition flex items-center justify-center gap-2 relative z-10"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>Upgrade to Trusted Pro Status</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6. COMPLETE MULTI-COLUMN FOOTER */}
      <footer className="border-t border-white/[0.08] bg-[#07080c] pt-14 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-white/[0.06]">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <VerilanceLogo size="lg" />
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              The premier anti-scam escrow marketplace safeguarding digital creators, video editors, and production houses with View Once media protection and guaranteed payment escrow.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Secured by VERILANCE 256-Bit Escrow Vault Protocol</span>
            </div>
          </div>

          {/* Col 1: For Creators */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">For Creators</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#marketplace-search-input" className="hover:text-cyan-400 transition">Hire Video Editors</a></li>
              <li><a href="#marketplace-search-input" className="hover:text-cyan-400 transition">3D Motion Designers</a></li>
              <li><a href="#marketplace-search-input" className="hover:text-cyan-400 transition">Shorts & Reels Editors</a></li>
              <li><button onClick={onOpenDealModal} className="hover:text-cyan-400 transition text-left">Create Protected Deal</button></li>
              <li><a href="#pricing" className="hover:text-cyan-400 transition">Escrow Fee Calculator</a></li>
            </ul>
          </div>

          {/* Col 2: For Video Editors */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">For Editors</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><button onClick={onOpenProfile} className="hover:text-cyan-400 transition text-left">Submit Verification Data</button></li>
              <li><button onClick={onOpenProfile} className="hover:text-purple-400 transition text-left">Get Verified Pro Badge</button></li>
              <li><a href="#how-it-works" className="hover:text-cyan-400 transition">Watermark Security Tool</a></li>
              <li><a href="#escrow-rules" className="hover:text-cyan-400 transition">Anti-Ghosting Safeguard</a></li>
              <li><a href="#payouts" className="hover:text-cyan-400 transition">Instant UPI & Card Payouts</a></li>
            </ul>
          </div>

          {/* Col 3: Resources & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Security & Policies</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><span className="hover:text-cyan-400 cursor-pointer transition">VAKRA AI Security</span></li>
              <li><span className="hover:text-cyan-400 cursor-pointer transition">Digital Escrow Terms</span></li>
              <li><span className="hover:text-cyan-400 cursor-pointer transition">Dispute Resolution Manual</span></li>
              <li><span className="hover:text-cyan-400 cursor-pointer transition">Aadhaar & Privacy Policy</span></li>
              <li><span className="hover:text-cyan-400 cursor-pointer transition">Refund & Chargeback Rules</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 VERILANCE Inc. All rights reserved. Anti-Scam & View Once Protocol v3.0.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Escrow License</span>
            <span className="hover:text-slate-400 cursor-pointer">Contact Security Operations</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
