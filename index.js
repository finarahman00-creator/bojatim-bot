const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')

const app = express()
app.get('/', (req,res)=>res.send('BOJATIM BOT ON'))
app.listen(process.env.PORT||3000)

async function startBot(){
const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
const sock = makeWASocket({ auth: state, logger: P({level:'silent'}) })
sock.ev.on('creds.update', saveCreds)
sock.ev.on('connection.update', async(u)=>{
const {connection, lastDisconnect, qr} = u
if(qr){console.log('QR LINK BOS: https://api.qrserver.com/v1/create-qr-code/?size=400x400&data='+qr)}
if(connection==='close'){
if(lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) startBot()
}else if(connection==='open'){console.log('BOT BOJATIM CONNECTED!')}
})
sock.ev.on('messages.upsert', async m=>{
const msg=m.messages[0]
if(!msg.message) return
const from=msg.key.remoteJid
if(from.endsWith('@s.whatsapp.net')){
if(msg.key.fromMe) return
await sock.sendMessage(from,{text:"gabung grup 100.000 yg mau bo silahkan. Wajib grup"})
}
})
}
startBot()
