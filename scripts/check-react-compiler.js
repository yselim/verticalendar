/* eslint-env node */
/**
 * Reports which components React Compiler compiles and which it skips (bails out of).
 * Skipped components still work, but lose automatic memoization.
 * Usage: node scripts/check-react-compiler.js   (exits 1 if anything is skipped)
 */
const babel = require("@babel/core")
const fs = require("fs")
const path = require("path")

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return walk(p)
    return /\.tsx$/.test(e.name) && !/\.test\.tsx$/.test(e.name) ? [p] : []
  })

let failures = 0
for (const file of walk(path.join(__dirname, "..", "app"))) {
  const events = []
  babel.transformSync(fs.readFileSync(file, "utf8"), {
    filename: file,
    babelrc: false,
    configFile: false,
    presets: [["@babel/preset-typescript", { isTSX: true, allExtensions: true }]],
    plugins: [["babel-plugin-react-compiler", { logger: { logEvent: (_f, e) => events.push(e) } }]],
  })
  const rel = path.relative(process.cwd(), file)
  for (const e of events) {
    if (e.kind === "CompileSuccess") continue
    if (e.kind === "CompileError" || e.kind === "CompileSkip" || e.kind === "PipelineError") {
      failures++
      const reason = e.detail?.reason ?? e.detail?.options?.reason ?? e.data ?? e.kind
      console.log(`SKIPPED ${rel} ${e.fnName ?? ""}: ${String(reason).split("\n")[0]}`)
    }
  }
}
console.log(failures ? `${failures} component(s) skipped by React Compiler` : "All components compile.")
process.exit(failures ? 1 : 0)
