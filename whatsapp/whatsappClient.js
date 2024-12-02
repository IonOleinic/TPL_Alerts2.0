const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const fileLogger = require('../logger/fileLogger')
const { getStocks } = require('../TVM/stocks/tvmStocks')
const utils = require('../utils')
const {
  authorizedToRespond,
  authorizedToCollect,
} = require('./authorizedContacts')

// const client = new Client({})
const client = new Client({ authStrategy: new LocalAuth() })
// const client = new Client({
//   authStrategy: new LocalAuth({ dataPath: 'sessions' }),
//   webVersionCache: {
//     type: 'remote',
//     remotePath:
//       'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2410.1.html',
//   },
// })

client.on('qr', (qr) => {
  // Generate and scan this code with your phone
  console.log('Scan QR:\n')
  qrcode.generate(qr, { small: true })
})

client.on('ready', async () => {
  fileLogger.log('WhatsApp client is ready!')
})

client.on('message', (msg) => {
  console.log(`${msg.from} (${msg._data.notifyName}) : ${msg.body}\n`)
  analyzeMessage(msg)
})

function analyzeMessage(msg) {
  msg.body = msg.body.trim()
  if (msg?.body?.toUpperCase() == 'STOCURI BANCNOTE') {
    if (authorizedToRespond.includes(msg.from)) {
      fileLogger.log(`${msg.from} (${msg._data.notifyName}) : ${msg.body}`)
      replyCurrentStocks(msg)
    } else {
      msg.reply('Nu sunteti autorizat.')
      fileLogger.warning(
        `${msg.from} is not authorized to check current stocks.`
      )
    }
  }
}
async function replyCurrentStocks(msg) {
  while (true) {
    try {
      msg.reply(await getStocks('yes'))
      break
    } catch (error) {
      fileLogger.error(error)
      fileLogger.error(
        `Error during replying curent stocks. Retry after 5 seconds...`
      )
      await utils.sleep(5)
    }
  }
}
async function politeAnswer(msg) {
  msg.reply(`Ok. Multumesc.`)
}
module.exports = client
