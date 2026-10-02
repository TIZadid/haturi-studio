import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import ffmpeg from 'ffmpeg-static';

const [, , input, outDir, name = 'reel', endAt] = process.argv;
if (!input || !outDir) {
  console.error('usage: npm run encode -- <input video> <output folder> [name] [end seconds]');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
mkdirSync('.media-review', { recursive: true });
const trim = endAt ? ['-t', endAt] : [];
const run = (args) => execFileSync(ffmpeg, ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });

run(['-i', input, ...trim, '-vf', "scale='min(720,iw)':-2", '-c:v', 'libx264', '-preset', 'slow', '-crf', '26',
  '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', join(outDir, `${name}.mp4`)]);
run(['-ss', '1', '-i', input, '-frames:v', '1', '-vf', "scale='min(1080,iw)':-2", '-q:v', '3', join(outDir, `${name}-poster.jpg`)]);
run(['-i', input, '-vf', 'fps=1/2,scale=240:-2,tile=6x2', '-frames:v', '1', join('.media-review', `${name}-contact.jpg`)]);
console.log(`wrote ${join(outDir, name)}.mp4 and poster`);
