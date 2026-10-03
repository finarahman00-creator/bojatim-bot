const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    browser: ["Bojatim Bot", "Chrome", "1.0"]
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (u)=>{
    if(u.connection === 'open') console.log("BOT CONNECT MANTAP! GRUP TES UDAH SIAP!")
    if(u.connection === 'close') startBot()
  })

  sock.ev.on('messages.upsert', async (m)=>{
    const msg = m.messages[0]
    if(!msg.message) return

    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    if(!isGroup) return // cuma respon grup aja

    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    const pushName = msg.pushName || "Member"

    console.log(`[${from}] ${pushName}: ${body}`)

    if(body === '.menu'){
      await sock.sendMessage(from, { text: `*BOT BOJATIM TES AKTIF*\n\nHalo ${pushName}!\nBot udah masuk grup Tes ✅\n\nFitur:\n.menu - cek bot\n.tagall - tag semua member\n\nOwner: Rahman` })
    }

    if(body === '.tagall' || body === '.tag'){
      const meta = await sock.groupMetadata(from)
      const members = meta.participants.map(p=>p.id)
      await sock.sendMessage(from, { text: `Tag all by ${pushName}:\n` + members.map(m=>`@${m.split('@')[0]}`).join('\n'), mentions: members })
    }
  })
}
startBot()
