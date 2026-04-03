import { NextResponse } from 'next/server';
import archiver from 'archiver';
import { readdir, stat } from 'fs/promises';
import { join, relative, sep } from 'path';
import { createWriteStream } from 'fs';

// Force dynamic — never cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Directories to exclude from ZIP
const EXCLUDE_DIRS = new Set([
  'node_modules', '.next', '.git', '.bun',
  'db', 'download', 'upload', 'mini-services',
]);

// Files to exclude
const EXCLUDE_FILES = new Set([
  '.env', '.env.local', 'bun.lock',
  'SmartBasket-SourceCode.zip', 'SmartBasket-Project.zip',
]);

// Extensions to exclude
const EXCLUDE_EXTENSIONS = new Set(['.db', '.sqlite', '.sqlite3', '.log', '.pem']);

function shouldInclude(filePath: string): boolean {
  const parts = filePath.split(sep);
  for (const part of parts) {
    if (EXCLUDE_DIRS.has(part)) return false;
  }
  const fileName = parts[parts.length - 1];
  if (EXCLUDE_FILES.has(fileName)) return false;
  if (fileName.startsWith('_temp_') || fileName.startsWith('_dl_')) return false;
  const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
  if (EXCLUDE_EXTENSIONS.has(ext)) return false;
  return true;
}

async function addDirToZip(
  archive: archiver.Archiver,
  dir: string,
  root: string
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (!shouldInclude(full)) continue;
    if (entry.isDirectory()) {
      await addDirToZip(archive, full, root);
    } else if (entry.isFile()) {
      const s = await stat(full);
      if (s.size <= 50 * 1024 * 1024) {
        archive.file(full, { name: relative(root, full) });
      }
    }
  }
}

export async function GET() {
  try {
    const root = process.cwd();
    const ts = Date.now();
    const tmpPath = join(root, `_dl_${ts}.zip`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    const output = createWriteStream(tmpPath);

    const done = new Promise<void>((resolve, reject) => {
      output.on('close', resolve);
      output.on('error', reject);
      archive.on('error', reject);
    });

    archive.pipe(output);
    await addDirToZip(archive, root, root);
    archive.finalize();
    await done;

    const { readFileSync, unlinkSync } = await import('fs');
    const buf = readFileSync(tmpPath);
    try { unlinkSync(tmpPath); } catch {}

    console.log(`Fresh ZIP: ${(buf.length / 1048576).toFixed(2)} MB, ${ts}`);

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="SmartBasket-Latest-${ts}.zip"`,
        'Content-Length': buf.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': `"${ts}"`,
        'X-Download-Timestamp': ts.toString(),
      },
    });
  } catch (error) {
    console.error('ZIP error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
