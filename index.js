const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const express = require("express")
const fs = require("fs")
const app = express()
app.get("/", (req,res)=> res.send("BOJATIM BOT AKTIF"))
app.listen(process.env.PORT || 3000)

// RESTORE SESSION BIAR GAK SCAN QR LAGI
if (process.env.SESSION_B64) {
  try {
    const data = JSON.parse(Buffer.from(process.env.SESSION_B64, 'base64').toString())
    if(!fs.existsSync("./auth")) fs.mkdirSync("./auth")
    fs.writeFileSync("./auth/creds.json", JSON.stringify(data, null, 2))
    console.log("SESSION RESTORED!")
  } catch(e){}
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth")
  const sock = makeWASocket({ auth: state, printQRInTerminal: true })
  sock.ev.on("creds.update", saveCreds)
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update
    if (connection === "close") {
      if (lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) startBot()
    } else if (connection === "open") {
      console.log("BOT NYAMBUNG!")
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
