import React, { useState, useRef } from 'react';
import { DealAgreement, UserProfile, WorkDelivery } from '../types';
import {
  X,
  UploadCloud,
  Lock,
  Film,
  FileArchive,
  ShieldCheck,
  Pause,
  Play,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Eye,
  Trash2,
} from 'lucide-react';
import {
  MAX_DEAL_DELIVERABLE_BYTES,
  MAX_CHAT_MEDIA_STANDARD_BYTES,
  createResumableUpload,
  ResumableUploadController,
  UploadProgressTelemetry,
  formatFileSize,
  formatUploadSpeed,
  formatEta,
} from '../lib/mediaUpload';
import { soundEffects } from '../lib/soundEffects';

interface SubmitWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: DealAgreement | null;
  currentUser: UserProfile;
  onDeliverySubmitted: (delivery: WorkDelivery) => void;
}

async function probeVideoMetadata(file: File): Promise<{ duration: string; resolution: string }> {
  if (!file.type.startsWith('video/')) {
    return { duration: 'Project Archive', resolution: 'Original Master Package' };
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise((resolve) => {
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        resolve({ duration: 'Stream Ready', resolution: 'High-Resolution Video' });
      }, 2500);

      vid.onloadedmetadata = () => {
        clearTimeout(timeout);
        const secs = Math.round(vid.duration || 0);
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        const durationLabel =
          secs > 0 ? `${mins}:${remSecs < 10 ? '0' : ''}${remSecs} Min` : 'Stream Ready';
        const w = vid.videoWidth;
        const h = vid.videoHeight;
        const resLabel =
          w && h
            ? h >= 2160
              ? `4K Ultra HD (${w}x${h})`
              : h >= 1080
              ? `Full HD (${w}x${h})`
              : `${w}x${h}`
            : 'High-Resolution Video';
        URL.revokeObjectURL(objectUrl);
        resolve({ duration: durationLabel, resolution: resLabel });
      };

      vid.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        resolve({ duration: 'Vault Master', resolution: 'High-Resolution Video' });
      };

      vid.src = objectUrl;
    });
  } catch {
    URL.revokeObjectURL(objectUrl);
    return { duration: 'Vault Master', resolution: 'High-Resolution Video' };
  }
}

export const SubmitWorkModal: React.FC<SubmitWorkModalProps> = ({
  isOpen,
  onClose,
  deal,
  currentUser,
  onDeliverySubmitted,
}) => {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    deal?.milestones?.[0]?.id || ''
  );
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [telemetry, setTelemetry] = useState<UploadProgressTelemetry | null>(null);
  const [previewTelemetry, setPreviewTelemetry] = useState<UploadProgressTelemetry | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const masterControllerRef = useRef<ResumableUploadController | null>(null);
  const previewControllerRef = useRef<ResumableUploadController | null>(null);
  const masterInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const effectiveDealId = deal?.id || `DEAL-${Date.now()}`;
  const isPaused = telemetry?.status === 'paused';

  const validateAndSetMaster = (file: File) => {
    setUploadError(null);
    if (file.size > MAX_DEAL_DELIVERABLE_BYTES) {
      setMasterFile(file);
      setUploadError(
        `File "${file.name}" (${formatFileSize(file.size)}) exceeds the 5 GB (5,368,709,120 bytes) Escrow Master Vault limit.`
      );
      return;
    }
    setMasterFile(file);
    setTelemetry(null);
  };

  const validateAndSetPreview = (file: File) => {
    setUploadError(null);
    if (file.size > MAX_CHAT_MEDIA_STANDARD_BYTES) {
      setUploadError(
        `Stream preview cut "${file.name}" (${formatFileSize(file.size)}) exceeds the 500 MB lightweight stream limit. Keep the 5 GB file as the Master Vault upload.`
      );
      return;
    }
    setPreviewFile(file);
    setPreviewTelemetry(null);
  };

  const handleStartUpload = async () => {
    if (!masterFile || isUploading) return;
    if (masterFile.size > MAX_DEAL_DELIVERABLE_BYTES) {
      setUploadError(
        `File "${masterFile.name}" (${formatFileSize(masterFile.size)}) exceeds the 5 GB limit. Please compress or split before uploading.`
      );
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    soundEffects.playTabClick();

    try {
      const meta = await probeVideoMetadata(masterFile);

      // 1. If a separate lightweight preview stream was provided, upload it first (<= 500 MB)
      let previewUploadId: string | undefined;
      if (previewFile) {
        const pCtrl = createResumableUpload(previewFile, {
          category: 'preview',
          dealId: effectiveDealId,
          milestoneId: selectedMilestoneId || undefined,
          uploaderId: currentUser.id,
          onProgress: (pt) => setPreviewTelemetry(pt),
        });
        previewControllerRef.current = pCtrl;
        const previewRes = await pCtrl.promise;
        previewUploadId = previewRes.uploadId;
        previewControllerRef.current = null;
      }

      // 2. Upload 5 GB Master File in 8 MB disk-streamed chunks into the locked Escrow Master Vault
      const mCtrl = createResumableUpload(masterFile, {
        category: 'deliverable',
        dealId: effectiveDealId,
        milestoneId: selectedMilestoneId || undefined,
        uploaderId: currentUser.id,
        previewUploadId,
        onProgress: (mt) => setTelemetry(mt),
      });
      masterControllerRef.current = mCtrl;
      const result = await mCtrl.promise;
      masterControllerRef.current = null;

      const now = new Date();
      const formattedTime = now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      const delivery: WorkDelivery = {
        fileName: masterFile.name,
        timestamp: now.toISOString(),
        formattedTime,
        deadlineComparison: deal?.deadline
          ? `Mapped to Target (${deal.deadline})`
          : 'Uploaded via Master Vault ⚡',
        isOnTime: true,
        fileSize: formatFileSize(masterFile.size),
        fileSizeBytes: masterFile.size,
        mimeType: masterFile.type || 'application/octet-stream',
        resolution: meta.resolution,
        duration: meta.duration,
        watermarked: true,
        isApproved: false,
        dealId: effectiveDealId,
        milestoneId: selectedMilestoneId || undefined,
        uploadId: result.uploadId,
        vaultStatus: 'locked_in_vault',
        previewStreamUrl: result.previewStreamUrl,
        previewHlsManifestUrl: result.previewHlsManifestUrl,
        masterVaultUrl: result.masterVaultUrl,
        storageProvider: result.storageProvider === 'firebase_storage' ? 'firebase_storage' : 'vault_chunked',
      };

      soundEffects.playNotificationSound();
      setIsUploading(false);
      onDeliverySubmitted(delivery);
      onClose();
    } catch (err: any) {
      masterControllerRef.current = null;
      previewControllerRef.current = null;
      setIsUploading(false);
      const msg = err?.message || 'Upload failed due to a connection drop.';
      if (!msg.toLowerCase().includes('cancelled')) {
        setUploadError(msg);
      }
    }
  };

  const handlePauseResume = () => {
    const ctrl = masterControllerRef.current || previewControllerRef.current;
    if (!ctrl) return;
    if (ctrl.getStatus() === 'paused') {
      ctrl.resume();
    } else {
      ctrl.pause();
    }
  };

  const handleCancelUpload = async () => {
    if (previewControllerRef.current) {
      await previewControllerRef.current.cancel();
      previewControllerRef.current = null;
    }
    if (masterControllerRef.current) {
      await masterControllerRef.current.cancel();
      masterControllerRef.current = null;
    }
    setIsUploading(false);
    setTelemetry(null);
    setPreviewTelemetry(null);
    setUploadError('Upload cancelled. Partial chunks purged safely.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        id="submit-work-vault-modal"
        className="w-full max-w-2xl rounded-3xl bg-[#0d121b] border border-cyan-500/35 shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#111826] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
                Deliver Milestone to Escrow Master Vault
              </h3>
              <p className="text-[11px] text-cyan-300/90">
                Supports high-resolution videos &amp; project files up to 5 GB • Chunked Stream Upload
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isUploading}
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-40 transition cursor-pointer"
            title={isUploading ? 'Cancel upload before closing' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
          {/* Milestone Target Selector */}
          {deal?.milestones && deal.milestones.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Target Deal Milestone
              </label>
              <select
                value={selectedMilestoneId}
                disabled={isUploading}
                onChange={(e) => setSelectedMilestoneId(e.target.value)}
                className="w-full bg-[#141a26] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/60"
              >
                {deal.milestones.map((ms) => (
                  <option key={ms.id} value={ms.id}>
                    {ms.title} ({ms.percentage}% • ₹{ms.amount.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Primary 5 GB Master File Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>5 GB Escrow Master File (Locked Until Release)</span>
              </label>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 rounded-full">
                Max 5.00 GB • Zero-RAM 8 MB Chunks
              </span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!isUploading) setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (!isUploading && e.dataTransfer.files?.[0]) {
                  validateAndSetMaster(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-5 transition text-center space-y-3 ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-white/15 bg-[#121723]/80 hover:border-cyan-500/40'
              }`}
            >
              {!masterFile ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center mx-auto text-cyan-400">
                    <Film className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">
                      Drag &amp; drop 4K Master Video or Project Archive here
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Supports high-resolution videos &amp; project files up to 5 GB (MP4, MOV, MKV, ProRes, ZIP, PRPROJ, DRP)
                    </p>
                  </div>
                  <button
                    type="button"
                    id="btn-select-master-5gb"
                    disabled={isUploading}
                    onClick={() => masterInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition cursor-pointer"
                  >
                    Select Deliverable File (Up to 5 GB)
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3 text-left bg-[#0b0f17] border border-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                      {masterFile.type.startsWith('video/') ? (
                        <Film className="w-5 h-5" />
                      ) : (
                        <FileArchive className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{masterFile.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {formatFileSize(masterFile.size)} • Locked in Private Escrow Vault until Client Release
                      </p>
                    </div>
                  </div>
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={() => {
                        setMasterFile(null);
                        setTelemetry(null);
                        setUploadError(null);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
                      title="Remove selected file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              <input
                ref={masterInputRef}
                type="file"
                accept="video/*,.zip,.rar,.7z,.prproj,.drp,.aep,.mov,.mkv,.mxf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) validateAndSetMaster(e.target.files[0]);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {/* Separated Stream-Only Preview Option */}
          <div className="rounded-2xl bg-[#111622] border border-white/10 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Separated Stream-Only Preview (Watermarked Player)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    For MP4/WebM masters, VERILANCE automatically serves a lightweight adaptive range stream. Optionally attach a separate compact watermarked cut if delivering a .ZIP or ProRes .MOV.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => previewInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-semibold text-teal-300 shrink-0 cursor-pointer"
              >
                {previewFile ? 'Change Preview' : 'Attach Preview Cut'}
              </button>
            </div>

            {previewFile && (
              <div className="flex items-center justify-between bg-black/40 border border-teal-500/30 rounded-xl px-3 py-2 text-xs">
                <span className="text-teal-200 truncate font-medium">
                  Stream Preview: {previewFile.name} ({formatFileSize(previewFile.size)})
                </span>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => setPreviewFile(null)}
                    className="text-slate-400 hover:text-white ml-2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <input
              ref={previewInputRef}
              type="file"
              accept="video/mp4,video/webm,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) validateAndSetPreview(e.target.files[0]);
                e.target.value = '';
              }}
            />
          </div>

          {/* Real-Time Resumable Progress HUD */}
          {(telemetry || previewTelemetry) && (
            <div className="rounded-2xl bg-[#0a0f18] border border-cyan-500/35 p-4 space-y-3">
              {previewTelemetry && previewTelemetry.status !== 'completed' && (
                <div className="space-y-1.5 pb-2 border-b border-white/10">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-teal-300 font-semibold">
                      Uploading Lightweight Preview Stream...
                    </span>
                    <span className="font-mono text-teal-200 font-bold">
                      {previewTelemetry.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-teal-400 transition-all duration-150"
                      style={{ width: `${previewTelemetry.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {telemetry && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {telemetry.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : telemetry.status === 'paused' ? (
                        <Pause className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      )}
                      <span className="text-xs font-bold text-white">
                        {telemetry.status === 'paused'
                          ? 'Upload Paused'
                          : telemetry.status === 'retrying'
                          ? `Network Retry (${telemetry.retryAttempt}/4)...`
                          : telemetry.status === 'completing'
                          ? 'Sealing into Escrow Master Vault...'
                          : telemetry.status === 'completed'
                          ? 'Sealed in Escrow Master Vault'
                          : 'Streaming Chunks to Escrow Vault'}
                      </span>
                    </div>
                    <span className="text-sm font-mono font-extrabold text-cyan-300">
                      {telemetry.percentage}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-150 ${
                        telemetry.status === 'paused'
                          ? 'bg-amber-400'
                          : telemetry.status === 'retrying'
                          ? 'bg-orange-400'
                          : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-300'
                      }`}
                      style={{ width: `${telemetry.percentage}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                    <div className="bg-white/[0.04] rounded-lg px-2.5 py-1.5 border border-white/5">
                      <span className="text-slate-400 block text-[10px]">Transferred</span>
                      <span className="text-white font-bold">
                        {formatFileSize(telemetry.bytesTransferred)} / {formatFileSize(telemetry.totalBytes)}
                      </span>
                    </div>
                    <div className="bg-white/[0.04] rounded-lg px-2.5 py-1.5 border border-white/5">
                      <span className="text-slate-400 block text-[10px]">Upload Speed</span>
                      <span className="text-cyan-300 font-bold">
                        {isPaused ? 'Paused' : formatUploadSpeed(telemetry.speedBytesPerSec)}
                      </span>
                    </div>
                    <div className="bg-white/[0.04] rounded-lg px-2.5 py-1.5 border border-white/5">
                      <span className="text-slate-400 block text-[10px]">Est. Remaining</span>
                      <span className="text-teal-300 font-bold">
                        {isPaused ? '—' : formatEta(telemetry.etaSeconds)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-slate-400">
                      Slice {telemetry.chunkIndex} / {telemetry.totalChunks} (8 MB chunks)
                    </span>
                    {isUploading && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePauseResume}
                          className="px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                          <span>{isPaused ? 'Resume' : 'Pause'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelUpload}
                          className="px-3 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-400/40 text-red-200 text-[11px] font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Error + Retry */}
          {uploadError && (
            <div className="rounded-xl bg-red-950/30 border border-red-500/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
              {masterFile && masterFile.size <= MAX_DEAL_DELIVERABLE_BYTES && !isUploading && (
                <button
                  type="button"
                  onClick={handleStartUpload}
                  className="px-3.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 text-red-100 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="rounded-xl bg-cyan-950/20 border border-cyan-500/20 p-3 flex items-start gap-2.5 text-[11px] text-slate-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Your 5 GB master file is sealed inside the private <strong>Escrow Master Vault</strong> and cannot be downloaded by the client until payment release is verified. The client reviews only a watermarked stream preview.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#101520] border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isUploading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-xs font-semibold text-slate-300 transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            id="btn-confirm-submit-5gb-work"
            disabled={!masterFile || isUploading || (masterFile?.size ?? 0) > MAX_DEAL_DELIVERABLE_BYTES}
            onClick={handleStartUpload}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs tracking-wide shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading ({telemetry?.percentage ?? 0}%)...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Upload &amp; Lock in Escrow Vault</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
