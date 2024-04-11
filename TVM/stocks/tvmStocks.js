const { Builder, By, until } = require('selenium-webdriver')
const { Options } = require('selenium-webdriver/firefox')
const os = require('os')
const fs = require('fs')
const { DateTime } = require('luxon')
const path = require('path')
const { spawn } = require('child_process')
const fileLogger = require('../../logger/fileLogger')
const utils = require('../../utils')
// const whatsappClient = require('../../whatsapp/whatsappClient')
const contacts = require('../../whatsapp/contacts.json')
const processManager = require('../../processes/processManager')
const networkManager = require('../../network/networkManager')

const downloadsPath = path.join(os.homedir(), 'Downloads')

async function downloadPdf() {
  try {
    const options = new Options()
    options.addArguments('--headless')

    const driver = await new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(options)
      .build()

    await driver.sleep(1000)

    await driver.get(
      'http://192.168.95.93/Skayo_CFM/Authentication.aspx?ReturnUrl=/Skayo_CFM/Default.aspx'
    )

    const usernameField = await driver.findElement(By.name('ctl03$txtUserName'))
    await usernameField.sendKeys('admin')
    await driver.sleep(1000)

    const passwordField = await driver.findElement(By.name('ctl03$txtPassword'))
    await passwordField.sendKeys('ticketing')
    await driver.sleep(1000)

    const loginForm = await driver.findElement(
      By.name('ctl03$tibAuthentication')
    )
    await loginForm.click()
    await driver.sleep(2000)

    await driver.get(
      'http://192.168.95.93/Skayo_CFM/Reporting/Local/ReportCreator.aspx?RID=428'
    )

    const generateBtn = await driver.wait(
      until.elementLocated(By.id('ctl00_cphContent_tibGenerate')),
      20000
    )
    await generateBtn.click()

    await driver.sleep(15000)

    await driver.switchTo().frame('Situatie stocuri curenta')

    const btnExportPdf = await driver.wait(
      until.elementLocated(By.id('btnExportPdf')),
      120000
    )
    await btnExportPdf.click()

    await driver.sleep(30000) // sow much time because of low network speed. There are some issues maybe. TEMPORAR VALUE
    // const pdfFileName = await waitForFile('Situatie stocuri', 120000) // Wait up to 120 seconds for PDF file to be downloaded
    // if (!pdfFileName) {
    //   throw new Error('PDF file not found within timeout.')
    // }

    await driver.quit()
  } catch (error) {
    processManager.pkill('firefox')
    processManager.pkill('geckodriver')
    throw error
  }
}

async function parsePdf(pdfName, all) {
  return new Promise((resolve, reject) => {
    const pdfPath = path.join(downloadsPath, pdfName)
    const pythonPdfParserPath = './TVM/stocks/pdf_parser.py'
    const pythonProcess = spawn('python', [pythonPdfParserPath, pdfPath, all])
    let parsingResult = ''
    pythonProcess.stdout.on('data', (data) => {
      parsingResult += data.toString()
    })
    pythonProcess.stderr.on('data', (data) => {
      deletePdf(pdfName)
      reject(new Error(data.toString()))
    })
    pythonProcess.on('close', (code) => {
      if (code != 0) fileLogger.log(`Child process exited with code ${code}`)
      resolve(parsingResult.trim())
    })
  })
}

function findPdf(partialName) {
  const fullList = fs.readdirSync(downloadsPath)
  let latestDate = 0
  let foundFile = null
  const currentTime = Date.now() // Current time in milliseconds
  for (const file of fullList) {
    if (partialName && file.includes(partialName)) {
      const filePath = path.join(downloadsPath, file)
      const { name, ext } = path.parse(filePath)
      if (ext === '.pdf') {
        const fileCreationTime = fs.statSync(filePath).ctimeMs
        // Check if file was created within the last 10 minutes
        if (currentTime - fileCreationTime <= 10 * 60 * 1000) {
          if (fileCreationTime > latestDate) {
            latestDate = fileCreationTime
            foundFile = file
          }
        }
      }
    }
  }
  return foundFile
}

function deletePdf(pdfName) {
  try {
    if (!pdfName) {
      fileLogger.warning(
        `[DELETE] File '${pdfName}' does not exist or was removed.`
      )
      return
    }
    const pdfPath = path.join(downloadsPath, pdfName)
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath)
      fileLogger.log(`FILE '${pdfName}' was deleted`)
    } else {
      fileLogger.warning(`[DELETE] The file '${pdfName}' does not exist`)
    }
  } catch (error) {
    throw error
  }
}

function deletePdfByPartialName(partialName) {
  try {
    const files = fs.readdirSync(downloadsPath)
    let deletedCount = 0
    for (const file of files) {
      if (file.includes(partialName) && file.endsWith('.pdf')) {
        const pdfPath = path.join(downloadsPath, file)
        fs.unlinkSync(pdfPath)
        fileLogger.log(`File '${file}' containing '${partialName}' was deleted`)
        deletedCount += 1
      }
    }
    if (deletedCount === 0) {
      fileLogger.warning(`No PDF files containing '${partialName}' were found`)
    }
  } catch (error) {
    throw error
  }
}

// Function to wait for file to be found or timeout
async function waitForFile(partialName, timeout) {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    const file = findPdf(partialName)
    if (file) {
      return file // File found, return its name
    }
    await new Promise((resolve) => setTimeout(resolve, 5000)) // Check every second
  }
  return null // Timeout reached, file not found
}

async function getStocks(all) {
  try {
    // Download PDF
    await downloadPdf()
    // Find PDF
    const pdfName = findPdf('Situatie stocuri')
    // Parse PDF
    const stocksText = await parsePdf(pdfName, all)
    // Delete PDF
    deletePdf(pdfName)
    return stocksText
  } catch (error) {
    throw error
  }
}

async function processPdfStocks(whatsappClient) {
  try {
    const stocksText = await getStocks()
    if (stocksText.includes('Nu sunt')) {
      fileLogger.log(`${stocksText}`)
    } else {
      fileLogger.log(`\n${stocksText}\n`)
      whatsappClient.sendMessage(contacts.EchipaRacheta, stocksText)
    }
  } catch (error) {
    throw error
  }
}

async function checkTVMStocks(whatsappClient) {
  try {
    let waitForRetry = 5 // 5 seconds
    let checkingStocksErrorCount = 0
    while (true) {
      try {
        if (!(await networkManager.checkLocalNetworkConn())) {
          fileLogger.log(
            `(Checking stocks) waiting for local network connection...`
          )
          while (!(await networkManager.checkLocalNetworkConn())) {
            await utils.sleep(60)
          }
          fileLogger.log(
            `(Checking stocks) local network connection was restored.`
          )
        }
        const now = DateTime.now()
        if (now.hour >= 6 && now.hour <= 20) {
          await processPdfStocks(whatsappClient)
        }
        checkingStocksErrorCount = 0
        waitForRetry = 5
        await utils.sleep(3600) //1h interval
      } catch (error) {
        checkingStocksErrorCount += 1
        if (waitForRetry < 120) {
          waitForRetry = checkingStocksErrorCount * 10
        }
        fileLogger.error(error)
        fileLogger.error(
          `Error during checking regular stocks. Retry after ${waitForRetry} seconds...`
        )
        await utils.sleep(waitForRetry)
      }
    }
  } catch (error) {
    fileLogger.error(error)
    deletePdfByPartialName('Situatie stocuri') //delete unnecessary pdf files
    fileLogger.error('TVM STOCKS THREAD CRASHED!')
  }
}
module.exports = { checkTVMStocks, getStocks }
