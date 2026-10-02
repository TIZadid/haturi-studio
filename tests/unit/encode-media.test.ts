import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ffmpeg from 'ffmpeg-static';
import { expect, it } from 'vitest';

it('encodes a vertical clip into a small web mp4 with poster', () => {
  const dir = mkdtempSync(join(tmpdir(), 'haturi-enc-'));
  const src = join(dir, 'src.mp4');
  execFileSync(ffmpeg as unknown as string, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc=duration=3:size=1080x1920:rate=30', '-c:v', 'libx264', '-crf', '10', src]);
  execFileSync('node', ['scripts/encode-media.mjs', src, dir, 'clip']);
  expect(existsSync(join(dir, 'clip.mp4'))).toBe(true);
  expect(existsSync(join(dir, 'clip-poster.jpg'))).toBe(true);
  expect(statSync(join(dir, 'clip.mp4')).size).toBeLessThan(statSync(src).size);
}, 60_000);

it('trims the output to an end time when given one', () => {
  const dir = mkdtempSync(join(tmpdir(), 'haturi-trim-'));
  const src = join(dir, 'src.mp4');
  execFileSync(ffmpeg as unknown as string, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc=duration=4:size=720x1280:rate=30', '-c:v', 'libx264', src]);
  execFileSync('node', ['scripts/encode-media.mjs', src, dir, 'cut', '1.5']);
  let info = '';
  try { execFileSync(ffmpeg as unknown as string, ['-i', join(dir, 'cut.mp4')], { stdio: 'pipe' }); } catch (e) { info = String((e as { stderr: Buffer }).stderr); }
  const [, h, m, s] = info.match(/Duration: (\d+):(\d+):([\d.]+)/)!;
  expect(Number(h) * 3600 + Number(m) * 60 + Number(s)).toBeLessThan(2);
}, 60_000);
