import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import qrcode from 'qrcode-terminal'
import QRCodeImage from 'qrcode'

const require = createRequire(import.meta.url)
const QRCode = require('qrcode-terminal/vendor/QRCode')
const QRErrorCorrectLevel = require('qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel')

export const verificationUrl = 'https://github.com/login/device'
export const passkeyLoginUrl = 'https://github.com/login?passkey=true'

export function extractDeviceCode(output) {
  return output.match(/one-time code(?:\s*\(|:\s*)([A-Z0-9]{4}-[A-Z0-9]{4})\)?/i)?.[1]?.toUpperCase()
}

export async function writeQrSvg(outputPath, targetUrl = verificationUrl) {
  const qr = new QRCode(-1, QRErrorCorrectLevel.L)
  qr.addData(targetUrl)
  qr.make()
  const quiet = 4
  const scale = 10
  const size = (qr.getModuleCount() + quiet * 2) * scale
  const cells = []
  for (let row = 0; row < qr.getModuleCount(); row += 1) {
    for (let col = 0; col < qr.getModuleCount(); col += 1) {
      if (qr.isDark(row, col)) cells.push(`<rect x="${(col + quiet) * scale}" y="${(row + quiet) * scale}" width="${scale}" height="${scale}"/>`)
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="white"/><g fill="black">${cells.join('')}</g></svg>`
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, svg, 'utf8')
  return outputPath
}

export async function writeQrPng(outputPath, targetUrl = verificationUrl) {
  await mkdir(path.dirname(outputPath), { recursive: true })
  await QRCodeImage.toFile(outputPath, targetUrl, {
    errorCorrectionLevel: 'L',
    margin: 4,
    width: 480,
    color: { dark: '#000000', light: '#ffffff' },
  })
  return outputPath
}

export async function runMobileHandoff() {
  console.log('Starting GitHub device authorization locally…')
  console.log('The QR contains only GitHub’s official verification URL; the access token never enters the QR or browser.')

  const child = spawn('gh', [
    'auth', 'login',
    '--hostname', 'github.com',
    '--git-protocol', 'https',
    '--web',
    '--clipboard',
  ], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })

  let combined = ''
  let displayed = false

  const receive = (chunk) => {
    const text = chunk.toString()
    combined += text
    process.stdout.write(text)

    if (!displayed) {
      const code = extractDeviceCode(combined)
      if (code) {
        displayed = true
        console.log('\nSTEP 1 — Sign the phone browser into GitHub with your registered passkey:')
        qrcode.generate(passkeyLoginUrl, { small: true }, (qr) => console.log(qr))
        console.log(`Passkey sign-in: ${passkeyLoginUrl}`)

        console.log('\nSTEP 2 — After passkey sign-in succeeds, scan this QR to authorize GitHub CLI:')
        qrcode.generate(verificationUrl, { small: true }, (qr) => console.log(qr))
        const toolRoot = path.dirname(fileURLToPath(import.meta.url))
        const svgPath = path.resolve(toolRoot, '..', '..', 'artifacts', 'github-device-login-qr.svg')
        const pngPath = path.resolve(toolRoot, '..', '..', 'artifacts', 'github-device-login-qr.png')
        const passkeySvgPath = path.resolve(toolRoot, '..', '..', 'artifacts', 'github-passkey-login-qr.svg')
        const passkeyPngPath = path.resolve(toolRoot, '..', '..', 'artifacts', 'github-passkey-login-qr.png')
        void writeQrSvg(svgPath).then(() => console.log(`Scannable SVG: ${svgPath}`))
        void writeQrPng(pngPath).then(() => console.log(`Scannable PNG: ${pngPath}`))
        void writeQrSvg(passkeySvgPath, passkeyLoginUrl).then(() => console.log(`Passkey SVG: ${passkeySvgPath}`))
        void writeQrPng(passkeyPngPath, passkeyLoginUrl).then(() => console.log(`Passkey PNG: ${passkeyPngPath}`))
        console.log(`GitHub device code: ${code}`)
        console.log(`Fallback link: ${verificationUrl}`)
        console.log('GitHub requires the code to be entered within 15 minutes. This tool will keep polling locally.')
        if (child.stdin.writable) child.stdin.write('\n')
      }
    }
  }

  child.stdout.on('data', receive)
  child.stderr.on('data', receive)

  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code) => resolve(code ?? 1))
  })

  if (exitCode !== 0) throw new Error(`GitHub authentication did not complete (exit ${exitCode}).`)
  console.log('GitHub authentication completed. The token was stored by GitHub CLI using its configured credential store.')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMobileHandoff().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
