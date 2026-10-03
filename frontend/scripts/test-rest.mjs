import { build } from 'esbuild'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const temporary = await mkdtemp(join(tmpdir(), 'timecapsule-rest-'))
try {
  const outfile = join(temporary, 'rest.test.cjs')
  await build({ entryPoints: ['tests/rest.test.ts'], outfile, bundle: true, platform: 'node', format: 'cjs', target: 'node18' })
  const result = spawnSync(process.execPath, ['--test', outfile], { stdio: 'inherit', env: process.env })
  process.exitCode = result.status ?? 1
} finally { await rm(temporary, { recursive: true, force: true }) }
