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
          await whatsappClient.sendMessage(contacts.EchipaRacheta, message)
          await this.trySolve()
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
    if (
      this.ipReley &&
      this.ipReley != 'undefined' &&
      this.ipReley[0].toUpperCase() !== 'X'
    ) {
      const pingReley = await utils.sendPingToIp(this.ipReley)
      if (!pingReley) {
        fileLogger.log(
          `Could not connect to the Reley [${this.ipReley}] of ${this.name} ${this.stationName}`
        )
        whatsappClient.sendMessage(
          contacts.EchipaRacheta,
          `Nu pot da restart la ${this.name} ${this.stationName}. Este nevoie de o interventie manuala.`
        )
        return false
      } else {
        fileLogger.log(
          `Try solve ${this.name} ${this.stationName} [${this.ip}] by restarting it...`
        )
        whatsappClient.sendMessage(
          contacts.EchipaRacheta,
          `Incerc un restart pentru ${this.name} ${this.stationName}...`
        )
        const restartReleyResult = await utils.toggleReley(this.ipReley)
        if (restartReleyResult) {
          let inspectResult = await this.inspect(5)
          if (inspectResult) {
            fileLogger.log(
              `Connection with equipment ${this.name} ${this.stationName} [${this.ip}] was succesfully restored after restart.`
            )
            whatsappClient.sendMessage(
              contacts.EchipaRacheta,
              `${this.name} ${this.stationName} ok dupa restart.`
            )
            return true
          } else {
            fileLogger.log(
              `Connection with equipment ${this.name} ${this.stationName} [${this.ip}] could not be restored.`
            )
            whatsappClient.sendMessage(
              contacts.EchipaRacheta,
              `Nu sa putut restabili conexiunea cu ${this.name} ${this.stationName}. Este nevoie de o interventie manuala.`
            )
            return false
          }
        }
      }
      return false
    }
  }
}

module.exports = Equipment
