const Equipment = require('./equipment')
const networkManager = require('../network/networkManager')

class Station {
  constructor(
    stationName,
    ipPanou,
    ipTVM,
    ipCamera,
    ipSwitch,
    ipAP,
    ipReleyPanou
  ) {
    this.stationName = stationName
    this.panou = new Equipment(stationName, 'Panou', ipPanou, ipReleyPanou)
    this.tvm = new Equipment(stationName, 'TVM', ipTVM)
    this.camera = new Equipment(stationName, 'Camera', ipCamera)
    this.switch = new Equipment(stationName, 'Switch', ipSwitch)
    this.ap = new Equipment(stationName, 'AP', ipAP)
  }

  async checkStation() {
    if (networkManager.checkLocalNetworkConn()) {
      this.panou.check()
      this.tvm.check()
      this.camera.check()
      this.switch.check()
    }
    // else {
    //   fileLogger('(Ip Checker) lipsa conexiune retea...')
    // }
  }

  toString() {
    return `${this.stationName} ${this.panou} ${this.tvm} ${this.camera} ${this.switch} ${this.ap}`
  }
}

module.exports = Station
