const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }) })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (up) => {
    const { connection } = up
    if (connection === 'open') console.log("BOT WA UDAH JALAN")
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
