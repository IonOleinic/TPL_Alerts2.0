const fs = require('fs')

function initLogs() {
  try {
    fs.writeFileSync('logs.txt', 'START\n')
  } catch (error) {
    console.error(error)
  }
}

function log(message) {
  try {
    console.log(message)
    const now = new Date()
    const timestamp = now.toLocaleString()
    fs.appendFileSync('logs.txt', `[${timestamp}] : ${message}\n`)
  } catch (error) {
    console.error(error)
  }
}

function error(message) {
  try {
    console.error('\x1b[31m%s\x1b[0m', message) // Print error message in red to the console
    const now = new Date()
    const timestamp = now.toLocaleString()
    const redMessage = `\x1b[31m${message}\x1b[0m` // Wrap the message in red color ANSI escape codes
    const logEntry = `[${timestamp}] : ${redMessage}\n` // Create log entry with timestamp
    const plainLogEntry = logEntry.replace(/\x1b\[\d+m/g, '') // Remove ANSI escape codes
    fs.appendFileSync('logs.txt', plainLogEntry) // Append log entry to the log file
  } catch (error) {
    console.error(error)
  }
}

function warning(message) {
  try {
    console.warn('\x1b[33m%s\x1b[0m', message) // Print warning message in yellow to the console
    const now = new Date()
    const timestamp = now.toLocaleString()
    const yellowMessage = `\x1b[33m${message}\x1b[0m` // Wrap the message in yellow color ANSI escape codes
    const logEntry = `[${timestamp}] : ${yellowMessage}\n` // Create log entry with timestamp
    const plainLogEntry = logEntry.replace(/\x1b\[\d+m/g, '') // Remove ANSI escape codes
    fs.appendFileSync('logs.txt', plainLogEntry) // Append log entry to the log file
  } catch (error) {
    console.error(error)
  }
}

module.exports = { initLogs, log, error, warning }
