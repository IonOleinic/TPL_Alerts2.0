const { getStocks } = require('../TVM/stocks/tvmStocks')

class ChatBot {
  constructor(whatsappClient) {
    this.whatsappClient = whatsappClient
  }
  async analyzeMessage(msg) {
    if (msg?.body?.toUpperCase() == 'STOCURI BANCNOTE') {
      try {
        const currentStocks = await getStocks('yes')
        msg.reply(currentStocks)
      } catch (error) {
        console.log(error)
      }
    }
  }
  sendMessage(to, message) {
    this.whatsappClient.sendMessage(to, message)
  }
}

module.exports = ChatBot
