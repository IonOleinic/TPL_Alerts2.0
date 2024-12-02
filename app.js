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
    await utils.sleep(30)
    // something wrong with initialization of whatsapp client. It ends before all initialization stuff, that means sending message before initialization, that causes crash. So, was added manualy 30 second delay to scan QR when it starts (the cache is not working!)
    checkTVMAlerts()
    checkTVMStocks(whatsappClient)
    checkMobileMessages()
    checkTVMEquipments()
  } catch (error) {
    fileLogger.error(error)
    fileLogger.error('TPL ALERTS APP CRASHED!')
    await utils.sleep(600) //10 min
  }
}

start()
