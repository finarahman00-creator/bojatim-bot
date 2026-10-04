const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const P = require("pino")
const QRCode = require('qrcode')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: false // QR GAMBAR ASLI BOS
    })
    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { qr, connection } = update
        if (qr) {
            await QRCode.toFile('./qr.png', qr)
            console.log('✅ QR GAMBAR ASLI JADI: qr.png - SCAN SEKARANG BOS!')
        }
        if (connection === 'open') {
            console.log('✅ BOT SUDAH CONNECT BOS!')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return
        if (msg.key.remoteJid.includes('@g.us')) return

        const from = msg.key.remoteJid

        // CHAT APAPUN DIBALAS INI BOS
        await sock.sendMessage(from, { text: `Yg mau bo wajib gabung grup dulu 100.000

DANA/GOPAY/ShopeePay: 083134480982
BCA: 1663545594 a.n Mia kharisma
Saweria: https://saweria.co/bojatim

Kirim bukti kesini ya kak!` })
    })
}

startBot()
