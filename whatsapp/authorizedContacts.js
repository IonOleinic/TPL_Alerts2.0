const contacts = require('./contacts.json')

const authorizedToRespond = [
  contacts.EchipaRacheta,
  contacts.OleinicIon,
  contacts.costyfm,
  contacts.AnaSimona,
  contacts.Bogdan,
  contacts.Eugen,
  contacts.Ionut,
]

const authorizedToCollect = [
  contacts.costyfm,
  contacts.Eugen,
  contacts.Bogdan,
  contacts.OleinicIon,
]

module.exports = { authorizedToRespond, authorizedToCollect }
