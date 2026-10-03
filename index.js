const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys') const P = require('pino')
async function startBot() { const { state, saveCreds } = await useMultiFileAuthState('auth') const sock = makeWASocket({ logger: P({ level: 'silent' }), printQRInTerminal: false, auth: state, browser: ["Bojatim Bot", "Chrome", "1.0"] })
if (!sock.authState.creds.registered) {
    const phoneNumber = "6283134480982"
    setTimeout(async () => {
        try {
            let code = await sock.requestPairingCode(phoneNumber)
            console.log(`PAIRING CODE UNTUK 083134480982: ${code}`)
            console.log(`PAIRING CODE: ${code}`)
        } catch (e) {
            console.log("Gagal minta pairing code:", e.message)
        }
    }, 5000)
}

sock.ev.on('creds.update', saveCreds)

sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
        console.log("Koneksi terputus, reconnect:", shouldReconnect)
        if (shouldReconnect) startBot()
    } else if (connection === 'open') {
        console.log("Bot Connected! Bojatim Bot Aktif!")
    }
})

sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    if (text.toLowerCase() === 'ping') {
        await sock.sendMessage(msg.key.remoteJid, { text: 'Pong! Bot Bojatim Aktif Bos!' })
    }
})
}
startBot()
