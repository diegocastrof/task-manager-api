const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { welcomeUser, goodbyeUser } = require('../email/account')

const router = new express.Router()


//Sign up a new user
router.post('/users', async (req, res) => {
  const user = new User(req.body)

  try {
    // Save user to DB and generates a new token
    await user.save()
    // Send welcome email
    welcomeUser(user)
    const token = await user.generateAuthToken()
    res.status(201).send({ user, token })
  } catch (error) {
    res.status(400).send(error)
  }  
})

// Login an user
router.post('/users/login', async(req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()
    res.send({ user, token })
  } catch(error) {
    res.status(400).send(error)
  }
})

// Logout
router.post('/users/logout', auth, async(req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter( token => token.token !== req.token )
    await req.user.save()

    res.send( `User ${req.user.name} with token ${req.token} has been logout`)
  } catch(error) {
    res.status(500).send()
  }
})

// Logout all
router.post('/users/logoutall', auth, async(req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()

    res.send( `User ${req.user.name} has been logout in all devices`)
  } catch(error) {
    res.status(500).send()
  }
})

// Read all users [DEVELOP TOOL]
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({})
    res.send(users)
  } catch(error) {
    res.status(500).send()
  }
})

// Read user profile
router.get('/users/me', auth, async (req, res) => {
  try {
    res.send(req.user)
  } catch(error) {
    res.status(500).send()
  }
})


// Updates user profile
router.patch('/users/me', auth, async (req, res) => {
  
  // Check if inputs are present in User Schema
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'age', 'password', 'email']
  const isValid = updates.every(update => allowedUpdates.includes(update))

  // Send error if inputs are not in the User Schema
  if (!isValid) {
    return res.status(400).send({ error: 'Invalid update inputs' })
  }
  
  try {
    updates.forEach(update => req.user[update] = req.body[update])
    await req.user.save()    
    
    res.send(req.user)
  } catch (error) {
    res.status(400).send(error)
  }
})

// Delete one user
router.delete('/users/me', auth, async (req, res) => {  
  try {

    await req.user.remove()
    goodbyeUser(req.user)
    res.status(202).send({ success: `user successfully deleted: ${req.user}`})
  
  } catch(error) {
    console.log(error)
    res.status(500).send(error)
  }
})

const upload = multer({
  limits: { 
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    // Check if uploaded file match the accepted extensions
    if (!file.originalname.match(/.(jpg|jpeg|png)$/)) {
      cb(new Error('Image files can only be .jpg, jpeg or .png'))
    }
    // If files is ok, then is accepted
    cb(undefined, true)
  }
})


// Upload user profile picture
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({ width: 300 }).png().toBuffer()
  req.user.avatar = buffer
  await req.user.save()

  res.send('Your photo was upload successfully')
}, (error, req, res, next) => {
  res.status(406).send( { error: error.message })
})

// Delete user profile picture
router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined
  await req.user.save()

  res.send('Your profile picture was removed')
})

// Server up profile pictures images
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw new Error
    }

    res.set('Content-Type', 'image/png')
    res.send(user.avatar)
  } catch (error) {
    res.status(404).send()
  }
  

})


module.exports = router