const axios = require('axios')
const { DateTime } = require('luxon') // for date manipulation
const fileLogger = require('../logger/fileLogger')
const networkManager = require('../network/networkManager')
const utils = require('../utils')
const whatsappClient = require('../whatsapp/whatsappClient')
const contacts = require('../whatsapp/contacts.json')

const tplMobileSession = axios.create()

async function loginTplMobile() {
  try {
    if (!(await networkManager.checkInternetConn())) {
      fileLogger.log('(Login TPL Mobile) Waiting for network connection...')
      while (!(await networkManager.checkInternetConn())) {
        await utils.sleep(60) // Wait for 60 seconds
      }
      fileLogger.log(
        '(Login TPL Mobile) Network connection restored successfully.'
      )
    }
    const payload = {
      username: 'ion.oleinic21@gmail.com',
      password: 'Mazzeratti123',
    }
    const response = await tplMobileSession.post(
      'https://mobile.tplsv.ro:9090/api/authenticate',
      payload
    )
    const jwtToken = response.data.id_token
    return jwtToken
  } catch (error) {
    fileLogger.error('(TPL Mobile) Error in Login function')
    fileLogger.error(error)
    return null
  }
}

async function getMessagesTplMobile(jwtToken) {
  try {
    const headers = {
      Authorization: `Bearer ${jwtToken}`,
    }
    const response = await tplMobileSession.get(
      'https://mobile.tplsv.ro:9090/api/user-message-threads?page=0&size=20&type=0&email=&subject=&sort=createdDate,desc&sort=id',
      { headers }
    )
    const messages = response.data
    return messages
  } catch (error) {
    throw error
  }
}

async function checkMobileMessages() {
  try {
    let jwtToken = await loginTplMobile()
    const refreshMobileMsgs = 1200 // in seconds
    const messagesAlreadySent = []
    while (true) {
      try {
        const now = DateTime.now()
        if (now.hour >= 6 && now.hour <= 20) {
          const messages = await getMessagesTplMobile(jwtToken)
          if (messages) {
            for (const message of messages) {
              if (
                !message.isSeen &&
                !messagesAlreadySent.includes(message.id)
              ) {
                const userEmail = message.userEmail
                const datetimeObjectUtc = DateTime.fromISO(
                  message.createdDate
                ).toUTC()
                const datetimeObjectAdjusted =
                  datetimeObjectUtc.setZone('Europe/Bucharest')
                const createdDate =
                  datetimeObjectAdjusted.toFormat('dd.MM.yyyy HH:mm')
                const subject = message.subject
                const messageText = message.userMessages[0].text.replace(
                  /\n/g,
                  ' '
                )
                const messageToSend = `TPL Mobile Message\nEmail: ${userEmail}\nData: ${createdDate}\nSubiect: ${subject}\nMesaj: ${messageText}`
                fileLogger.log(`\n${messageToSend}`)
                whatsappClient.sendMessage(contacts.OleinicIon, messageToSend)
                whatsappClient.sendMessage(contacts.AnaSimona, messageToSend)
                messagesAlreadySent.push(message.id)
              }
            }
          }
        }
        await utils.sleep(refreshMobileMsgs)
      } catch (error) {
        fileLogger.error('(TPL Mobile) Error in Check Mobile Messages function')
        if (error.response && error.response.status === 401) {
          fileLogger.error(
            '(TPL Mobile) Error logging in to TPL Mobile. Retrying...'
          )
          jwtToken = await loginTplMobile()
        } else {
          fileLogger.error(error)
        }
      }
    }
  } catch (error) {
    fileLogger.error(error)
    fileLogger.error('TPL MOBILE THREAD CRASHED!')
  }
}

module.exports = { checkMobileMessages }
