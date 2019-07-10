const Markup = require('telegraf/markup')
const uuidv4 = require('uuid/v4')
const { LiqPay } = require('../lib')


const liqpay = new LiqPay(process.env.LIQPAY_PUBLIC, process.env.LIQPAY_PRIVATE)

module.exports = async (ctx) => {
  if (ctx.updateType === 'callback_query') {
    ctx.answerCbQuery()

    const orderId = uuidv4()

    let amount = ctx.match[2] || 0

    if (amount < 100) amount = 100
    amount *= 100

    const currency = 'RUB'

    const invoice = {
      provider_token: process.env.PROVIDER_TOKEN,
      start_parameter: 'donate',
      title: ctx.i18n.t('callback.donate.title', {
        botUsername: ctx.options.username,
      }),
      description: ctx.i18n.t('callback.donate.description'),
      currency,
      prices: [
        { label: `Donate @${ctx.options.username}`, amount },
      ],
      payload: { orderId },
    }

    const liqpayLink = liqpay.formatingLink({
      action: 'pay',
      amount: amount / 100,
      currency,
      description: ctx.i18n.t('callback.donate.description'),
      order_id: orderId,
      result_url: `https://t.me/${ctx.options.username}?start=liqpay_${orderId}`,
      version: 3,
    })

    ctx.replyWithInvoice(invoice, Markup.inlineKeyboard([
      [Markup.payButton(ctx.i18n.t('callback.donate.btn.buy'))],
      [Markup.urlButton(ctx.i18n.t('callback.donate.btn.liqpay'), liqpayLink)],
    ]).extra())
  }
  else if (ctx.updateSubTypes[0] === 'successful_payment') {
    ctx.replyWithHTML(ctx.i18n.t('callback.donate.successful'))

    if (!ctx.session.user) ctx.session.user = await ctx.db.User.getData(ctx.from)

    ctx.session.user.premium = true
    ctx.session.user.save()

    const paymentInfo = ctx.message.successful_payment
    const payment = new ctx.db.Payment()

    const { orderId } = JSON.parse(paymentInfo.invoice_payload)

    Object.assign(payment, {
      orderId,
      user: ctx.session.user,
      amount: paymentInfo.total_amount,
      currency: paymentInfo.currency,
      type: 'telegram',
      info: paymentInfo,
    })

    payment.save()
  }
}
