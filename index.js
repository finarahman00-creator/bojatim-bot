const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const express = require("express")
const fs = require("fs")
const pino = require("pino")
const qrcode = require("qrcode-terminal")
const QRCode = require("qrcode")

const app = express()
let lastQR = null

// LINK QR BIAR GAMPANG SCAN
app.get("/", (req,res)=> res.send("BOJATIM BOT AKTIF BOS ✅ - buka /qr buat QR"))
app.get("/qr", async (req,res)=>{
  if(!lastQR) return res.send("<h1>BOT UDAH NYAMBUNG BOS! / QR BELUM ADA</h1><p>Kalau baru deploy tunggu 20 detik terus refresh</p>")
  try {
    const qrImage = await QRCode.toDataURL(lastQR)
    res.send(`<center><h1>SCAN QR BOJATIM BOS</h1><img src="${qrImage}" style="width:350px;border:10px solid #000"><p>QR auto refresh 20 detik - expired? refresh aja</p></center><script>setTimeout(()=>location.reload(),20000)</script>`)
  } catch(e){ res.send("Error QR, refresh") }
})
app.listen(process.env.PORT || 3000, ()=> console.log("Server ON"))

// RESTORE SESSION BIAR GAK SCAN QR LAGI
if (process.env.SESSION_B64) {
  try {
    const data = JSON.parse(Buffer.from(process.env.SESSION_B64, 'base64').toString())
    if(!fs.existsSync("./auth")) fs.mkdirSync("./auth", { recursive: true })
    fs.writeFileSync("./auth/creds.json", JSON.stringify(data, null, 2))
    console.log("✅ SESSION RESTORED!")
  } catch(e){ console.log("Gagal restore") }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth")
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["Bojatim Bot", "Chrome", "1.0"]
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update

    if(qr){
      lastQR = qr
      console.log("QR BARU MUNCUL - BUKA /qr")
      qrcode.generate(qr, { small: true })
    }

    if (connection === "close") {
      if (lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) startBot()
    } else if (connection === "open") {
      lastQR = null
      console.log("BOT NYAMBUNG BOS!")
      try {
        const b64 = Buffer.from(fs.readFileSync("./auth/creds.json")).toString('base64')
        console.log("\n\nCOPY INI JADI SESSION_B64 DI RENDER:\n" + b64 + "\n\n")
      } catch(e){}
    }
  })

  // AUTO BALAS 2 STEP - PUNYA BOS PERSIS 100%
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0]
    if (!msg.message || msg.key.fromMe) return
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase()
    const jid = msg.key.remoteJid
    if (!text) return
    if (jid.includes("@g.us")) return

    // STEP 1 - BELUM BAYAR
    if (text.includes("halo") || text.includes("hai") || text.includes("harga") || text.includes("vip") || text.includes("masuk")) {
      const balasan1 = `Halo kak 👋

Mau masuk VIP BOJATIM ya?

💎 *HARGA: 100RB Lifetime*
Bayar sekali, masuk selamanya + update tiap hari

💸 *BAYAR DI SINI:*
https://saweria.co/bojatim

Habis bayar, ketik *SUDAH BAYAR* ya kak, nanti langsung gue kirim 3 link grup VIP nya otomatis 🙏`
      await sock.sendMessage(jid, { text: balasan1 })
    }
    // STEP 2 - SUDAH BAYAR, BARU KIRIM LINK
    else if (text.includes("sudah bayar") || text.includes("udah bayar") || text.includes("done") || text.includes("sudahbayar") || text.includes("bayar")) {
      const balasan2 = `Makasih kak udah bayar! ✅🔥

Ini 3 link VIP nya, langsung join ya kak:

📲 *TELE VIP 1:*
https://t.me/+R4gUSyHqP_c4MjY1

📲 *TELE VIP 2:*
https://t.me/+ZZxiDJMzOqljMWY1

💬 *WA VIP:*
https://chat.whatsapp.com/JkRcrdXGQX04UsHZ0kbvGZ?mode=gi_t

Jangan lupa di-save ya kak, kalau kehapus chat gue lagi aja ketik SUDAH BAYAR lagi 🙏`
      await sock.sendMessage(jid, { text: balasan2 })
    }
  })
}
startBot()
