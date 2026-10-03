const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')
const http = require('http')
http.createServer((req,res)=>res.end('BOT AKTIF')).listen(process.env.PORT||3000)

async function startBot(){
const { state, saveCreds } = await useMultiFileAuthState('auth')
const sock = makeWASocket({auth:state,logger:P({level:'silent'}),browser:["Bojatim Bot","Chrome","1.0"]})
sock.ev.on('creds.update',saveCreds)

sock.ev.on('connection.update',u=>{
if(u.qr){
console.log("SCAN QR INI BOS!!!")
console.log("Buka: https://api.qrserver.com/v1/create-qr-code/?size=400x400&data="+encodeURIComponent(u.qr))
console.log("ATAU cek di log Render ada QR string, copy!")
}
if(u.connection==='open'){console.log("BOT SIAP - CONNECTED SUKSES!!!")}
if(u.connection==='close'){startBot()}
})

sock.ev.on('messages.upsert',async m=>{
const msg=m.messages[0]
if(!msg.message)return
const from=msg.key.remoteJid
if(!from.endsWith('@g.us'))return
const body=(msg.message.conversation||msg.message.extendedTextMessage?.text||"").trim()
console.log("PESAN: "+body)
if(body===".menu"){await sock.sendMessage(from,{text:"BOT BOJATIM AKTIF ✅\nKetik.tagall"})}
if(body===".tagall"){
const meta=await sock.groupMetadata(from)
let teks="*TAG ALL BOJATIM:*\n\n"
let mentions=[]
for(let p of meta.participants){mentions.push(p.id);teks+="@"+p.id.split('@')[0]+" \n"}
await sock.sendMessage(from,{text:teks,mentions})
}
})
}
startBot()
