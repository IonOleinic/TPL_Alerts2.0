const cheerio = require('cheerio')
const querystring = require('querystring')
const request = require('request')
const fileLogger = require('../logger/fileLogger')
const utils = require('../utils')
const networkManager = require('../network/networkManager')
const { DateTime } = require('luxon')
const whatsappClient = require('../whatsapp/whatsappClient')
const contacts = require('../whatsapp/contacts.json')

const LOGIN_SKAYO_URL =
  'http://192.168.95.93/Skayo_CFM/Authentication.aspx?ReturnUrl=/Skayo_CFM/Default.aspx'
const ALERTS_SKAYO_URL =
  'http://192.168.95.93/Skayo_CFM/AVM/Manage/AlertListView.aspx'
let cookieJar = request.jar()
let alertListAlreadySent = []
const refreshAlertDefault = 25
let refreshAlert = refreshAlertDefault
const waitTime = 30 * 60 // Default wait time

function getRequest(url, jar) {
  const requestOptions = {
    url,
    method: 'GET',
    jar, // Attach the cookie jar to the request
  }

  return new Promise((resolve, reject) => {
    request(requestOptions, (error, response) => {
      if (error) {
        reject(error)
      } else {
        resolve(response)
      }
    })
  })
}

function postRequest(url, formData) {
  const jar = request.jar() // Create a cookie jar

  const requestOptions = {
    url,
    method: 'POST',
    form: formData,
    jar, // Attach the cookie jar to the request
    followAllRedirects: true, // Follow all redirects
  }

  return new Promise((resolve, reject) => {
    request(requestOptions, (error, response) => {
      if (error) {
        reject(error)
      } else {
        resolve(response)
      }
    })
  })
}

function loginSkayoRequest(url, formData) {
  const jar = request.jar() // Create a cookie jar

  const requestOptions = {
    url,
    method: 'POST',
    form: formData,
    jar, // Attach the cookie jar to the request
    followAllRedirects: true, // Follow all redirects
  }

  return new Promise((resolve, reject) => {
    request(requestOptions, (error, response) => {
      if (error) {
        reject(error)
      } else {
        resolve(jar)
      }
    })
  })
}

async function loginSkayo() {
  try {
    if (!(await networkManager.checkLocalNetworkConn())) {
      fileLogger.log(`(Login Skayo) waiting for local network connection...`)
      while (!(await networkManager.checkLocalNetworkConn())) {
        await utils.sleep(60)
      }
      fileLogger.log(`(Login Skayo) local network connection was restored.`)
    }
    const AuthPageResponse = await getRequest(LOGIN_SKAYO_URL)
    const $ = cheerio.load(AuthPageResponse.body)

    const ctl03_ctl00_TSM = $('input#ctl03_ctl00_TSM').attr('value')
    const __VIEWSTATE = $('input#__VIEWSTATE').attr('value')
    const __VIEWSTATEGENERATOR = $('input#__VIEWSTATEGENERATOR').attr('value')
    const __VIEWSTATEENCRYPTED = $('input#__VIEWSTATEENCRYPTED').attr('value')
    const __EVENTVALIDATION = $('input#__EVENTVALIDATION').attr('value')
    const ctl03_cboCompany_ClientState = $('input#__EVENTVALIDATION').attr(
      'value'
    )
    const txt_username = 'admin'
    const txt_password = 'ticketing'
    const tib_authentication = 'Autentificare'

    let payload = {
      ctl03_ctl00_TSM: ctl03_ctl00_TSM,
      __VIEWSTATE: __VIEWSTATE,
      __VIEWSTATEGENERATOR: __VIEWSTATEGENERATOR,
      __VIEWSTATEENCRYPTED: __VIEWSTATEENCRYPTED,
      __EVENTVALIDATION: __EVENTVALIDATION,
      ctl03_cboCompany_ClientState: ctl03_cboCompany_ClientState,
      ctl03$txtUserName: txt_username,
      ctl03$txtPassword: txt_password,
      ctl03$tibAuthentication: tib_authentication,
    }
    cookieJar = await loginSkayoRequest(
      LOGIN_SKAYO_URL,
      querystring.stringify(payload)
    )
    return true
  } catch (error) {
    fileLogger.error(error)
    return false
  }
}

function checkIfAlertIn(alertId, alertList) {
  return alertList.some((alert) => alert.id === alertId)
}

function deleteExpiredAlerts(alertList) {
  return alertList.filter((alert) => {
    if (alert.ttl > 0) {
      return alert
    } else {
      fileLogger.log(
        `The time for alert ${alertList[i].name} ${alertList[i].date} expired.`
      )
    }
  })
}

async function parseAlertsFromHtml(htmlData) {
  const defaultAlertTtl = waitTime / refreshAlert
  const $ = cheerio.load(htmlData)
  const tableId = 'ctl00_cphContent_gridAlerts_ctl00'
  const tableTag = $(`table#${tableId}`)

  if (tableTag.length) {
    let alertFound = false
    for (let i = 0; i < 10; i++) {
      const rowTag = $(`tr#${tableId}__${i}`)
      const tdList = rowTag.find('td.col-lg-1')
      const alertType = rowTag.find('td.col-lg-3').text().trim()
      let errorType = rowTag.find('td.col-lg-7').text().trim()
      const tvmName = tdList.eq(0).text().trim()
      const alertDate = tdList.eq(1).text().trim()
      const alertId = tvmName + alertDate.slice(0, 10)
      if (alertType.includes('Defect hardware')) {
        alertFound = true
        if (errorType.toUpperCase().includes('BNR')) {
          errorType = 'Eroare BNR'
        } else if (errorType.toUpperCase().includes('POS')) {
          errorType = 'Eroare POS'
        } else if (errorType.toUpperCase().includes('CARDDISPENSER')) {
          errorType = 'Eroare imprimanta carduri'
        } else if (errorType.toUpperCase().includes('RECEIPTPRINTER')) {
          errorType = 'Eroare imprimanta chitante'
        } else if (errorType.toUpperCase().includes('QR')) {
          errorType = 'Eroare imprimanta bilete'
        } else {
          errorType = 'Eroare generala'
        }
        console.log(
          `\nHardware defect detected!!!\n${tvmName}\n${alertDate}\n${alertType}\n${errorType}\n`
        )
        if (!checkIfAlertIn(alertId, alertListAlreadySent)) {
          const now = DateTime.now()
          const alertTTL =
            now.hour < 5 && now.hour > 21
              ? (60 * 60) / refreshAlert
              : defaultAlertTtl

          const newAlert = {
            id: alertId,
            name: tvmName,
            date: alertDate,
            type: alertType,
            ttl: alertTTL,
          }
          const whatsappMessage = `TPL Suceava Skayo TVM Alert\n${tvmName}\n${alertDate}\n${alertType}\n${errorType}`
          fileLogger.log(`\n${whatsappMessage}\n`)
          whatsappClient.sendMessage(contacts.OleinicIon, whatsappMessage)
          alertListAlreadySent.push(newAlert)
        } else {
          console.log('Message already sent on WhatsApp')
        }
      }
    }
    alertListAlreadySent.forEach((alert) => {
      alert.ttl -= 1
    })
    alertListAlreadySent = deleteExpiredAlerts(alertListAlreadySent)
    if (!alertFound) {
      console.log('Nothing found.')
    }
    console.log(`Refresh after ${refreshAlert} sec...`)
    console.log('-------------------------------------')
  } else {
    throw new Error('Table tag error')
  }
}

async function checkTVMAlerts() {
  try {
    await loginSkayo()
    while (true) {
      try {
        const now = DateTime.now()
        refreshAlert =
          now.hour >= 6 && now.hour <= 18 ? 10 : refreshAlertDefault
        const response = await getRequest(ALERTS_SKAYO_URL, cookieJar)
        await parseAlertsFromHtml(response.body)
        await utils.sleep(refreshAlert)
      } catch (error) {
        fileLogger.error('Login Skayo error. Try again...')
        await utils.sleep(10)
        await loginSkayo()
      }
    }
  } catch (error) {
    fileLogger.error(error)
    fileLogger.error('TVM ALERTS THREAD CRASHED!')
  }
}

module.exports = { checkTVMAlerts }
