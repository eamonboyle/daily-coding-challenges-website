#!/usr/bin/env node
/**
 * Browser harness for verify-daily-challenges.
 * Connects to the Chrome CDP endpoint started by launch.sh.
 *
 *   node browser.mjs goto /
 *   node browser.mjs click --role button --name "Run tests"
 *   node browser.mjs fill --selector "#username" --value "verifyuser"
 *   node browser.mjs select --selector "#language" --value "javascript"
 *   node browser.mjs monaco-set --value "function solution() {}"
 *   node browser.mjs wait-text "Accepted"
 *   node browser.mjs screenshot --path /tmp/verify-daily-challenges/evidence/shot.png
 *   node browser.mjs snapshot --path /tmp/verify-daily-challenges/evidence/page.aria.txt
 *   node browser.mjs request DELETE /api/test/clear-data
 *   node browser.mjs feature daily-challenge
 */

import { createRequire } from "node:module"
import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const here = path.dirname(fileURLToPath(import.meta.url))

function loadState() {
  const statePath =
    process.env.VERIFY_STATE ||
    "/tmp/verify-daily-challenges/run/state.env"
  if (!fs.existsSync(statePath)) {
    throw new Error(`no state file at ${statePath}. Run scripts/launch.sh first.`)
  }
  const env = {}
  for (const line of fs.readFileSync(statePath, "utf8").split("\n")) {
    const cut = line.indexOf("=")
    if (cut === -1) continue
    env[line.slice(0, cut)] = line.slice(cut + 1)
  }
  return env
}

function parseArgs(argv) {
  const cmd = argv[0]
  const rest = argv.slice(1)
  const flags = {}
  const positional = []
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i]
    if (token.startsWith("--")) {
      const key = token.slice(2)
      const next = rest[i + 1]
      if (!next || next.startsWith("--")) {
        flags[key] = true
      } else {
        flags[key] = next
        i++
      }
    } else {
      positional.push(token)
    }
  }
  return { cmd, flags, positional }
}

function resolvePlaywright(state) {
  const tooling = state.VERIFY_TOOLING || "/tmp/verify-daily-challenges/tooling"
  const id = require.resolve("playwright-core", { paths: [tooling] })
  return require(id)
}

async function connect(state) {
  const { chromium } = resolvePlaywright(state)
  const browser = await chromium.connectOverCDP(state.VERIFY_CDP_URL)
  const context = browser.contexts()[0] || (await browser.newContext())
  const page = context.pages()[0] || (await context.newPage())
  page.setDefaultTimeout(30000)
  return { browser, context, page }
}

function absUrl(state, target) {
  if (!target) return state.VERIFY_APP_URL
  if (/^https?:\/\//.test(target)) return target
  const base = state.VERIFY_APP_URL.replace(/\/$/, "")
  return target.startsWith("/") ? base + target : `${base}/${target}`
}

function evidencePath(state, p) {
  if (!p) throw new Error("need --path")
  const resolved = path.isAbsolute(p)
    ? p
    : path.join(state.VERIFY_EVIDENCE_DIR, p)
  fs.mkdirSync(path.dirname(resolved), { recursive: true })
  return resolved
}

async function locatorFor(page, flags) {
  if (flags.selector) return page.locator(flags.selector)
  if (flags.role) {
    const opts = {}
    if (flags.name) opts.name = flags.name
    return page.getByRole(flags.role, opts)
  }
  if (flags.text) return page.getByText(flags.text, { exact: flags.exact === true || flags.exact === "1" })
  throw new Error("need --selector, --role, or --text")
}

const TS_PASS = `function solution(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}`

const TS_FAIL = `function solution(nums: number[]): number {
  return 0;
}`

async function waitForMonaco(page, index = 0) {
  await page.waitForFunction(
    (i) =>
      typeof window.monaco !== "undefined" &&
      window.monaco.editor.getEditors().length > i,
    index,
    { timeout: 30000 }
  )
}

async function monacoSet(page, value, index = 0) {
  await waitForMonaco(page, index)
  await page.evaluate(
    ({ value, index }) => {
      const editor = window.monaco.editor.getEditors()[index]
      editor.setValue(value)
    },
    { value, index }
  )
  await page.waitForFunction(
    ({ value, index }) =>
      window.monaco.editor.getEditors()[index].getValue() === value,
    { value, index }
  )
}

async function submitAndRead(page, submissions) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/challenge/submit") && res.ok(),
      { timeout: 60000 }
    ),
    page.getByRole("button", { name: "Run tests" }).click()
  ])
  submissions.push({ status: response.status(), body: await response.json() })
}

async function waitText(page, text, timeout = 30000) {
  await page.getByText(text).first().waitFor({ state: "visible", timeout })
}

async function snapshot(page, outPath) {
  const body = page.locator("body")
  let tree
  if (typeof body.ariaSnapshot === "function") {
    tree = await body.ariaSnapshot()
  } else {
    tree = await page.locator("html").innerText()
  }
  fs.writeFileSync(outPath, tree)
  return tree
}

async function runFeatureDailyChallenge(state, page) {
  const dir = path.join(state.VERIFY_EVIDENCE_DIR, "daily-challenge")
  fs.mkdirSync(dir, { recursive: true })

  const clear = await page.request.delete(
    absUrl(state, "/api/test/clear-data")
  )
  const clearBody = await clear.text()
  fs.writeFileSync(path.join(dir, "clear-data.json"), clearBody)
  if (!clear.ok()) {
    throw new Error(`clear-data failed: ${clear.status()} ${clearBody}`)
  }

  await page.goto(absUrl(state, "/challenges"), { waitUntil: "domcontentloaded" })
  await page.getByRole("heading", { name: "Daily challenge" }).waitFor()
  await page.getByRole("heading", { name: "Sum Array Elements" }).waitFor({
    timeout: 90000
  })
  await page.locator(".monaco-editor").first().waitFor()
  await page.screenshot({
    path: path.join(dir, "01-loaded.png"),
    fullPage: true
  })

  const submissions = []
  const payloads = []
  page.on("request", (request) => {
    if (!request.url().includes("/api/challenge/submit")) return
    payloads.push(request.postData() || "")
  })

  await monacoSet(page, TS_FAIL)
  await submitAndRead(page, submissions)
  await waitText(page, "Wrong Answer", 60000)
  await page.getByText("Case 1").first().waitFor()
  await page.screenshot({
    path: path.join(dir, "02-wrong-answer.png"),
    fullPage: true
  })

  await monacoSet(page, TS_PASS)
  await submitAndRead(page, submissions)
  await waitText(page, "Accepted", 60000)
  await waitText(page, "Solved. Come back tomorrow for a new problem.")
  await waitText(page, "Reference solution")
  await page.screenshot({
    path: path.join(dir, "03-accepted.png"),
    fullPage: true
  })
  await snapshot(page, path.join(dir, "accepted.aria.txt"))
  fs.writeFileSync(
    path.join(dir, "submit.json"),
    JSON.stringify({ submissions, payloads }, null, 2)
  )

  const db = spawnSync(
    path.join(here, "db.sh"),
    [
      `SELECT status, score, "passedTests", "totalTests", left(code, 80) AS code
       FROM "Submission" ORDER BY "createdAt" DESC LIMIT 5;`
    ],
    { encoding: "utf8" }
  )
  fs.writeFileSync(
    path.join(dir, "db.txt"),
    `${db.stdout || ""}${db.stderr || ""}`
  )
  if (db.status !== 0) {
    throw new Error(`db proof failed: ${db.stderr || db.stdout}`)
  }

  const last = submissions[submissions.length - 1]
  const accepted = last && last.body && last.body.status === "Accepted"
  if (!accepted) {
    throw new Error(
      `expected last submit to be Accepted, got ${JSON.stringify(last)}`
    )
  }
  if (!(payloads[0] || "").includes("return 0")) {
    throw new Error(`failing submit did not send TS_FAIL code: ${payloads[0]}`)
  }
  if (!(payloads[1] || "").includes("nums.reduce")) {
    throw new Error(`passing submit did not send TS_PASS code: ${payloads[1]}`)
  }
  if (!db.stdout.includes("Accepted")) {
    throw new Error(`expected Accepted row in db proof, got:\n${db.stdout}`)
  }

  console.log(`daily-challenge: Accepted score=${last.body.score}`)
  console.log(`evidence: ${dir}`)
}

async function main() {
  const { cmd, flags, positional } = parseArgs(process.argv.slice(2))
  if (!cmd) {
    console.error("usage: node browser.mjs <command> [args]")
    process.exit(2)
  }

  const state = loadState()
  const { page } = await connect(state)

  try {
    // Leave Chrome running. cleanup.sh owns process teardown.
    switch (cmd) {
      case "goto": {
        const url = absUrl(state, positional[0] || flags.path || "/")
        await page.goto(url, { waitUntil: "domcontentloaded" })
        console.log(page.url())
        break
      }
      case "click": {
        const loc = await locatorFor(page, flags)
        await loc.first().click()
        break
      }
      case "fill": {
        const loc = flags.selector
          ? page.locator(flags.selector)
          : await locatorFor(page, flags)
        await loc.first().fill(String(flags.value ?? positional[0] ?? ""))
        break
      }
      case "select": {
        const loc = page.locator(flags.selector)
        await loc.first().selectOption(String(flags.value))
        break
      }
      case "check":
      case "uncheck": {
        const loc = page.locator(flags.selector)
        if (cmd === "check") await loc.first().check()
        else await loc.first().uncheck()
        break
      }
      case "monaco-set": {
        let value = flags.value ? String(flags.value) : ""
        if (flags.file) {
          value = fs.readFileSync(flags.file, "utf8")
        }
        await monacoSet(page, value, Number(flags.index || 0))
        break
      }
      case "wait-text": {
        const text = positional.join(" ") || flags.text
        await waitText(page, text, Number(flags.timeout || 30000))
        break
      }
      case "screenshot": {
        const out = evidencePath(state, flags.path)
        await page.screenshot({ path: out, fullPage: flags.full !== "0" })
        console.log(out)
        break
      }
      case "snapshot": {
        const out = evidencePath(state, flags.path)
        await snapshot(page, out)
        console.log(out)
        break
      }
      case "text": {
        const out = evidencePath(state, flags.path)
        const text = await page.locator("body").innerText()
        fs.writeFileSync(out, text)
        console.log(out)
        break
      }
      case "request": {
        const method = (positional[0] || flags.method || "GET").toUpperCase()
        const url = absUrl(state, positional[1] || flags.path)
        const options = {}
        if (flags.body) {
          options.data = fs.existsSync(flags.body)
            ? fs.readFileSync(flags.body, "utf8")
            : flags.body
          options.headers = { "content-type": "application/json" }
        }
        const response = await page.request.fetch(url, { method, ...options })
        const body = await response.text()
        if (flags.path && flags.path.endsWith(".json")) {
          fs.writeFileSync(evidencePath(state, flags.path), body)
        }
        console.log(response.status())
        console.log(body)
        if (!response.ok()) process.exitCode = 1
        break
      }
      case "eval": {
        const result = await page.evaluate(positional.join(" ") || flags.expr)
        console.log(result)
        break
      }
      case "url": {
        console.log(page.url())
        break
      }
      case "feature": {
        const name = positional[0]
        if (name === "daily-challenge") {
          await runFeatureDailyChallenge(state, page)
        } else {
          throw new Error(
            `unknown feature '${name}'. Mapped recipes besides daily-challenge use the primitive commands.`
          )
        }
        break
      }
      default:
        throw new Error(`unknown command ${cmd}`)
    }
  } catch (error) {
    const dir = path.join(state.VERIFY_EVIDENCE_DIR, "failures")
    fs.mkdirSync(dir, { recursive: true })
    const shot = path.join(dir, `fail-${Date.now()}.png`)
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
    console.error(`failure screenshot: ${shot}`)
    throw error
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error)
  process.exit(1)
})
