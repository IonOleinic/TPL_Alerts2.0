const axios = require('axios')
const { promisify } = require('util')
const { exec } = require('child_process')
const execAsync = promisify(exec)

function sleep(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

async function sendPingToIp(ip) {
  let result = true
  if (ip && ip !== 'undefined' && ip[0].toUpperCase() !== 'X') {
    try {
      const { stdout } = await execAsync(`ping -n 4 ${ip}`)
      if (stdout.includes('Received = 0') || stdout.includes('unreachable')) {
        result = false
      }
    } catch (error) {
      fileLogger.error(error)
    }
  }
  return result
}
async function sendHTTPCommandToReley(ipReley, command) {
  try {
    const response = await axios.get(
      `http://${ipReley}/cm?cmnd=${encodeURIComponent(command)}`
    )
    return response.data
  } catch (error) {
    fileLogger.error(`Error sending command to ${ipReley}:`, error)
    return null
  }
}
async function toggleReley(ipReley) {
  const powerOffCommand = await sendHTTPCommandToReley(ipReley, 'Power Off')
  if (powerOffCommand?.POWER == 'OFF') {
    await sleep(5)
    const powerOnCommand = await sendHTTPCommandToReley(ipReley, 'Power on')
    if (powerOnCommand?.POWER == 'ON') {
      return true
    }
  }
  return false
}
module.exports = { sleep, sendPingToIp, toggleReley }
