import mongoose, { Schema, type Document, type Types } from 'mongoose'

function jsonTransform(_doc: unknown, ret: Record<string, unknown>) {
  if (ret._id) {
    ret.id = String(ret._id)
    delete ret._id
  }
  delete ret.__v
  return ret
}

const opts = { timestamps: true, toJSON: { virtuals: true, transform: jsonTransform } }

export interface IUser extends Document {
  name?: string
  email: string
  passwordHash?: string
  phone?: string
  onboardingStep: number
  onboardingDone: boolean
  tutorialDismissed: boolean
}

const UserSchema = new Schema<IUser>(
  {
    name: String,
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: String,
    phone: String,
    onboardingStep: { type: Number, default: 0 },
    onboardingDone: { type: Boolean, default: false },
    tutorialDismissed: { type: Boolean, default: false },
  },
  opts
)

export interface ISubscription extends Document {
  userId: Types.ObjectId
  plan: string
  status: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePriceId?: string
  trialEndsAt?: Date
  currentPeriodEnd?: Date
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    plan: { type: String, default: 'trial' },
    status: { type: String, default: 'trialing' },
    stripeCustomerId: { type: String, unique: true, sparse: true },
    stripeSubscriptionId: { type: String, unique: true, sparse: true },
    stripePriceId: String,
    trialEndsAt: Date,
    currentPeriodEnd: Date,
  },
  opts
)

export interface IShop extends Document {
  userId?: Types.ObjectId
  isDemo: boolean
  name: string
  type: string
  whatsappNumber: string
  ownerName: string
  description?: string
  address?: string
  hours?: string
  currency: string
  language: string
  isOpen: boolean
  primaryColor: string
  whatsappPhoneNumberId?: string
  whatsappBusinessId?: string
  whatsappAccessToken?: string
  whatsappVerifyToken?: string
  whatsappConnected: boolean
}

const ShopSchema = new Schema<IShop>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    isDemo: { type: Boolean, default: false, index: true },
    name: { type: String, required: true },
    type: { type: String, default: 'kirana' },
    whatsappNumber: { type: String, required: true },
    ownerName: { type: String, required: true },
    description: String,
    address: String,
    hours: String,
    currency: { type: String, default: '₹' },
    language: { type: String, default: 'en' },
    isOpen: { type: Boolean, default: true },
    primaryColor: { type: String, default: '#16a34a' },
    whatsappPhoneNumberId: String,
    whatsappBusinessId: String,
    whatsappAccessToken: String,
    whatsappVerifyToken: String,
    whatsappConnected: { type: Boolean, default: false },
  },
  opts
)

export interface IWhatsappSession extends Document {
  shopId: Types.ObjectId
  status: string
  linkedPhone?: string
  qrDataUrl?: string
  sessionBlob?: string
  lastSeenAt?: Date
  errorMessage?: string
}

const WhatsappSessionSchema = new Schema<IWhatsappSession>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', unique: true, required: true },
    status: { type: String, default: 'disconnected' },
    linkedPhone: String,
    qrDataUrl: String,
    sessionBlob: String,
    lastSeenAt: Date,
    errorMessage: String,
  },
  opts
)

export interface ICategory extends Document {
  shopId: Types.ObjectId
  name: string
  emoji?: string
}

const CategorySchema = new Schema<ICategory>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true },
    emoji: String,
  },
  opts
)

export interface IProduct extends Document {
  shopId: Types.ObjectId
  name: string
  description?: string
  price: number
  unit?: string
  categoryId?: Types.ObjectId
  isAvailable: boolean
  imageUrl?: string
  tags?: string
}

const ProductSchema = new Schema<IProduct>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    unit: String,
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    isAvailable: { type: Boolean, default: true },
    imageUrl: String,
    tags: String,
  },
  opts
)

ProductSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
})

export interface IFlowNode extends Document {
  shopId: Types.ObjectId
  type: string
  title: string
  data: string
  positionX: number
  positionY: number
  isStart: boolean
}

const FlowNodeSchema = new Schema<IFlowNode>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    data: { type: String, default: '{}' },
    positionX: { type: Number, default: 0 },
    positionY: { type: Number, default: 0 },
    isStart: { type: Boolean, default: false },
  },
  opts
)

export interface IFlowEdge extends Document {
  shopId: Types.ObjectId
  sourceNodeId: string
  targetNodeId: string
  label?: string
  condition?: string
}

const FlowEdgeSchema = new Schema<IFlowEdge>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    sourceNodeId: { type: String, required: true },
    targetNodeId: { type: String, required: true },
    label: String,
    condition: String,
  },
  opts
)

export interface ICustomer extends Document {
  shopId: Types.ObjectId
  name: string
  phone: string
  email?: string
  notes?: string
  tags?: string
}

const CustomerSchema = new Schema<ICustomer>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    email: String,
    notes: String,
    tags: String,
  },
  opts
)

export interface IMessage extends Document {
  conversationId: Types.ObjectId
  sender: string
  text: string
  type: string
  metadata?: string
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: String, required: true },
    text: { type: String, required: true },
    type: { type: String, default: 'text' },
    metadata: String,
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: { transform: jsonTransform } }
)

export interface IConversation extends Document {
  shopId: Types.ObjectId
  customerId: Types.ObjectId
  status: string
  currentNodeId?: string
  context?: string
  channel: string
}

const ConversationSchema = new Schema<IConversation>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    status: { type: String, default: 'active' },
    currentNodeId: String,
    context: String,
    channel: { type: String, default: 'simulator' },
  },
  opts
)

ConversationSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
})

ConversationSchema.virtual('shop', {
  ref: 'Shop',
  localField: 'shopId',
  foreignField: '_id',
  justOne: true,
})

export interface IOrderItem {
  productId?: string
  name: string
  price: number
  quantity: number
  total: number
}

export interface IOrder extends Document {
  shopId: Types.ObjectId
  customerId: Types.ObjectId
  conversationId?: Types.ObjectId
  status: string
  total: number
  notes?: string
  type: string
  address?: string
  items: IOrderItem[]
}

const OrderSchema = new Schema<IOrder>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
    status: { type: String, default: 'pending', index: true },
    total: { type: Number, required: true },
    notes: String,
    type: { type: String, default: 'delivery' },
    address: String,
    items: [
      {
        productId: String,
        name: String,
        price: Number,
        quantity: Number,
        total: Number,
      },
    ],
  },
  opts
)

OrderSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
})

export interface IPasswordResetToken extends Document {
  userId: Types.ObjectId
  token: string
  expires: Date
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true },
    expires: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: { transform: jsonTransform } }
)

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
export const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema)
export const Shop = mongoose.models.Shop || mongoose.model<IShop>('Shop', ShopSchema)
export const WhatsappSession = mongoose.models.WhatsappSession || mongoose.model<IWhatsappSession>('WhatsappSession', WhatsappSessionSchema)
export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema)
export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)
export const FlowNode = mongoose.models.FlowNode || mongoose.model<IFlowNode>('FlowNode', FlowNodeSchema)
export const FlowEdge = mongoose.models.FlowEdge || mongoose.model<IFlowEdge>('FlowEdge', FlowEdgeSchema)
export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema)
export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)
export const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema)
export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)
export const PasswordResetToken = mongoose.models.PasswordResetToken || mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema)
