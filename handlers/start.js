const Markup = require('telegraf/markup')
const uuidv4 = require('uuid/v4')
const { LiqPay } = require('../lib')


const liqpay = new LiqPay(process.env.LIQPAY_PUBLIC, process.env.LIQPAY_PRIVATE)

module.exports = async (ctx) => {
  const orderId = uuidv4()

  const liqpayLink = liqpay.formatingLink({
    action: 'paydonate',
    amount: '50',
    currency: 'RUB',
    description: ctx.i18n.t('callback.donate.description'),
    order_id: orderId,
    result_url: `https://t.me/${ctx.options.username}?start=${orderId}`,
    version: 3,
  })

  const payments = await ctx.db.Payment.aggregate([
    {
      $match: {
        currency: 'RUB',
      },
    },
    {
      $group: {
        _id: null,
        sum: { $sum: '$amount' },
      },
    },
  ])

  let sum = 0

  if (payments[0]) sum = payments[0].sum

  ctx.replyWithHTML(ctx.i18n.t('cmd.start.info', {
    sum: sum / 100,
    needSum: ctx.config.needSum / 100,
  }), {
    reply_markup: Markup.inlineKeyboard([
      [

        Markup.callbackButton('100 RUB', 'donate:100'),
        Markup.callbackButton('150 RUB', 'donate:150'),
        Markup.callbackButton('300 RUB', 'donate:300'),
      ],
      [
        Markup.callbackButton('500 RUB', 'donate:500'),
        Markup.callbackButton('1000 RUB', 'donate:1000'),
      ],
      [
        Markup.urlButton(ctx.i18n.t('cmd.btn.other'), liqpayLink),
      ],
    ]),
  })
}
