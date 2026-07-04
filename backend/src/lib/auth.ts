import { User, Shop, Subscription } from '../models'
import { seedDefaultFlow } from '../lib/bot-engine'

const TRIAL_DAYS = 14

export async function provisionNewUser(email: string, name: string, phone: string | null) {
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

  const user = await User.create({
    email: email.toLowerCase(),
    name,
    phone,
  })

  await Subscription.create({
    userId: user._id,
    plan: 'starter',
    status: 'trialing',
    trialEndsAt,
  })

  const shop = await Shop.create({
    userId: user._id,
    name: `${name.split(' ')[0]}'s Shop`,
    type: 'kirana',
    whatsappNumber: phone || '+91 00000 00000',
    ownerName: name,
    description: 'Welcome! Set up your shop details in Settings.',
    hours: '9 AM - 9 PM',
    primaryColor: '#16a34a',
  })

  await seedDefaultFlow(String(shop._id))

  return { ...user.toObject(), shops: [shop] }
}
