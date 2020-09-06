const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  age: {
    type: Number,
    default: 0,
    validator(age) {
      if(age < 0) {
        throw new Error('Age must be a valid number')
      }
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowecase: true,
    validate(email) {
      if (!validator.isEmail(email)) {
        throw new Error ('You must provide a valid email')
      }
    }
  },
  password: {
    type:String,
    required: true,
    trim: true,
    minlength: 7,
    validate(value) {
      if (validator.contains(value.toLowerCase(), 'password')) {
        throw new Error('Password can not contains word password')
      }
    } 
  },
  tokens: [{
    token: {
      type: String,
      require: true
    }
  }],
  avatar : {
    type: Buffer
  }
}, {
  timestamps: true
})

// Creates a virtual relationship between an user and his tasks
userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner'
})

// Erase sensitive information from the user data response
userSchema.methods.toJSON = function() {
  const user = this
  const publicUser = user.toObject()

  delete publicUser.password
  delete publicUser.tokens
  delete publicUser.avatar

  return publicUser
}

// Generates Authentication Token for created/login user
userSchema.methods.generateAuthToken = async function () {
  const user = this
  // Creates a new token
  const token = jwt.sign({ _id: user._id } , process.env.SECRET_ACCESS_TOKEN)
  // Add token to tokens array and save user to db
  user.tokens = user.tokens.concat({ token })
  await user.save()
  
  return token
}

// Check credentials of user comparing it with db // AUTHENTICATION
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email })
  
  if (!user) {
    throw new Error('Unable to login')
  }
  
  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    throw new Error('Unable to login')
  }
  return user
}

// Hash the password
userSchema.pre('save', async function(next) {
  const user = this
  
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 12)
  }

  next()
})

// Delete tasks that removed user owns
userSchema.pre('remove', async function(next) {
  const user = this
  await Task.deleteMany({ owner: user._id })
  next()
})

const User = mongoose.model('User', userSchema)

module.exports = User