const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    browser: ['Bojatim Bot', 'Chrome', '1.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
      if (shouldReconnect) startBot()
    } else if (connection === 'open') {
      console.log('Bot Connected!')
    }
  })

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0]
    if (!msg.message) return
    const text = msg.message.conversation  msg.message.extendedTextMessage?.text  ''
    if (text.toLowerCase() === 'ping') {
      await sock.sendMessage(msg.key.remoteJid, { text: 'Pong! Bot aktif ✅' })
    }
  })
}

startBot()
