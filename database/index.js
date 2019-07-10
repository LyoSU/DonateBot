const collections = require('./models')
const connection = require('./connection')


const db = {
  connection,
}

Object.keys(collections).forEach((collectionName) => {
  db[collectionName] = connection.model(collectionName, collections[collectionName])
})

db.User.getData = (tgUser) => new Promise(async (resolve, reject) => {
  let telegramId

  if (tgUser.telegram_id) telegramId = tgUser.telegram_id
  else telegramId = tgUser.id

  let user = await db.User.findOne({ telegram_id: telegramId })

  if (!user) {
    user = new db.User()
    user.telegram_id = tgUser.id
  }

  resolve(user)
})

db.User.updateData = (tgUser) => new Promise(async (resolve, reject) => {
  const user = await db.User.getData(tgUser)

  user.first_name = tgUser.first_name
  user.last_name = tgUser.last_name
  user.username = tgUser.username
  user.updatedAt = new Date()
  await user.save()

  resolve(user)
})

module.exports = {
  db,
}
