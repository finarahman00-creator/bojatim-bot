const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')

const app = express()
app.get('/', (req,res)=>res.send('BOJATIM BOT ON BOS!'))
app.listen(process.env.PORT||3000, ()=>console.log('Web ON'))

async function startBot(){
const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
const sock = makeWASocket({ auth: state, logger: P({level:'silent'}), printQRInTerminal: false, browser: ["BojatimBot","Chrome","1.0"] })
sock.ev.on('creds.update', saveCreds)

if(!sock.authState.creds.registered){
  setTimeout(async()=>{
    try{
      const code = await sock.requestPairingCode("6283134480982")
      console.log("==================================")
      console.log("KODE PAIRING LU BOS: " + code)
      console.log("KODE PAIRING LU BOS: " + code)
      console.log("KODE PAIRING LU BOS: " + code)
      console.log("==================================")
    }catch(e){ console.log("Error pairing:", e.message) }
  }, 5000)
}

sock.ev.on('connection.update', async(u)=>{
const {connection, lastDisconnect} = u
if(connection==='close'){
const c = lastDisconnect?.error?.output?.statusCode
if(c!==DisconnectReason.loggedOut) startBot()
}else if(connection==='open'){
console.log('BOT BOJATIM CONNECTED! SIAP AUTO BALES!')
}
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
