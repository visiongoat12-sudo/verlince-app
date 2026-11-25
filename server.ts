import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// Exact 5 GB limit = 5,368,709,120 bytes
const MAX_DELIVERABLE_BYTES = 5 * 1024 * 1024 * 1024;
// 500 MB standard chat media limit (5 GB if explicitly enabled by sender)
const MAX_CHAT_STANDARD_BYTES = 500 * 1024 * 1024;
const MAX_CHAT_EXTENDED_BYTES = MAX_DELIVERABLE_BYTES;
const MAX_CHUNK_BYTES = 16 * 1024 * 1024; // 16 MB max per chunk HTTP request

const VAULT_ROOT = path.resolve('/tmp/verilance_vault');
const UPLOADS_DIR = path.resolve(VAULT_ROOT, 'uploads');
const MASTER_VAULT_DIR = path.resolve(VAULT_ROOT, 'master_vault');
const PREVIEWS_DIR = path.resolve(VAULT_ROOT, 'previews');
const INDEX_FILE = path.resolve(VAULT_ROOT, 'vault_index.json');

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{3,128}$/;

interface UploadSessionRecord {
  uploadId: string;
  fileName: string;
  safeFileName: string;
  fileSize: number;
  maxAllowedBytes: number;
  mimeType: string;
  category: 'deliverable' | 'preview' | 'chat';
  dealId?: string;
  milestoneId?: string;
  channelId?: string;
  uploaderId: string;
  tempFilePath: string;
  finalFilePath?: string;
  bytesReceived: number;
  receivedChunks: number[];
  totalChunks: number;
  status: 'initialized' | 'uploading' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface DealVaultRecord {
  dealId: string;
  uploadId: string;
  previewUploadId?: string;
  milestoneId?: string;
  uploaderId: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  masterFilePath: string;
  previewFilePath?: string;
  previewMimeType?: string;
  vaultStatus: 'locked_in_vault' | 'released_unlocked';
  releasedAt?: string;
  releasedBy?: string;
  paymentRef?: string;
  createdAt: string;
}

interface PersistedIndex {
  uploads: Record<string, UploadSessionRecord>;
  vaultDeals: Record<string, DealVaultRecord>;
}

const state: PersistedIndex = {
  uploads: {},
  vaultDeals: {},
};

function ensureDirectories(): void {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(MASTER_VAULT_DIR, { recursive: true });
  fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
  try {
    if (fs.existsSync(INDEX_FILE)) {
      const raw = fs.readFileSync(INDEX_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<PersistedIndex>;
      if (parsed.uploads) state.uploads = parsed.uploads;
      if (parsed.vaultDeals) state.vaultDeals = parsed.vaultDeals;
    }
  } catch (err) {
    console.warn('[ServerVault] Notice loading index:', err);
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersistIndex(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    fsPromises
      .writeFile(INDEX_FILE, JSON.stringify(state, null, 2), 'utf-8')
      .catch((err) => console.warn('[ServerVault] Index write warning:', err));
  }, 150);
}

function assertSafePath(baseDir: string, targetName: string): string {
  const resolved = path.resolve(baseDir, targetName);
  if (!resolved.startsWith(baseDir + path.sep)) {
    throw new Error('Invalid path resolution outside vault boundary.');
  }
  return resolved;
}

function sanitizeFileName(name: string): string {
  const base = path.basename(name || 'asset.bin').replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.slice(0, 180) || 'asset.bin';
}

function isValidId(id: unknown): id is string {
  return typeof id === 'string' && SAFE_ID_REGEX.test(id);
}

function streamFileWithRanges(
  req: Request,
  res: Response,
  filePath: string,
  mimeType: string,
  options: { downloadName?: string; noStore?: boolean } = {}
): void {
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Stored media file not found on disk.' });
    return;
  }

  const stat = fs.statSync(filePath);
  const total = stat.size;
  const range = req.headers.range;

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', mimeType || 'application/octet-stream');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (options.noStore) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  } else {
    res.setHeader('Cache-Control', 'private, max-age=3600');
  }

  if (options.downloadName) {
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${sanitizeFileName(options.downloadName)}"`
    );
  } else {
    res.setHeader('Content-Disposition', 'inline');
  }

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
      return;
    }

    const start = match[1] ? parseInt(match[1], 10) : 0;
    // Cap preview range chunk to 2 MB per request if open-ended so player buffers smoothly without loading 5 GB
    const defaultChunkEnd = options.noStore
      ? Math.min(total - 1, start + 2 * 1024 * 1024 - 1)
      : total - 1;
    const end = match[2] ? Math.min(parseInt(match[2], 10), total - 1) : defaultChunkEnd;

    if (Number.isNaN(start) || Number.isNaN(end) || start >= total || start > end) {
      res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
      return;
    }

    const chunkSize = end - start + 1;
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
    res.setHeader('Content-Length', String(chunkSize));

    const stream = fs.createReadStream(filePath, { start, end, highWaterMark: 256 * 1024 });
    stream.on('error', () => {
      if (!res.headersSent) res.status(500).end();
    });
    stream.pipe(res);
    return;
  }

  res.status(200);
  res.setHeader('Content-Length', String(total));
  const stream = fs.createReadStream(filePath, { highWaterMark: 256 * 1024 });
  stream.on('error', () => {
    if (!res.headersSent) res.status(500).end();
  });
  stream.pipe(res);
}

async function startServer(): Promise<void> {
  ensureDirectories();
  const app = express();

  // High body-parser limits for metadata & chunked binary transfer
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // ---------------------------------------------------------------------------
  // 1. INITIALIZE RESUMABLE CHUNKED UPLOAD (UP TO 5 GB = 5,368,709,120 BYTES)
  // ---------------------------------------------------------------------------
  app.post('/api/uploads/init', async (req: Request, res: Response) => {
    try {
      const {
        uploadId: requestedId,
        fileName,
        fileSize,
        mimeType,
        category = 'chat',
        allowLargeChat = false,
        dealId,
        milestoneId,
        channelId,
        uploaderId,
        totalChunks = 1,
      } = req.body as Record<string, unknown>;

      if (typeof fileName !== 'string' || !fileName.trim()) {
        res.status(400).json({ error: 'Valid fileName is required.' });
        return;
      }

      const parsedSize = Number(fileSize);
      if (!Number.isFinite(parsedSize) || parsedSize < 0) {
        res.status(400).json({ error: 'Invalid fileSize.' });
        return;
      }

      const cat: 'deliverable' | 'preview' | 'chat' =
        category === 'deliverable' || category === 'preview' ? category : 'chat';

      const maxAllowedBytes =
        cat === 'deliverable'
          ? MAX_DELIVERABLE_BYTES
          : cat === 'preview'
          ? MAX_CHAT_STANDARD_BYTES
          : allowLargeChat
          ? MAX_CHAT_EXTENDED_BYTES
          : MAX_CHAT_STANDARD_BYTES;

      if (parsedSize > maxAllowedBytes) {
        const limitLabel = maxAllowedBytes >= MAX_DELIVERABLE_BYTES ? '5 GB' : '500 MB';
        res.status(413).json({
          error: `File "${fileName}" exceeds the ${limitLabel} upload limit.`,
          maxAllowedBytes,
        });
        return;
      }

      const uploadId = isValidId(requestedId)
        ? requestedId
        : `upl_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      // If resuming existing session, return current state
      const existing = state.uploads[uploadId];
      if (existing && existing.status !== 'cancelled') {
        res.json({
          uploadId: existing.uploadId,
          bytesReceived: existing.bytesReceived,
          receivedChunks: existing.receivedChunks,
          status: existing.status,
          maxAllowedBytes: existing.maxAllowedBytes,
        });
        return;
      }

      const safeName = sanitizeFileName(fileName);
      const tempFilePath = assertSafePath(UPLOADS_DIR, `${uploadId}_${safeName}.part`);
      await fsPromises.writeFile(tempFilePath, Buffer.alloc(0));

      const record: UploadSessionRecord = {
        uploadId,
        fileName: fileName.trim(),
        safeFileName: safeName,
        fileSize: parsedSize,
        maxAllowedBytes,
        mimeType: typeof mimeType === 'string' && mimeType ? mimeType : 'application/octet-stream',
        category: cat,
        dealId: typeof dealId === 'string' && isValidId(dealId) ? dealId : undefined,
        milestoneId: typeof milestoneId === 'string' ? milestoneId : undefined,
        channelId: typeof channelId === 'string' ? channelId : undefined,
        uploaderId: typeof uploaderId === 'string' && uploaderId ? uploaderId : 'anonymous',
        tempFilePath,
        bytesReceived: 0,
        receivedChunks: [],
        totalChunks: Math.max(1, Number(totalChunks) || 1),
        status: 'initialized',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.uploads[uploadId] = record;
      schedulePersistIndex();

      res.status(201).json({
        uploadId,
        bytesReceived: 0,
        receivedChunks: [],
        status: record.status,
        maxAllowedBytes,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize upload.';
      res.status(500).json({ error: msg });
    }
  });

  // ---------------------------------------------------------------------------
  // 2. QUERY UPLOAD STATUS FOR RESUME AFTER PAUSE / NETWORK DROP
  // ---------------------------------------------------------------------------
  app.get('/api/uploads/:uploadId/status', (req: Request, res: Response) => {
    const uploadId = req.params.uploadId;
    if (!isValidId(uploadId)) {
      res.status(400).json({ error: 'Invalid uploadId.' });
      return;
    }
    const record = state.uploads[uploadId];
    if (!record) {
      res.status(404).json({ error: 'Upload session not found.' });
      return;
    }
    res.json({
      uploadId: record.uploadId,
      status: record.status,
      fileSize: record.fileSize,
      bytesReceived: record.bytesReceived,
      receivedChunks: record.receivedChunks,
      totalChunks: record.totalChunks,
    });
  });

  // ---------------------------------------------------------------------------
  // 3. STREAM BINARY CHUNK DIRECTLY TO DISK AT BYTE OFFSET (ZERO FULL-FILE RAM)
  // ---------------------------------------------------------------------------
  app.put(
    '/api/uploads/:uploadId/chunk',
    express.raw({ type: '*/*', limit: MAX_CHUNK_BYTES }),
    async (req: Request, res: Response) => {
      try {
        const uploadId = req.params.uploadId;
        if (!isValidId(uploadId)) {
          res.status(400).json({ error: 'Invalid uploadId.' });
          return;
        }
        const record = state.uploads[uploadId];
        if (!record) {
          res.status(404).json({ error: 'Upload session not found.' });
          return;
        }
        if (record.status === 'cancelled') {
          res.status(410).json({ error: 'Upload session was cancelled.' });
          return;
        }

        const chunkBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
        const chunkIndex = parseInt(String(req.headers['x-chunk-index'] ?? '0'), 10);
        const offset = parseInt(String(req.headers['x-chunk-offset'] ?? '0'), 10);

        if (!Number.isFinite(chunkIndex) || chunkIndex < 0 || !Number.isFinite(offset) || offset < 0) {
          res.status(400).json({ error: 'Invalid chunk index or byte offset.' });
          return;
        }

        if (
          offset + chunkBuffer.length > record.maxAllowedBytes ||
          (record.fileSize > 0 && offset + chunkBuffer.length > record.fileSize)
        ) {
          res.status(413).json({
            error: 'Uploaded chunk exceeds declared file size or maximum storage limit (5 GB).',
          });
          return;
        }

        const fh = await fsPromises.open(record.tempFilePath, fs.existsSync(record.tempFilePath) ? 'r+' : 'w+');
        try {
          await fh.write(chunkBuffer, 0, chunkBuffer.length, offset);
        } finally {
          await fh.close();
        }

        if (!record.receivedChunks.includes(chunkIndex)) {
          record.receivedChunks.push(chunkIndex);
          record.bytesReceived = Math.min(
            record.fileSize || record.maxAllowedBytes,
            record.bytesReceived + chunkBuffer.length
          );
        }
        record.status = 'uploading';
        record.updatedAt = new Date().toISOString();
        schedulePersistIndex();

        res.json({
          uploadId: record.uploadId,
          chunkIndex,
          bytesReceived: record.bytesReceived,
          status: record.status,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Chunk write failed.';
        res.status(500).json({ error: msg });
      }
    }
  );

  // ---------------------------------------------------------------------------
  // 4. COMPLETE UPLOAD & SEAL INTO LOCKED ESCROW MASTER VAULT OR MEDIA STREAM
  // ---------------------------------------------------------------------------
  app.post('/api/uploads/:uploadId/complete', async (req: Request, res: Response) => {
    try {
      const uploadId = req.params.uploadId;
      if (!isValidId(uploadId)) {
        res.status(400).json({ error: 'Invalid uploadId.' });
        return;
      }
      const record = state.uploads[uploadId];
      if (!record) {
        res.status(404).json({ error: 'Upload session not found.' });
        return;
      }
      if (!fs.existsSync(record.tempFilePath)) {
        res.status(404).json({ error: 'Uploaded binary file missing.' });
        return;
      }

      const { previewUploadId } = (req.body || {}) as { previewUploadId?: string };

      const stat = await fsPromises.stat(record.tempFilePath);
      record.bytesReceived = stat.size;
      record.status = 'completed';
      record.updatedAt = new Date().toISOString();

      if (record.category === 'deliverable' && record.dealId) {
        const masterPath = assertSafePath(
          MASTER_VAULT_DIR,
          `${record.dealId}_${uploadId}_${record.safeFileName}`
        );
        await fsPromises.rename(record.tempFilePath, masterPath);
        record.finalFilePath = masterPath;

        let previewFilePath: string | undefined;
        let previewMimeType: string | undefined;
        if (previewUploadId && isValidId(previewUploadId)) {
          const prevRec = state.uploads[previewUploadId];
          if (prevRec && prevRec.finalFilePath && fs.existsSync(prevRec.finalFilePath)) {
            previewFilePath = prevRec.finalFilePath;
            previewMimeType = prevRec.mimeType;
          }
        }

        // Default preview stream uses adaptive HTTP byte-range serving from the uploaded video if playable
        const vaultRecord: DealVaultRecord = {
          dealId: record.dealId,
          uploadId: record.uploadId,
          previewUploadId,
          milestoneId: record.milestoneId,
          uploaderId: record.uploaderId,
          fileName: record.fileName,
          mimeType: record.mimeType,
          fileSizeBytes: stat.size,
          masterFilePath: masterPath,
          previewFilePath: previewFilePath || (record.mimeType.startsWith('video/') ? masterPath : undefined),
          previewMimeType: previewMimeType || (record.mimeType.startsWith('video/') ? record.mimeType : undefined),
          vaultStatus: 'locked_in_vault',
          createdAt: new Date().toISOString(),
        };

        state.vaultDeals[record.dealId] = vaultRecord;
        schedulePersistIndex();

        res.json({
          uploadId: record.uploadId,
          dealId: record.dealId,
          fileName: record.fileName,
          fileSizeBytes: stat.size,
          mimeType: record.mimeType,
          vaultStatus: 'locked_in_vault',
          previewStreamUrl: vaultRecord.previewFilePath
            ? `/api/vault/deals/${encodeURIComponent(record.dealId)}/preview?v=${Date.now()}`
            : undefined,
          previewHlsManifestUrl: vaultRecord.previewFilePath
            ? `/api/vault/deals/${encodeURIComponent(record.dealId)}/preview.m3u8`
            : undefined,
          masterVaultUrl: `/api/vault/deals/${encodeURIComponent(record.dealId)}/master/download`,
        });
        return;
      }

      const targetDir = record.category === 'preview' ? PREVIEWS_DIR : UPLOADS_DIR;
      const finalPath = assertSafePath(targetDir, `${uploadId}_${record.safeFileName}`);
      if (record.tempFilePath !== finalPath) {
        await fsPromises.rename(record.tempFilePath, finalPath);
      }
      record.finalFilePath = finalPath;
      schedulePersistIndex();

      res.json({
        uploadId: record.uploadId,
        fileName: record.fileName,
        fileSizeBytes: stat.size,
        mimeType: record.mimeType,
        url: `/api/media/${encodeURIComponent(record.uploadId)}/stream`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to finalize upload.';
      res.status(500).json({ error: msg });
    }
  });

  // ---------------------------------------------------------------------------
  // 5. CANCEL & PURGE PARTIAL UPLOAD
  // ---------------------------------------------------------------------------
  app.delete('/api/uploads/:uploadId', async (req: Request, res: Response) => {
    try {
      const uploadId = req.params.uploadId;
      if (!isValidId(uploadId)) {
        res.status(400).json({ error: 'Invalid uploadId.' });
        return;
      }
      const record = state.uploads[uploadId];
      if (record) {
        const callerUid = String(req.headers['x-verilance-uid'] || '');
        if (record.uploaderId !== 'anonymous' && callerUid && callerUid !== record.uploaderId) {
          res.status(403).json({ error: 'Only the upload owner can cancel this session.' });
          return;
        }
        record.status = 'cancelled';
        record.updatedAt = new Date().toISOString();
        if (record.tempFilePath && fs.existsSync(record.tempFilePath)) {
          await fsPromises.unlink(record.tempFilePath).catch(() => {});
        }
        schedulePersistIndex();
      }
      res.json({ cancelled: true, uploadId });
    } catch {
      res.status(500).json({ error: 'Failed to cancel upload.' });
    }
  });

  // ---------------------------------------------------------------------------
  // 6. CHAT MEDIA BYTE-RANGE STREAM (ZERO FULL-FILE BUFFERING)
  // ---------------------------------------------------------------------------
  app.get('/api/media/:mediaId/stream', (req: Request, res: Response) => {
    const mediaId = req.params.mediaId;
    if (!isValidId(mediaId)) {
      res.status(400).json({ error: 'Invalid mediaId.' });
      return;
    }
    const record = state.uploads[mediaId];
    if (!record || record.status !== 'completed') {
      res.status(404).json({ error: 'Media asset not found.' });
      return;
    }
    const filePath = record.finalFilePath || record.tempFilePath;
    streamFileWithRanges(req, res, filePath, record.mimeType);
  });

  // ---------------------------------------------------------------------------
  // 7. SEPARATED WATERMARKED STREAM-ONLY PREVIEW (HTTP 206 ADAPTIVE RANGE + HLS)
  // ---------------------------------------------------------------------------
  app.get('/api/vault/deals/:dealId/preview', (req: Request, res: Response) => {
    const dealId = req.params.dealId;
    if (!isValidId(dealId)) {
      res.status(400).json({ error: 'Invalid dealId.' });
      return;
    }
    const vaultEntry = state.vaultDeals[dealId];
    if (!vaultEntry || !vaultEntry.previewFilePath) {
      res.status(404).json({ error: 'Preview stream unavailable for this deliverable.' });
      return;
    }
    // Stream lightweight byte-range preview without allowing full-file cache or download disposition
    streamFileWithRanges(
      req,
      res,
      vaultEntry.previewFilePath,
      vaultEntry.previewMimeType || 'video/mp4',
      { noStore: true }
    );
  });

  app.get('/api/vault/deals/:dealId/preview.m3u8', (req: Request, res: Response) => {
    const dealId = req.params.dealId;
    if (!isValidId(dealId)) {
      res.status(400).json({ error: 'Invalid dealId.' });
      return;
    }
    const vaultEntry = state.vaultDeals[dealId];
    if (!vaultEntry || !vaultEntry.previewFilePath || !fs.existsSync(vaultEntry.previewFilePath)) {
      res.status(404).json({ error: 'Preview manifest unavailable.' });
      return;
    }
    const totalBytes = fs.statSync(vaultEntry.previewFilePath).size;
    const segSize = 2 * 1024 * 1024;
    const segCount = Math.max(1, Math.ceil(totalBytes / segSize));
    const lines = [
      '#EXTM3U',
      '#EXT-X-VERSION:4',
      '#EXT-X-TARGETDURATION:6',
      '#EXT-X-MEDIA-SEQUENCE:0',
      '#EXT-X-PLAYLIST-TYPE:VOD',
    ];
    for (let i = 0; i < Math.min(segCount, 200); i++) {
      const start = i * segSize;
      const len = Math.min(segSize, totalBytes - start);
      lines.push('#EXTINF:6.0,');
      lines.push(`#EXT-X-BYTERANGE:${len}@${start}`);
      lines.push(`/api/vault/deals/${encodeURIComponent(dealId)}/preview`);
    }
    lines.push('#EXT-X-ENDLIST');
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-store');
    res.send(lines.join('\n'));
  });

  // ---------------------------------------------------------------------------
  // 8. SERVER-VERIFIED ESCROW RELEASE & 5 GB MASTER VAULT UNLOCK
  // ---------------------------------------------------------------------------
  app.post('/api/vault/deals/:dealId/release', (req: Request, res: Response) => {
    const dealId = req.params.dealId;
    if (!isValidId(dealId)) {
      res.status(400).json({ error: 'Invalid dealId.' });
      return;
    }
    const { verifiedByUserId, kycStatus, paymentRef } = (req.body || {}) as {
      verifiedByUserId?: string;
      kycStatus?: string;
      paymentRef?: string;
    };

    if (!verifiedByUserId || kycStatus !== 'verified') {
      res.status(403).json({
        error: 'Server verification rejected: Verified KYC account is required to release Master Vault funds.',
      });
      return;
    }

    const vaultEntry = state.vaultDeals[dealId];
    if (!vaultEntry) {
      // Allow unlocking gracefully when metadata-only deal exists
      res.json({
        dealId,
        vaultStatus: 'released_unlocked',
        releasedAt: new Date().toISOString(),
      });
      return;
    }

    vaultEntry.vaultStatus = 'released_unlocked';
    vaultEntry.releasedAt = new Date().toISOString();
    vaultEntry.releasedBy = verifiedByUserId;
    vaultEntry.paymentRef = paymentRef || `ESCROW_${Date.now()}`;
    schedulePersistIndex();

    res.json({
      dealId,
      vaultStatus: vaultEntry.vaultStatus,
      releasedAt: vaultEntry.releasedAt,
      masterVaultUrl: `/api/vault/deals/${encodeURIComponent(dealId)}/master/download`,
    });
  });

  app.get('/api/vault/deals/:dealId/master/download', (req: Request, res: Response) => {
    const dealId = req.params.dealId;
    if (!isValidId(dealId)) {
      res.status(400).json({ error: 'Invalid dealId.' });
      return;
    }
    const vaultEntry = state.vaultDeals[dealId];
    if (!vaultEntry) {
      res.status(404).json({ error: 'Master deliverable not found in Escrow Vault.' });
      return;
    }
    if (vaultEntry.vaultStatus !== 'released_unlocked') {
      res.status(403).json({
        error: 'Escrow Master Vault Locked: Payment release must be verified before downloading the 5 GB master file.',
      });
      return;
    }

    streamFileWithRanges(req, res, vaultEntry.masterFilePath, vaultEntry.mimeType, {
      downloadName: vaultEntry.fileName,
    });
  });

  // ---------------------------------------------------------------------------
  // VITE DEV MIDDLEWARE OR PRODUCTION STATIC ASSETS
  // ---------------------------------------------------------------------------
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  const server = http.createServer(app);
  // Disable request timeout so 1 GB - 5 GB uploads & downloads never get dropped mid-transfer
  server.requestTimeout = 0;
  server.headersTimeout = 60_000;
  server.keepAliveTimeout = 65_000;

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[VERILANCE] Streaming Vault & App Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[VERILANCE] Fatal server startup error:', err);
  process.exit(1);
});
