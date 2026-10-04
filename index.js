const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const express = require("express")
const fs = require("fs")
const pino = require("pino")
const qrcode = require("qrcode-terminal")

const app = express()
app.get("/", (req,res)=> res.send("BOJATIM BOT AKTIF BOS ✅"))
app.listen(process.env.PORT || 3000, ()=> console.log("Server ON"))

// RESTORE SESSION
if (process.env.SESSION_B64) {
  try {
    const data = JSON.parse(Buffer.from(process.env.SESSION_B64, 'base64').toString())
    if(!fs.existsSync("./auth")) fs.mkdirSync("./auth", { recursive: true })
    fs.writeFileSync("./auth/creds.json", JSON.stringify(data, null, 2))
    console.log("✅ SESSION RESTORED!")
  } catch(e){}
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

    // INI FIX QR NYA BOS - TAMPILIN MANUAL
    if(qr){
      console.log("SCAN QR INI BOS:")
      qrcode.generate(qr, { small: true })
    }

    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
      if (shouldReconnect) startBot()
    } else if (connection === "open") {
      console.log("✅ BOT NYAMBUNG BOS!")
      try {
        const b64 = Buffer.from(fs.readFileSync("./auth/creds.json")).toString('base64')
        console.log("\n\nCOPY INI JADI SESSION_B64 DI RENDER:\n" + b64 + "\n\n")
      } catch(e){}
    }
  })

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0]
    if (!msg.message || msg.key.fromMe) return
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase()
    const jid = msg.key.remoteJid
    if (!text || jid.includes("@g.us")) return

    if (text.includes("halo") || text.includes("hai") || text.includes("harga") || text.includes("vip") || text.includes("masuk")) {
      await sock.sendMessage(jid, { text: `Halo kak 👋\n\nMau masuk VIP BOJATIM ya?\n\n💎 *HARGA: 100RB Lifetime*\nBayar sekali, masuk selamanya + update tiap hari\n\n💸 *BAYAR DI SINI:*\nhttps://saweria.co/bojatim\n\nHabis bayar, ketik *SUDAH BAYAR* ya kak 🙏` })
    }
    else if (text.includes("sudah bayar") || text.includes("done") || text.includes("bayar")) {
      await sock.sendMessage(jid, { text: `Makasih kak udah bayar! ✅🔥\n\nIni 3 link VIP nya:\n\n📲 *TELE VIP 1:*\nhttps://t.me/+R4gUSyHqP_c4MjY1\n\n📲 *TELE VIP 2:*\nhttps://t.me/+ZZxiDJMzOqljMWY1\n\n💬 *WA VIP:*\nhttps://chat.whatsapp.com/JkRcrdXGQX04UsHZ0kbvGZ?mode=gi_t` })
    }
  })
}
startBot()
