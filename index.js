const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')
const http = require('http')
const fs = require('fs')

// RESTORE SESSION PERMANEN DARI ENV
if(process.env.SESSION){
try{
const data = JSON.parse(Buffer.from(process.env.SESSION,'base64').toString())
if(!fs.existsSync('auth')) fs.mkdirSync('auth')
for(let f in data){ fs.writeFileSync('auth/'+f, Buffer.from(data[f],'base64')) }
console.log("SESSION PERMANEN RESTORED!")
}catch(e){console.log("SESSION ERROR: "+e)}
}

http.createServer((req,res)=>res.end('BOT PERMANEN AKTIF')).listen(process.env.PORT||3000)

async function startBot(){
const { state, saveCreds } = await useMultiFileAuthState('auth')
const sock = makeWASocket({auth:state,logger:P({level:'silent'}),browser:["Bojatim Bot","Chrome","1.0"]})
sock.ev.on('creds.update',saveCreds)

sock.ev.on('connection.update',async u=>{
if(u.qr){
console.log("SCAN QR INI BOS!!!")
console.log("https://api.qrserver.com/v1/create-qr-code/?size=400x400&data="+encodeURIComponent(u.qr))
}
if(u.connection==='open'){
console.log("BOT SIAP - CONNECTED SUKSES!!!")
try{
let files={}
let list=fs.readdirSync('auth')
for(let f of list){ files[f]=fs.readFileSync('auth/'+f).toString('base64') }
let sessionStr = Buffer.from(JSON.stringify(files)).toString('base64')
console.log("==================================")
console.log("SESSION PERMANEN LU (COPY SEMUA!):")
console.log(sessionStr)
console.log("==================================")
console.log("COPY KODE DI ATAS, MASUKIN KE RENDER ENV!")
}catch(e){console.log(e)}
}
if(u.connection==='close'){startBot()}
})

sock.ev.on('messages.upsert',async m=>{
const msg=m.messages[0]
if(!msg.message)return
const from=msg.key.remoteJid
if(!from.endsWith('@g.us'))return
const body=(msg.message.conversation||msg.message.extendedTextMessage?.text||"").trim()
if(body===".menu"){await sock.sendMessage(from,{text:"BOT BOJATIM AKTIF ✅ PERMANEN\nKetik.tagall"})}
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
