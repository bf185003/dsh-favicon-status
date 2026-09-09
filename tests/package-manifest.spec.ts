/** Package metadata must be readable by the dsh profile loader. */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('package manifest', () => {
  it('is strict JSON with the favicon bundle declaration', () => {
    const raw = readFileSync(new URL('../package.json', import.meta.url), 'utf8')

    expect(raw.codePointAt(0)).not.toBe(0xfeff)
    expect(JSON.parse(raw)).toMatchObject({
      name: 'dsh-favicon-status',
      dsh: { bundle: { patch: 'cordis.patch.yml' } },
    })
  })
})
