const http = require('http')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const QRCode = require('qrcode')

let lastQR = null

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }) })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async (u) => {
        const { connection, qr, lastDisconnect } = u
        if(qr) {
            lastQR = await QRCode.toDataURL(qr)
            console.log('QR BARU MUNCUL BOS, BUKA LINK WEB LU!')
        }
        if(connection === 'open') {
            lastQR = null
            console.log('✅ BOT CONNECTED BOS!')
        }
        if(connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot()
    })
}
startBot()

http.createServer(async (req,res)=>{
    if(lastQR){
        res.writeHead(200, {'Content-Type':'text/html'})
        res.end(`<h1>SCAN QR INI BOS - Bojatim Bot</h1><img src="${lastQR}" style="width:400px"><br><p>Refresh otomatis 10 detik</p><script>setTimeout(()=>location.reload(),10000)</script>`)
    } else {
        res.end('BOT ONLINE BOS - QR belum ada atau sudah terhubung, cek Logs di Render')
    }
}).listen(process.env.PORT || 3000, ()=>console.log('WEB READY'))
