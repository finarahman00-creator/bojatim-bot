const http = require('http')
const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const P = require('pino')
const QRCode = require('qrcode')

let lastQR = null

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }) })
    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if(!msg.message || msg.key.fromMe) return
        const from = msg.key.remoteJid
        if(from.endsWith('@g.us')) return

        const saweriaLink = 'https://saweria.co/bojatim'

        await sock.sendMessage(from, { text:
`Yg mau grup bo, wajib gabung grup dulu ya kak ☕

*HARGA MASUK: 100RB Lifetime*

*METODE BAYAR 100RB:*
DANA: 083134480982
GOPAY: 083134480982
ShopeePay: 083134480982
BCA: 1663545594 a.n Mia kharisma
SAWERIA: ${saweriaLink}

Kirim bukti TF kesini ya kak, nanti link grup langsung dikirim! ✅`
        })
    })

    sock.ev.on('connection.update', async (u) => {
        const { connection, qr, lastDisconnect } = u
        if(qr) lastQR = await QRCode.toDataURL(qr)
        if(connection === 'open') {
            lastQR = null
            console.log('BOT CONNECTED ✅')
        }
        if(connection === 'close' && lastDisconnect?.error?.output?.statusCode!== 401) {
            startBot()
        }
    })
}
startBot()

http.createServer((req,res)=>{
    if(lastQR){
        res.writeHead(200, {'Content-Type':'text/html'})
        res.end(`<img src="${lastQR}" width="300"/><h2>Scan QR ini bos!</h2><script>setTimeout(()=>location.reload(),3000)</script>`)
    } else {
        res.writeHead(200, {'Content-Type':'text/plain'})
        res.end('BOT AKTIF BOS')
    }
}).listen(process.env.PORT || 3000)
