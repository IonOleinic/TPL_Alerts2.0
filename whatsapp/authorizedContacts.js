const contacts = require('./contacts.json')

const authorizedToRespond = [
  contacts.EchipaRacheta,
  contacts.OleinicIon,
  contacts.costyfm,
  contacts.AnaSimona,
  contacts.Bogdan,
  contacts.Eugen,
  contacts.Ionut,
  contacts.Cristian,
]

const authorizedToCollect = [
  contacts.costyfm,
  contacts.Eugen,
  contacts.Cristian,
  contacts.OleinicIon,
]

module.exports = { authorizedToRespond, authorizedToCollect }
