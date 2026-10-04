const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const express = require("express")
const fs = require("fs")
const pino = require("pino")

const app = express()
app.get("/", (req,res)=> res.send("BOJATIM BOT AKTIF BOS ✅"))
app.listen(process.env.PORT || 3000, ()=> console.log("Server ON"))

// RESTORE SESSION BIAR GAK SCAN LAGI
if (process.env.SESSION_B64) {
  try {
    const data = JSON.parse(Buffer.from(process.env.SESSION_B64, 'base64').toString())
    if(!fs.existsSync("./auth")) fs.mkdirSync("./auth", { recursive: true })
    fs.writeFileSync("./auth/creds.json", JSON.stringify(data, null, 2))
    console.log("✅ SESSION RESTORED!")
  } catch(e){
    console.log("Gagal restore session:", e.message)
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth")

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: "silent" }),
    browser: ["Bojatim Bot", "Chrome", "1.0"]
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update
    if(qr) console.log("SCAN QR DI ATAS INI BOS!")
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
      if (shouldReconnect) startBot()
      else console.log("Logged out bos, hapus SESSION_B64 dan scan lagi")
    } else if (connection === "open") {
      console.log("✅ BOT NYAMBUNG BOS!")
      try {
        const creds = fs.readFileSync("./auth/creds.json")
        const b64 = Buffer.from(creds).toString('base64')
        console.log("\n\n====== COPY INI JADI SESSION_B64 DI RENDER ======\n")
        console.log(b64)
        console.log("\n====== END COPY ======\n\n")
      } catch(e){}
    }
  })

  // AUTO BALAS 2 STEP PUNYA BOS
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0]
    if (!msg.message || msg.key.fromMe) return

    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "").toLowerCase()
    const jid = msg.key.remoteJid
    if (!text) return
    if (jid.includes("@g.us")) return // gak balas di grup biar gak spam

    // STEP 1 - BELUM BAYAR / TANYA MASUK
    if (text.includes("halo") || text.includes("hai") || text.includes("harga") || text.includes("vip") || text.includes("masuk") || text.includes("join") || text.includes("daftar")) {
      const balasan1 = `Halo kak 👋

Mau masuk VIP BOJATIM ya?

💎 *HARGA: 100RB Lifetime*
Bayar sekali, masuk selamanya + update tiap hari

💸 *BAYAR DI SINI:*
https://saweria.co/bojatim

Habis bayar, ketik *SUDAH BAYAR* ya kak, nanti langsung gue kirim 3 link grup VIP nya otomatis 🙏`

      await sock.sendMessage(jid, { text: balasan1 })
    }
    // STEP 2 - SUDAH BAYAR = KIRIM 3 LINK
    else if (text.includes("sudah bayar") || text.includes("udah bayar") || text.includes("done") || text.includes("sudahbayar") || text.includes("sudah bayar") || text.includes("bayar") && text.length < 20) {
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
