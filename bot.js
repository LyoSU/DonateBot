const path = require('path')
const Telegraf = require('telegraf')
const I18n = require('telegraf-i18n')
const {
  db,
} = require('./database')
const {
  handleStart,
  handleDonate,
  handleDonateLiqpay,
} = require('./handlers')


// init bot
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use((ctx, next) => {
  ctx.ms = new Date()
  next()
})

// bot config
bot.context.config = require('./config.json')

// I18n settings
const { match } = I18n
const i18n = new I18n({
  directory: path.resolve(__dirname, 'locales'),
  defaultLanguage: 'ru',
})

// I18n middleware
bot.use(i18n.middleware())

// get bot username
bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username
})

// db connect
bot.context.db = db

// use session
bot.use(Telegraf.session())

// response time logger
bot.use(async (ctx, next) => {
  if (ctx.from && ctx.chat) {
    db.User.updateData(ctx.from).then((user) => {
      ctx.session.user = user
    })
  }
  await next(ctx)
  const ms = new Date() - ctx.ms

  console.log('Response time %sms', ms)
})

// donate
bot.action(/(donate):(.*)/, handleDonate)
bot.on('pre_checkout_query', ({ answerPreCheckoutQuery }) => answerPreCheckoutQuery(true))
bot.on('successful_payment', handleDonate)
bot.hears(/liqpay_(.*)/, handleDonateLiqpay)

// any message
bot.on('message', handleStart)

// error handling
bot.catch((error) => {
  console.log('Oops', error)
})

// start bot
db.connection.once('open', async () => {
  console.log('Connected to MongoDB')
  bot.launch().then(() => {
    console.log('bot start')
  })
})
