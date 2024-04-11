const contacts = require('./contacts.json')

const authorizedToRespond = [
  contacts.EchipaRacheta,
  contacts.OleinicIon,
  contacts.costyfm,
  contacts.AnaSimona,
  contacts.Claudiu,
  contacts.Eugen,
  contacts.Ionut,
]

const authorizedToCollect = [
  contacts.costyfm,
  contacts.Eugen,
  contacts.Claudiu,
  contacts.OleinicIon,
]

module.exports = { authorizedToRespond, authorizedToCollect }
