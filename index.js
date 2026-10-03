const http = require('http');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')
const qrcode = require('qrcode')

let lastQR = null

http.createServer(async (req,res)=>{
  if(lastQR){
    try{
      const qrImage = await qrcode.toDataURL(lastQR)
      res.writeHead(200, {'Content-Type':'text/html'});
      res.end(`<center><h1>SCAN QR INI DI iPHONE</h1><img src="${qrImage}" style="width:90vw;max-width:500px"><br><p>Refresh kalo expire</p></center>`)
      return
    }catch(e){}
  }
  res.end("Bot Bojatim Jalan - Tunggu QR...")
}).listen(process.env.PORT || 3000);

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false
  })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (up) => {
    const { connection, qr } = up
    if(qr){
      lastQR = qr
      console.log("QR BARU MUNCUL, BUKA LINK BOT LU BUAT SCAN")
    }
    if (connection === 'open'){
      lastQR = null
      console.log("BOT BOJATIM CONNECT MANTAP!")
    }
    if (connection === 'close') startBot()
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
      }
    } catch(e){console.log(e)}
  })
}
startBot()
