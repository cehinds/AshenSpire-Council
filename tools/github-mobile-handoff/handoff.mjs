import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import qrcode from 'qrcode-terminal'

export const verificationUrl = 'https://github.com/login/device'

export function extractDeviceCode(output) {
  return output.match(/one-time code(?:\s*\(|:\s*)([A-Z0-9]{4}-[A-Z0-9]{4})\)?/i)?.[1]?.toUpperCase()
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
        console.log('\nScan this QR with your phone:')
        qrcode.generate(verificationUrl, { small: true }, (qr) => console.log(qr))
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
