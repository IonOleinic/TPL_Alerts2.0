const axios = require('axios')

async function checkLocalNetworkConn() {
  try {
    await axios.get('http://192.168.95.93/Skayo_CFM/')
    return true
  } catch (error) {
    return false
  }
}

async function checkInternetConn() {
  try {
    await axios.get('https://www.google.com/')
    return true
  } catch (error) {
    return false
  }
}

module.exports = { checkLocalNetworkConn, checkInternetConn }
