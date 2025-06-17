const contacts = require('./contacts.json')

const authorizedToRespond = [
  contacts.EchipaRacheta,
  contacts.OleinicIon,
  contacts.costyfm,
  contacts.AnaSimona,
  contacts.Florin,
  contacts.Eugen,
  contacts.Ionut,
]

const authorizedToCollect = [
  contacts.costyfm,
  contacts.Eugen,
  contacts.Florin,
  contacts.OleinicIon,
]

module.exports = { authorizedToRespond, authorizedToCollect }
