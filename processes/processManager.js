const fileLogger = require('../logger/fileLogger')

async function checkIfProcessRunning(processName) {
  const psList = await import('ps-list')
  const processes = await psList.default()
  return processes.some((proc) =>
    proc.name.toLowerCase().includes(processName.toLowerCase())
  )
}

async function pkill(processName) {
  try {
    const isRunning = await checkIfProcessRunning(processName)
    if (isRunning) {
      const { exec } = await import('child_process')
      exec(`taskkill /f /im ${processName}`)
      fileLogger.log(`${processName} process was killed.\n`)
      return true
    }
    return false
  } catch (error) {
    fileLogger.error(error)
    return false
  }
}

module.exports = { checkIfProcessRunning, pkill }
