import { NextResponse } from 'next/server';
import archiver from 'archiver';

// Force dynamic rendering — never cache this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { readdir, stat, lstat } from 'fs/promises';
import { join, relative, sep } from 'path';
import { ReadStream, createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

// Directories and files to exclude
const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  '.bun',
  'db',
  'download',
  'upload',
  'mini-services',
]);

const EXCLUDE_FILES = new Set([
  'SmartBasket-SourceCode.zip',
  'SmartBasket-Project.zip',
  '.env',
  '.env.local',
  'bun.lock',
]);

const EXCLUDE_EXTENSIONS = new Set([
  '.db',
  '.sqlite',
  '.sqlite3',
  '.log',
  '.pem',
]);

function shouldInclude(filePath: string): boolean {
  const parts = filePath.split(sep);
  
  // Check excluded directories
  for (const part of parts) {
    if (EXCLUDE_DIRS.has(part)) return false;
  }
  
  // Check excluded files
  const fileName = parts[parts.length - 1];
  if (EXCLUDE_FILES.has(fileName)) return false;
  
  // Check excluded extensions
  const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
  if (EXCLUDE_EXTENSIONS.has(ext)) return false;
  
  return true;
}

async function addDirectoryToZip(
  archive: archiver.Archiver,
  dirPath: string,
  zipRoot: string
): Promise<void> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    
    if (!shouldInclude(fullPath)) continue;
    
    const relativePath = relative(zipRoot, fullPath);
    
    if (entry.isDirectory()) {
      await addDirectoryToZip(archive, fullPath, zipRoot);
    } else if (entry.isFile()) {
      const fileStat = await stat(fullPath);
      if (fileStat.size > 50 * 1024 * 1024) {
        // Skip files larger than 50MB
        console.log(`Skipping large file: ${relativePath}`);
        continue;
      }
      archive.file(fullPath, { name: relativePath });
    }
  }
}

export async function GET() {
  try {
    const projectRoot = process.cwd();
    const timestamp = Date.now();
    const tmpZipPath = join(projectRoot, `_temp_download_${timestamp}.zip`);
    
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    // Create write stream to temp file
    const output = createWriteStream(tmpZipPath);
    
    // Track completion
    let archiveFinalized = false;
    
    const done = new Promise<void>((resolve, reject) => {
      output.on('close', () => {
        archiveFinalized = true;
        resolve();
      });
      output.on('error', reject);
      archive.on('error', reject);
    });

    // Pipe archive to output
    archive.pipe(output);

    // Add all files from project root
    await addDirectoryToZip(archive, projectRoot, projectRoot);

    // Finalize the archive
    archive.finalize();

    // Wait for completion
    await done;

    // Read the generated ZIP
    const { readFileSync, unlinkSync } = await import('fs');
    const fileBuffer = readFileSync(tmpZipPath);
    
    // Clean up temp file
    try {
      unlinkSync(tmpZipPath);
    } catch {}

    const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
    console.log(`ZIP generated: ${fileSizeMB} MB`);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="SmartBasket-${timestamp}.zip"`,
        'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('ZIP generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate source code ZIP' },
      { status: 500 }
    );
  }
}
