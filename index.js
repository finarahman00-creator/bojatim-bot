const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')

// BIAR RENDER GAK ERROR PORT
const app = express()
app.get('/', (req,res) => res.send('Bot BOJATIM ON BOS!'))
app.listen(process.env.PORT || 3000, () => console.log('Web server on'))

async function startBot() {
const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
const sock = makeWASocket({
auth: state,
logger: P({ level: 'silent' }),
})

sock.ev.on('creds.update', saveCreds)

sock.ev.on('connection.update', async (update) => {
const { connection, lastDisconnect, qr } = update
if(qr){
console.log('QR CODE:', qr)
// QR bakal muncul link, buka di browser buat scan
console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qr}`)
}
if(connection === 'close') {
const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
if(shouldReconnect) startBot()
} else if(connection === 'open') {
console.log('Bot BOJATIM Connected! AUTO BALES AKTIF!')
}
})

sock.ev.on('messages.upsert', async m => {
const msg = m.messages[0]
if(!msg.message) return
const from = msg.key.remoteJid
if(from.endsWith('@s.whatsapp.net')) {
if(msg.key.fromMe) return
await sock.sendMessage(from, { text: "gabung grup 100.000 yg mau bo silahkan. Wajib grup" })
return
}
if(!from.endsWith('@g.us')) return
const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase()
if(body === ".menu") await sock.sendMessage(from, { text: "MENU BOJATIM" })
if(body === ".tagall") {
const meta = await sock.groupMetadata(from)
let teks = "*TAG ALL BOJATIM:*\n\n"
let mentions = []
for(let p of meta.participants){mentions.push(p.id); teks+=`@${p.id.split('@')[0]}\n`}
await sock.sendMessage(from, { text: teks, mentions })
}
})
}
startBot()
}
startBot()
