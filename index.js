const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')
const http = require('http')
http.createServer((req,res)=>res.end('BOJATIM BOT AKTIF')).listen(process.env.PORT||3000)

async function startBot(){
const { state, saveCreds } = await useMultiFileAuthState('auth')
const sock = makeWASocket({auth:state,logger:P({level:'silent'}),browser:["Bojatim Bot","Chrome","1.0"]})
sock.ev.on('creds.update',saveCreds)
sock.ev.on('connection.update',u=>{if(u.connection==='open')console.log("BOT SIAP - ONLINE");if(u.connection==='close')startBot()})
sock.ev.on('messages.upsert',async m=>{
const msg=m.messages[0];if(!msg.message)return
const from=msg.key.remoteJid;if(!from.endsWith('@g.us'))return
const body=(msg.message.conversation||msg.message.extendedTextMessage?.text||"").trim()
const pushName=msg.pushName||"Bos"
console.log(pushName+": "+body)
if(body===".menu"){await sock.sendMessage(from,{text:"BOT BOJATIM AKTIF ✅\nKetik.tagall buat tag semua"})}
if(body===".tagall"||body===".tag"){const meta=await sock.groupMetadata(from);let teks="*TAG ALL BY BOJATIM:*\n\n";let mentions=[];for(let p of meta.participants){mentions.push(p.id);teks+="@"+p.id.split('@')[0]+" \n"}await sock.sendMessage(from,{text:teks,mentions})}
})
}
startBot()
