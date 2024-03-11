const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const fileLogger = require('../logger/fileLogger')
const { getStocks } = require('../TVM/stocks/tvmStocks')
const utils = require('../utils')
const processManager = require('../processes/processManager')
const authorizedContacts = require('./authorizedContacts')

const client = new Client({ authStrategy: new LocalAuth() })
// const client = new Client()

client.on('qr', (qr) => {
  // Generate and scan this code with your phone
  console.log('Scan QR:\n')
  qrcode.generate(qr, { small: true })
})

client.on('ready', async () => {
  fileLogger.log('WhatsApp client is ready!')
})

client.on('message', (msg) => {
  console.log(msg.from)
  console.log(msg._data.notifyName + ' : ' + msg.body + '\n')
  analyzeMessage(msg)
})

function analyzeMessage(msg) {
  if (msg?.body?.toUpperCase() == 'STOCURI BANCNOTE') {
    replyCurrentStocks(msg)
  } else if (
    msg?.body?.toUpperCase().includes('COLECTAT') ||
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
      fileLogger.error(
        `Error during replying curent stocks. Retry after 5 seconds...`
      )
      await processManager.pkill('firefox')
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
