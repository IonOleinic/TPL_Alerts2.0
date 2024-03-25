const Station = require('./station')
const XLSX = require('xlsx')
const fileLogger = require('../logger/fileLogger')
const utils = require('../utils')
const { DateTime } = require('luxon')

function loadAndCheckFromExcelFile() {
  try {
    const xlsxFilePath = './lists/IP echipamente statii.xlsx' //this path is relative to file from where this function is called (app.js)
    const workbook = XLSX.readFile(xlsxFilePath)
    const sheetName = workbook.SheetNames[0] // Assuming the first sheet
    const worksheet = workbook.Sheets[sheetName]

    const stationsList = []
    // Assuming the data starts from row 2
    for (let i = 2; ; i++) {
      const numeStatie = worksheet[`B${i}`]?.v
      if (!numeStatie) break
      const ipPanou = worksheet[`C${i}`]?.v
      const ipTVM = worksheet[`D${i}`]?.v
      const ipCamera = worksheet[`E${i}`]?.v
      const ipSwitch = worksheet[`F${i}`]?.v
      const ipAP = worksheet[`G${i}`]?.v
      const ipReleu = worksheet[`H${i}`]?.v

      const station = new Station(
        numeStatie,
        ipPanou,
        ipTVM,
        ipCamera,
        ipSwitch,
        ipAP,
        ipReleu
      )
      stationsList.push(station)
    }
    for (const station of stationsList) {
      station.checkStation()
    }
  } catch (error) {
    fileLogger.error(error)
    fileLogger.error(`Cannot verify equipments from file ${xlsxFilePath}`)
  }
}

async function checkTVMEquipments() {
  try {
    while (true) {
      const now = DateTime.now()
      if (now.hour >= 6 && now.hour <= 20) {
        loadAndCheckFromExcelFile()
      }
      await utils.sleep(3600) //1h
    }
  } catch (error) {
    fileLogger.error(error)
    fileLogger.error('TPL CHECK EQUIPMENTS THREAD CRASHED!')
  }
}

module.exports = { checkTVMEquipments }
