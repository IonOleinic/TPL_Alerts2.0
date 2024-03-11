const { DateTime } = require('luxon')
const fileLogger = require('../logger/fileLogger')
const utils = require('../utils')
const whatsappClient = require('../whatsapp/whatsappClient')
const contacts = require('../whatsapp/contacts.json')

class Equipment {
  constructor(stationName, name, ip, ipReley) {
    this.stationName = stationName
    this.name = name
    this.ip = ip
    this.ipReley = ipReley
  }

  async check() {
    const pingResult = await utils.sendPingToIp(this.ip)
    if (!pingResult) {
      const inspectMin = 15
      fileLogger.log(
        `Equipment ${this.name} ${this.stationName} [${this.ip}] does not respond on ping. Inspect ${inspectMin} min...`
      )
      const inspectResult = await this.inspect(inspectMin)
      if (inspectResult) {
        fileLogger.log(
          `Equipment ${this.name} ${this.stationName} [${this.ip}] succesfully respond on ping after iterruption.`
        )
      } else {
        fileLogger.log(
          `Equipment ${this.name} ${this.stationName} [${this.ip}] did not respond on ping after ${inspectMin} min.`
        )
        const now = DateTime.now()
        if (now.hour >= 5 && now.hour <= 21) {
          const data = now.toFormat('dd.MM.yyyy HH:mm:ss')
          const message = `Lipsa conexiune ${this.name} ${this.stationName}\n${data}`
          fileLogger.log(`\n${message}`)
          whatsappClient.sendMessage(contacts.OleinicIon, message)
          const solveResult = await this.trySolve()
          if (solveResult) {
            whatsappClient.sendMessage(
              contacts.OleinicIon,
              `${this.name} ${this.stationName} ok!`
            )
          }
        }
      }
    }
  }
  async inspect(inspectMin) {
    const inspectSec = inspectMin * 60
    let remainingSec = inspectSec
    let pingResult = await utils.sendPingToIp(this.ip)
    while (remainingSec >= 0 && !pingResult) {
      pingResult = await utils.sendPingToIp(this.ip)
      remainingSec -= 12
      // await utils.sleep(10) // 10 seconds
    }
    return pingResult
  }

  async trySolve() {
    if (this.ipReley && this.ipReley != 'undefined') {
      fileLogger.log(
        `Try solve ${this.name} ${this.stationName} [${this.ip}] by restarting it...`
      )
      const pingReley = await utils.sendPingToIp(this.ipReley)
      if (!pingReley) {
        fileLogger.log(
          `Could not connect to the Reley [${this.ipReley}] of ${this.name} ${this.stationName}`
        )
      } else {
        const restartReleyResult = await utils.toggleReley(this.ipReley)
        if (restartReleyResult) {
          let inspectResult = await this.inspect(5)
          if (inspectResult) {
            fileLogger.log(
              `Connection with equipment ${this.name} ${this.stationName} [${this.ip}] was succesfully restored after restart.`
            )
            return true
          }
        }
      }
      fileLogger.log(
        `Connection with equipment ${this.name} ${this.stationName} [${this.ip}] could not be restored.`
      )
      return false
    }
  }
}

module.exports = Equipment
