const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')
const qrcode = require('qrcode-terminal')
const http = require('http')

// Biar Render gak error "No open ports"
http.createServer((req,res)=>res.end("Bot Jalan")).listen(process.env.PORT || 3000)

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: true
  })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (up) => {
    const { connection, qr } = up
    if(qr){
      console.log("=== SCAN QR INI ===")
      qrcode.generate(qr, {small:true})
    }
    if (connection === 'open') console.log("BOT WA UDAH JALAN MANTAP BOS!")
  })
  const SUMBER = "1203630XXXX@g.us"
  const TUJUAN = "1203630XXXX@g.us"
  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0]
      if (!msg.message || msg.key.fromMe) return
      if (msg.key.remoteJid === SUMBER) {
        await new Promise(r => setTimeout(r, 2000))
        await sock.sendMessage(TUJUAN, { forward: msg })
        console.log("SUKSES FORWARD")
      }
    } catch(e){console.log(e)}
  })
}
startBot()
