const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const express = require("express")
const fs = require("fs")
const pino = require("pino")
const QRCode = require("qrcode")

const app = express()
let qrTerakhir = ""

app.get("/", (req,res)=> res.redirect("/qr"))
app.get("/qr", async (req,res)=>{
  if(!qrTerakhir) return res.send("<h1>BOT UDAH NYAMBUNG / TUNGGU QR 10 DETIK LAGI</h1><script>setTimeout(()=>location.reload(),5000)</script>")
  const img = await QRCode.toDataURL(qrTerakhir)
  res.send(`<center><h1>SCAN QR BOJATIM BOS</h1><img src="${img}" width="350"><p>QR refresh otomatis 20 detik</p></center><script>setTimeout(()=>location.reload(),20000)</script>`)
})
app.listen(process.env.PORT || 3000)

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth")
  const sock = makeWASocket({ auth: state, logger: pino({ level: "silent" }) })
  sock.ev.on("creds.update", saveCreds)
  sock.ev.on("connection.update", (u)=>{
    if(u.qr) qrTerakhir = u.qr
    if(u.connection==="open"){ qrTerakhir=""; console.log("BOT NYAMBUNG!") }
    if(u.connection==="close") startBot()
  })
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0]; if (!msg.message || msg.key.fromMe) return
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase()
    const jid = msg.key.remoteJid
    if (!text || jid.includes("@g.us")) return
    if (text.includes("halo") || text.includes("hai") || text.includes("harga") || text.includes("vip")) {
      await sock.sendMessage(jid, { text: `Halo kak 👋\n💎 HARGA: 100RB Lifetime\n💸 BAYAR: https://saweria.co/bojatim\nKetik SUDAH BAYAR habis bayar` })
    } else if (text.includes("sudah bayar") || text.includes("bayar")) {
      await sock.sendMessage(jid, { text: `Makasih kak ✅\nTELE 1: https://t.me/+R4gUSyHqP_c4MjY1\nTELE 2: https://t.me/+ZZxiDJMzOqljMWY1\nWA VIP: https://chat.whatsapp.com/JkRcrdXGQX04UsHZ0kbvGZ?mode=gi_t` })
    }
  })
}
startBot()
