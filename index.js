const http = require('http')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const QRCode = require('qrcode')

let lastQR = null

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }) })
    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if(!msg.message) return
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
        const from = msg.key.remoteJid
        if(text.toLowerCase() === '.ping') await sock.sendMessage(from, { text: 'Bot Bojatim Online Bos ✅' })
    })

    sock.ev.on('connection.update', async (u) => {
        const { connection, qr, lastDisconnect } = u
        if(qr) lastQR = await QRCode.toDataURL(qr)
        if(connection === 'open') {
            lastQR = null
            console.log('BOT CONNECTED ✅')
        }
        if(connection === 'close' && lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) startBot()
    })
}
startBot()

http.createServer((req,res)=>{
    if(lastQR){
        res.writeHead(200, {'Content-Type':'text/html'})
        res.end(`<center><h1>SCAN QR BOJATIM</h1><img src="${lastQR}" style="width:350px"><p>Auto refresh 10 detik</p><script>setTimeout(()=>location.reload(),8000)</script></center>`)
    } else {
        res.end('BOT ONLINE BOS ✅ - QR sudah discan / belum muncul')
    }
}).listen(process.env.PORT || 3000)
