const whatsappClient = require('./whatsapp/whatsappClient')
const { checkTVMAlerts } = require('./TVM/tvmAlerts')
const { checkTVMStocks } = require('./TVM/stocks/tvmStocks')
const { checkMobileMessages } = require('./mobile/tplMobileReclamations')
const { checkTVMEquipments } = require('./stations/stationChecker')
const fileLogger = require('./logger/fileLogger')
const networkManager = require('./network/networkManager')
const utils = require('./utils')

async function start() {
  try {
    fileLogger.initLogs()
    if (!(await networkManager.checkInternetConn())) {
      fileLogger.log('(WhatsApp initialize) Waiting for network connection...')
      while (!(await networkManager.checkInternetConn())) {
        await utils.sleep(60) // Wait for 60 seconds
      }
      fileLogger.log(
        '(WhatsApp initialize) Network connection restored successfully.'
      )
    }
    await whatsappClient.initialize()
    //checkTVMAlerts()
    //checkTVMStocks(whatsappClient)
    //checkMobileMessages()
    //checkTVMEquipments()
  } catch (error) {
    fileLogger.error(error)
    fileLogger.error('TPL ALERTS APP CRASHED!')
    await utils.sleep(600) //10 min
  }
}

start()
