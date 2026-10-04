const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const P = require('pino')
const http = require('http')

// BIAR RENDER GAK ERROR NO PORT
http.createServer((req,res)=>res.end('Bot online')).listen(process.env.PORT || 3000)

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' })
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        if(qr){
            console.log('=== SCAN QR DI BAWAH INI BOS ===')
            qrcode.generate(qr, { small: true })
        }
        if(connection === 'close'){
            if(lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot()
        } else if(connection === 'open'){
            console.log('BOT CONNECTED ✅')
        }
    })
}
startBot()
