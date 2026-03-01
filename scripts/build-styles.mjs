import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const inputPath = resolve('src/style.scss')
const outputPath = resolve('src/style.css')

function isProperty(line) {
  return /:[^;]+;\s*$/.test(line)
}

function combineSelectors(parent, current) {
  if (!parent) return current

  const parents = parent.split(',').map((item) => item.trim())
  const currents = current.split(',').map((item) => item.trim())
  const combined = []

  for (const p of parents) {
    for (const c of currents) {
      combined.push(c.includes('&') ? c.replaceAll('&', p) : `${p} ${c}`)
    }
  }

  return combined.join(', ')
}

function compileScssToCss(scss) {
  const lines = scss.split(/\r?\n/)
  const root = { type: 'root', output: [] }
  const stack = [root]
  const pendingHeaderParts = []

  const appendToParent = (text) => {
    stack[stack.length - 1].output.push(text)
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line || line.startsWith('//')) continue

    if (line !== '}' && !isProperty(line)) {
      pendingHeaderParts.push(line)
    }

    if (line.endsWith('{')) {
      const header = pendingHeaderParts
        .join(' ')
        .slice(0, -1)
        .replace(/\s+/g, ' ')
        .trim()

      pendingHeaderParts.length = 0

      if (header.startsWith('@')) {
        stack.push({ type: 'atrule', header, output: [] })
        continue
      }

      const parentRule = [...stack].reverse().find((ctx) => ctx.type === 'rule')
      const fullSelector = combineSelectors(parentRule?.selector ?? '', header)
      stack.push({ type: 'rule', selector: fullSelector, declarations: [], output: [] })
      continue
    }

    if (line === '}') {
      pendingHeaderParts.length = 0

      if (stack.length === 1) continue
      const ctx = stack.pop()

      if (ctx.type === 'rule') {
        if (ctx.declarations.length) {
          appendToParent(`${ctx.selector} {\n${ctx.declarations.join('\n')}\n}`)
        }

        if (ctx.output.length) {
          appendToParent(ctx.output.join('\n\n'))
        }
      } else if (ctx.type === 'atrule') {
        if (ctx.output.length) {
          appendToParent(`${ctx.header} {\n${ctx.output.join('\n\n')}\n}`)
        }
      }

      continue
    }

    if (isProperty(line)) {
      pendingHeaderParts.length = 0

      const currentRule = stack[stack.length - 1]
      if (currentRule.type === 'rule') {
        currentRule.declarations.push(`  ${line}`)
      }
    }
  }

  return `${root.output.join('\n\n')}\n`
}

const scss = readFileSync(inputPath, 'utf8')
const css = compileScssToCss(scss)
writeFileSync(outputPath, css)
console.log('Built CSS from SCSS:', outputPath)
