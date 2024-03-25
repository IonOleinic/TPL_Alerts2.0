const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const fileLogger = require('../logger/fileLogger')
const { getStocks } = require('../TVM/stocks/tvmStocks')
const utils = require('../utils')
const authorizedContacts = require('./authorizedContacts')

const client = new Client({ authStrategy: new LocalAuth() })
// const client = new Client({})

client.on('qr', (qr) => {
  // Generate and scan this code with your phone
  console.log('Scan QR:\n')
  qrcode.generate(qr, { small: true })
})

client.on('ready', async () => {
  fileLogger.log('WhatsApp client is ready!')
})

client.on('message', (msg) => {
  //check if message is not older than 5 minutes
  // Convert the time difference to minutes
  // const timeDifferenceMinutes = Math.floor(
  //   (new Date() - new Date(msg.timestamp * 1000)) / (1000 * 60)
  // )
  console.log(`${msg.from} (${msg._data.notifyName}) : ${msg.body}\n`)
  analyzeMessage(msg)
})

function analyzeMessage(msg) {
  msg.body = msg.body.trim()
  if (msg?.body?.toUpperCase() == 'STOCURI BANCNOTE') {
    fileLogger.log(`${msg.from} (${msg._data.notifyName}) : ${msg.body}`)
    replyCurrentStocks(msg)
  } else if (
    msg?.body?.toUpperCase().includes('COLECTA') ||
    msg?.body?.toUpperCase().includes('REZOLVAT')
  ) {
    politeAnswer(msg)
  }
}
async function replyCurrentStocks(msg) {
  while (true) {
    try {
      if (authorizedContacts.includes(msg.from)) {
        msg.reply(await getStocks('yes'))
      } else {
        fileLogger.warning(
          `${msg.from} is not authorized to check current stocks.`
        )
      }
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
  if (authorizedContacts.includes(msg.from)) {
    msg.reply(`Ok. Multumesc.`)
  }
}
module.exports = client
