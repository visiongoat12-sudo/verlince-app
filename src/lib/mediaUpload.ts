import { getApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, doc, getDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

// Exact 5 GB = 5,368,709,120 bytes
export const MAX_DEAL_DELIVERABLE_BYTES = 5 * 1024 * 1024 * 1024;
// 500 MB standard chat media limit; 5 GB when large-file transfer is enabled
export const MAX_CHAT_MEDIA_STANDARD_BYTES = 500 * 1024 * 1024;
export const MAX_CHAT_MEDIA_EXTENDED_BYTES = MAX_DEAL_DELIVERABLE_BYTES;
// 8 MB chunk slice size (keeps browser memory footprint < 16 MB even for 5 GB files)
export const CHUNK_SIZE_BYTES = 8 * 1024 * 1024;

const INLINE_IMAGE_LIMIT = 450_000;

export type UploadStatusState =
  | 'idle'
  | 'initializing'
  | 'uploading'
  | 'paused'
  | 'retrying'
  | 'completing'
  | 'completed'
  | 'cancelled'
  | 'error';

export interface UploadProgressTelemetry {
  uploadId: string;
  status: UploadStatusState;
  percentage: number;
  bytesTransferred: number;
  totalBytes: number;
  speedBytesPerSec: number;
  etaSeconds: number | null;
  chunkIndex: number;
  totalChunks: number;
  retryAttempt: number;
  errorMessage?: string;
}

export interface ResumableUploadResult {
  uploadId: string;
  url: string;
  fileName: string;
  fileSizeBytes: number;
  sizeLabel: string;
  mimeType: string;
  mediaKind: 'image' | 'video' | 'zip';
  vaultStatus?: 'locked_in_vault' | 'released_unlocked';
  previewStreamUrl?: string;
  previewHlsManifestUrl?: string;
  masterVaultUrl?: string;
  storageProvider: 'vault_chunked' | 'firebase_storage' | 'inline_image';
}

export interface UploadedChatMedia {
  url: string;
  uploadId?: string;
  chunkedMediaId?: string;
  mimeType: string;
  fileName: string;
  sizeLabel: string;
  sizeBytes: number;
  mediaKind: 'image' | 'video' | 'zip';
}

export interface ResumableUploadController {
  uploadId: string;
  promise: Promise<ResumableUploadResult>;
  pause: () => void;
  resume: () => void;
  cancel: () => Promise<void>;
  getStatus: () => UploadStatusState;
}

// Cache reconstructed Object URLs in memory for legacy chunked docs
const resolvedMediaCache = new Map<string, string>();
const pendingResolutions = new Map<string, Promise<string>>();

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatUploadSpeed(bytesPerSec: number): string {
  if (!Number.isFinite(bytesPerSec) || bytesPerSec <= 0) return '0 KB/s';
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

export function formatEta(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return 'Calculating...';
  if (seconds < 1) return '< 1s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  }
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function getMediaKind(mimeType: string): 'image' | 'video' | 'zip' {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  return 'zip';
}

/**
 * Compress only compact photos (<= 8 MB) for crisp inline thumbnails.
 * Never loads large multi-MB/GB files into FileReader.
 */
async function compressCompactImage(file: File): Promise<string | null> {
  if (file.size > 8 * 1024 * 1024) return null;
  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1440;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const scale = Math.min(maxDim / width, maxDim / height);
            width = Math.max(1, Math.round(width * scale));
            height = Math.max(1, Math.round(height * scale));
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          for (const quality of [0.82, 0.68, 0.52, 0.38]) {
            const out = canvas.toDataURL('image/jpeg', quality);
            if (out.length <= INLINE_IMAGE_LIMIT || quality === 0.38) {
              resolve(out.length <= INLINE_IMAGE_LIMIT ? out : null);
              return;
            }
          }
          resolve(null);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });
  } catch {
    URL.revokeObjectURL(objectUrl);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function waitForOnline(): Promise<void> {
  if (typeof navigator === 'undefined' || navigator.onLine) return Promise.resolve();
  return new Promise((resolve) => {
    const handler = () => {
      window.removeEventListener('online', handler);
      resolve();
    };
    window.addEventListener('online', handler);
  });
}

function uploadChunkWithXhr(
  url: string,
  chunkBlob: Blob,
  headers: Record<string, string>,
  onIntraChunkProgress: (loadedBytes: number) => void,
  registerXhr: (xhr: XMLHttpRequest | null) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    registerXhr(xhr);
    xhr.open('PUT', url, true);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        onIntraChunkProgress(ev.loaded);
      }
    };

    xhr.onload = () => {
      registerXhr(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        let errText = `Server returned HTTP ${xhr.status}`;
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed?.error) errText = parsed.error;
        } catch {
          // ignore
        }
        const err = new Error(errText) as Error & { status?: number };
        err.status = xhr.status;
        reject(err);
      }
    };

    xhr.onerror = () => {
      registerXhr(null);
      reject(new Error('Network error while transferring chunk.'));
    };

    xhr.onabort = () => {
      registerXhr(null);
      reject(new Error('UPLOAD_ABORTED'));
    };

    xhr.send(chunkBlob);
  });
}

/**
 * Create a zero-RAM resumable chunked upload session for files up to 5 GB (5,368,709,120 bytes).
 * Streams 8 MB slices directly from disk via File.slice() — never calls FileReader or loads GB files into RAM.
 */
export function createResumableUpload(
  file: File,
  options: {
    category: 'deliverable' | 'preview' | 'chat';
    allowLargeChat?: boolean;
    dealId?: string;
    milestoneId?: string;
    channelId?: string;
    uploaderId?: string;
    previewUploadId?: string;
    onProgress?: (telemetry: UploadProgressTelemetry) => void;
  }
): ResumableUploadController {
  const uploadId = `upl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const mimeType = file.type || 'application/octet-stream';
  const mediaKind = getMediaKind(mimeType);
  const maxAllowedBytes =
    options.category === 'deliverable'
      ? MAX_DEAL_DELIVERABLE_BYTES
      : options.category === 'preview'
      ? MAX_CHAT_MEDIA_STANDARD_BYTES
      : options.allowLargeChat
      ? MAX_CHAT_MEDIA_EXTENDED_BYTES
      : MAX_CHAT_MEDIA_STANDARD_BYTES;

  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE_BYTES));

  let status: UploadStatusState = 'initializing';
  let isPaused = false;
  let isCancelled = false;
  let activeXhr: XMLHttpRequest | null = null;
  let resumeResolver: (() => void) | null = null;
  let completedBytesBase = 0;

  const startTime = Date.now();
  let speedSampleBytes = 0;
  let speedSampleTime = startTime;
  let rollingSpeedBps = 0;

  const emit = (
    overrides: Partial<UploadProgressTelemetry> & {
      bytesTransferred?: number;
      chunkIndex?: number;
      retryAttempt?: number;
    }
  ) => {
    const bytesTransferred = Math.min(file.size, overrides.bytesTransferred ?? completedBytesBase);
    const now = Date.now();
    const dtSec = (now - speedSampleTime) / 1000;
    if (dtSec >= 0.35 && status === 'uploading') {
      const deltaBytes = bytesTransferred - speedSampleBytes;
      if (deltaBytes >= 0) {
        const instantBps = deltaBytes / dtSec;
        rollingSpeedBps =
          rollingSpeedBps > 0 ? rollingSpeedBps * 0.65 + instantBps * 0.35 : instantBps;
      }
      speedSampleBytes = bytesTransferred;
      speedSampleTime = now;
    }

    const remainingBytes = Math.max(0, file.size - bytesTransferred);
    const etaSeconds =
      rollingSpeedBps > 1024 ? remainingBytes / rollingSpeedBps : null;

    const pct =
      file.size === 0
        ? 100
        : Math.min(
            status === 'completed' ? 100 : 99,
            Math.round((bytesTransferred / file.size) * 100)
          );

    options.onProgress?.({
      uploadId,
      status,
      percentage: pct,
      bytesTransferred,
      totalBytes: file.size,
      speedBytesPerSec: rollingSpeedBps,
      etaSeconds,
      chunkIndex: overrides.chunkIndex ?? 0,
      totalChunks,
      retryAttempt: overrides.retryAttempt ?? 0,
      errorMessage: overrides.errorMessage,
    });
  };

  const pause = () => {
    if (status === 'completed' || status === 'cancelled' || status === 'error') return;
    isPaused = true;
    status = 'paused';
    if (activeXhr) {
      activeXhr.abort();
      activeXhr = null;
    }
    emit({});
  };

  const resume = () => {
    if (!isPaused || isCancelled) return;
    isPaused = false;
    status = 'uploading';
    speedSampleTime = Date.now();
    speedSampleBytes = completedBytesBase;
    emit({});
    if (resumeResolver) {
      const r = resumeResolver;
      resumeResolver = null;
      r();
    }
  };

  const cancel = async () => {
    isCancelled = true;
    isPaused = false;
    status = 'cancelled';
    if (activeXhr) {
      activeXhr.abort();
      activeXhr = null;
    }
    if (resumeResolver) {
      const r = resumeResolver;
      resumeResolver = null;
      r();
    }
    emit({});
    await fetch(`/api/uploads/${encodeURIComponent(uploadId)}`, {
      method: 'DELETE',
      headers: options.uploaderId ? { 'x-verilance-uid': options.uploaderId } : undefined,
    }).catch(() => {});
  };

  const promise = (async (): Promise<ResumableUploadResult> => {
    if (file.size > maxAllowedBytes) {
      const limitLabel = maxAllowedBytes >= MAX_DEAL_DELIVERABLE_BYTES ? '5 GB' : '500 MB';
      const errMsg = `File "${file.name}" (${formatFileSize(file.size)}) exceeds the ${limitLabel} upload limit.`;
      status = 'error';
      emit({ errorMessage: errMsg });
      throw new Error(errMsg);
    }

    // Fast path for tiny chat photos (<= 450 KB compressed)
    if (options.category === 'chat' && mediaKind === 'image' && file.size <= 4 * 1024 * 1024) {
      const compactUrl = await compressCompactImage(file);
      if (compactUrl) {
        status = 'completed';
        completedBytesBase = file.size;
        emit({ bytesTransferred: file.size, chunkIndex: 1 });
        return {
          uploadId,
          url: compactUrl,
          fileName: file.name,
          fileSizeBytes: file.size,
          sizeLabel: formatFileSize(file.size),
          mimeType: 'image/jpeg',
          mediaKind: 'image',
          storageProvider: 'inline_image',
        };
      }
    }

    emit({ bytesTransferred: 0, chunkIndex: 0 });

    const initResp = await fetch('/api/uploads/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        fileName: file.name,
        fileSize: file.size,
        mimeType,
        category: options.category,
        allowLargeChat: !!options.allowLargeChat,
        dealId: options.dealId,
        milestoneId: options.milestoneId,
        channelId: options.channelId,
        uploaderId: options.uploaderId,
        totalChunks,
      }),
    });

    if (!initResp.ok) {
      const errBody = await initResp.json().catch(() => ({}));
      const errMsg = errBody?.error || `Upload initialization failed (HTTP ${initResp.status}).`;
      status = 'error';
      emit({ errorMessage: errMsg });
      throw new Error(errMsg);
    }

    const initData = (await initResp.json()) as { receivedChunks?: number[] };
    const completedSet = new Set<number>(initData.receivedChunks || []);
    status = 'uploading';

    for (let idx = 0; idx < totalChunks; idx++) {
      if (isCancelled) {
        throw new Error('Upload cancelled by user.');
      }

      if (completedSet.has(idx)) {
        const startOffset = idx * CHUNK_SIZE_BYTES;
        const endOffset = Math.min(file.size, startOffset + CHUNK_SIZE_BYTES);
        completedBytesBase += endOffset - startOffset;
        emit({ chunkIndex: idx + 1 });
        continue;
      }

      const startOffset = idx * CHUNK_SIZE_BYTES;
      const endOffset = Math.min(file.size, startOffset + CHUNK_SIZE_BYTES);
      const sliceBlob = file.slice(startOffset, endOffset);

      let chunkUploaded = false;
      let retryAttempt = 0;
      const maxRetries = 4;

      while (!chunkUploaded) {
        if (isCancelled) {
          throw new Error('Upload cancelled by user.');
        }

        if (isPaused) {
          status = 'paused';
          emit({ chunkIndex: idx });
          await new Promise<void>((res) => {
            resumeResolver = res;
          });
          if (isCancelled) throw new Error('Upload cancelled by user.');
        }

        try {
          status = retryAttempt > 0 ? 'retrying' : 'uploading';
          await uploadChunkWithXhr(
            `/api/uploads/${encodeURIComponent(uploadId)}/chunk`,
            sliceBlob,
            {
              'x-chunk-index': String(idx),
              'x-chunk-offset': String(startOffset),
              'x-total-chunks': String(totalChunks),
            },
            (intraLoaded) => {
              if (!isPaused && !isCancelled) {
                emit({
                  bytesTransferred: completedBytesBase + intraLoaded,
                  chunkIndex: idx + 1,
                  retryAttempt,
                });
              }
            },
            (xhr) => {
              activeXhr = xhr;
            }
          );

          completedSet.add(idx);
          completedBytesBase += sliceBlob.size;
          chunkUploaded = true;
          emit({ bytesTransferred: completedBytesBase, chunkIndex: idx + 1, retryAttempt: 0 });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Chunk upload error';
          if (isCancelled) throw new Error('Upload cancelled by user.');
          if (isPaused || msg === 'UPLOAD_ABORTED') {
            // Loop back cleanly to wait on pause gate
            continue;
          }

          const httpStatus = (err as { status?: number })?.status;
          if (httpStatus && httpStatus >= 400 && httpStatus < 500 && httpStatus !== 408 && httpStatus !== 429) {
            status = 'error';
            emit({ errorMessage: msg, chunkIndex: idx + 1 });
            throw err;
          }

          retryAttempt += 1;
          if (retryAttempt > maxRetries) {
            status = 'error';
            const finalErr = `Upload paused/failed after ${maxRetries} network retries: ${msg}`;
            emit({ errorMessage: finalErr, chunkIndex: idx + 1, retryAttempt });
            throw new Error(finalErr);
          }

          status = 'retrying';
          emit({ chunkIndex: idx + 1, retryAttempt, errorMessage: `Network drop detected. Auto-retrying (${retryAttempt}/${maxRetries})...` });
          await waitForOnline();
          await sleep(Math.min(6000, 900 * Math.pow(2, retryAttempt - 1)));
        }
      }
    }

    if (isCancelled) {
      throw new Error('Upload cancelled by user.');
    }

    status = 'completing';
    emit({ bytesTransferred: file.size, chunkIndex: totalChunks });

    const completeResp = await fetch(`/api/uploads/${encodeURIComponent(uploadId)}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        previewUploadId: options.previewUploadId,
      }),
    });

    if (!completeResp.ok) {
      const errBody = await completeResp.json().catch(() => ({}));
      const errMsg = errBody?.error || 'Failed to finalize uploaded file.';
      status = 'error';
      emit({ errorMessage: errMsg });
      throw new Error(errMsg);
    }

    const done = (await completeResp.json()) as {
      url?: string;
      vaultStatus?: 'locked_in_vault' | 'released_unlocked';
      previewStreamUrl?: string;
      previewHlsManifestUrl?: string;
      masterVaultUrl?: string;
      fileSizeBytes?: number;
    };

    status = 'completed';
    emit({ bytesTransferred: file.size, chunkIndex: totalChunks });

    return {
      uploadId,
      url: done.url || done.previewStreamUrl || '',
      fileName: file.name,
      fileSizeBytes: done.fileSizeBytes ?? file.size,
      sizeLabel: formatFileSize(done.fileSizeBytes ?? file.size),
      mimeType,
      mediaKind,
      vaultStatus: done.vaultStatus,
      previewStreamUrl: done.previewStreamUrl,
      previewHlsManifestUrl: done.previewHlsManifestUrl,
      masterVaultUrl: done.masterVaultUrl,
      storageProvider: 'vault_chunked',
    };
  })();

  return {
    uploadId,
    promise,
    pause,
    resume,
    cancel,
    getStatus: () => status,
  };
}

/**
 * Optional direct Firebase Storage resumable uploader (5 GB capable via uploadBytesResumable)
 */
export async function tryFirebaseStorageResumable(
  file: File,
  storagePath: string,
  onProgress?: (pct: number) => void
): Promise<string | null> {
  try {
    const storage = getStorage(getApp());
    const storageRef = ref(storage, storagePath);
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'application/octet-stream',
    });

    return await new Promise<string | null>((resolve) => {
      let settled = false;
      let hasProgressed = false;

      const finish = (url: string | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(stallTimer);
        resolve(url);
      };

      const stallTimer = setTimeout(() => {
        if (!hasProgressed) {
          try {
            task.cancel();
          } catch {
            // ignore
          }
          finish(null);
        }
      }, 3500);

      task.on(
        'state_changed',
        (snap) => {
          if (snap.bytesTransferred > 0) {
            hasProgressed = true;
            clearTimeout(stallTimer);
          }
          if (snap.totalBytes > 0) {
            onProgress?.(Math.min(99, Math.round((snap.bytesTransferred / snap.totalBytes) * 100)));
          }
        },
        () => finish(null),
        async () => {
          try {
            const downloadUrl = await getDownloadURL(task.snapshot.ref);
            onProgress?.(100);
            finish(downloadUrl);
          } catch {
            finish(null);
          }
        }
      );
    });
  } catch {
    return null;
  }
}

export async function uploadChatMedia(
  file: File,
  options?: {
    allowLargeChat?: boolean;
    channelId?: string;
    uploaderId?: string;
    onProgress?: (pct: number) => void;
    onTelemetry?: (telemetry: UploadProgressTelemetry) => void;
    onController?: (controller: ResumableUploadController) => void;
  }
): Promise<UploadedChatMedia> {
  const controller = createResumableUpload(file, {
    category: 'chat',
    allowLargeChat: options?.allowLargeChat,
    channelId: options?.channelId,
    uploaderId: options?.uploaderId,
    onProgress: (t) => {
      options?.onProgress?.(t.percentage);
      options?.onTelemetry?.(t);
    },
  });

  options?.onController?.(controller);
  const res = await controller.promise;

  return {
    url: res.url,
    uploadId: res.uploadId,
    mimeType: res.mimeType,
    fileName: res.fileName,
    sizeLabel: res.sizeLabel,
    sizeBytes: res.fileSizeBytes,
    mediaKind: res.mediaKind,
  };
}

export async function resolveChunkedMediaUrl(
  chunkedMediaId: string,
  fallbackMimeType?: string
): Promise<string> {
  if (!chunkedMediaId) return '';
  const cached = resolvedMediaCache.get(chunkedMediaId);
  if (cached) return cached;

  const existingPromise = pendingResolutions.get(chunkedMediaId);
  if (existingPromise) return existingPromise;

  const loadPromise = (async () => {
    try {
      const manifestSnap = await getDoc(doc(db, 'media_chunks', chunkedMediaId));
      if (!manifestSnap.exists()) {
        throw new Error('Media manifest missing or expired.');
      }
      const manifest = manifestSnap.data() as {
        totalChunks: number;
        mimeType?: string;
      };
      const totalChunks = manifest.totalChunks || 0;
      if (totalChunks <= 0) {
        throw new Error('Invalid chunk count.');
      }

      const chunkSnaps = await Promise.all(
        Array.from({ length: totalChunks }, (_, idx) =>
          getDoc(doc(db, 'media_chunks', `${chunkedMediaId}_chunk_${idx}`))
        )
      );

      let base64Combined = '';
      for (const snap of chunkSnaps) {
        if (!snap.exists()) {
          throw new Error('Media chunk incomplete.');
        }
        base64Combined += (snap.data().data as string) || '';
      }

      const binaryStr = atob(base64Combined);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const blob = new Blob([bytes], {
        type: manifest.mimeType || fallbackMimeType || 'application/octet-stream',
      });
      const blobUrl = URL.createObjectURL(blob);
      resolvedMediaCache.set(chunkedMediaId, blobUrl);
      return blobUrl;
    } finally {
      pendingResolutions.delete(chunkedMediaId);
    }
  })();

  pendingResolutions.set(chunkedMediaId, loadPromise);
  return loadPromise;
}

export async function deleteChunkedMedia(chunkedMediaId?: string): Promise<void> {
  if (!chunkedMediaId) return;
  try {
    const cached = resolvedMediaCache.get(chunkedMediaId);
    if (cached && cached.startsWith('blob:')) {
      URL.revokeObjectURL(cached);
    }
    resolvedMediaCache.delete(chunkedMediaId);

    const q = query(collection(db, 'media_chunks'), where('mediaId', '==', chunkedMediaId));
    const snaps = await getDocs(q);
    await Promise.all(snaps.docs.map((d) => deleteDoc(doc(db, 'media_chunks', d.id))));
    await deleteDoc(doc(db, 'media_chunks', chunkedMediaId)).catch(() => {});
  } catch (err) {
    console.warn('[MediaUpload] Failed to delete expired chunks:', err);
  }
}
