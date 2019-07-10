const { LiqPay } = require('../lib')


const liqpay = new LiqPay(process.env.LIQPAY_PUBLIC, process.env.LIQPAY_PRIVATE)

module.exports = async (ctx, next) => {
  const findPayment = await ctx.db.Payment.findOne({ orderId: ctx.match[1] })

  if (!findPayment) {
    const paymentInfo = await liqpay.api('request', {
      action: 'status',
      version: '3',
      order_id: ctx.match[1],
    })

    if (paymentInfo.status === 'success') {
      ctx.replyWithHTML(ctx.i18n.t('callback.donate.successful'))


      const payment = new ctx.db.Payment()

      Object.assign(payment, {
        orderId: paymentInfo.order_id,
        user: ctx.session.user,
        amount: paymentInfo.amount * 100,
        currency: paymentInfo.currency,
        type: 'liqpay',
        info: paymentInfo,
      })

      payment.save()
    }
    else next()
  }
  else next()
}
