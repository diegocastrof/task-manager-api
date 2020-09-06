const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = new express.Router()

// Create a new task
router.post('/tasks', auth, async (req, res) => {
  const task = new Task({ 
    ...req.body,
    owner: req.user._id
  })
  
  try {
    await task.save()
    res.status(201).send(task)
  } catch (error) {
    res.status(400).send(error)
  }  
})

// Read all task [DEVELOP TOOL]
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({})
    res.send(tasks)
  } catch(error) {
    res.status(500).send()
  }
})


// Read all task for an user
router.get('/mytasks', auth, async (req, res) => {
  
  // Sorting, filtering and paginating query handeling
  // Check field 'completed' on query
  const match = { 
    owner: req.user._id 
  }
  const sort = {}

  if (req.query.completed) {
    match.completed = req.query.completed === 'true'
  }
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split('_')
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 
  }

  
  try {
    // Sorting, filtering and paginating search
    const tasks = await Task.find(match).limit(parseInt(req.query.limit)).skip(parseInt(req.query.skip)).sort(sort)
    res.send(tasks)
  } catch(error) {
    res.status(500).send()
  }
})

// Read one task by id
router.get('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

    if (!task) {
      return res.status(404).send()
    }

    res.send(task)
  } catch(error) {
    res.status(500).send(error)
  }
})

// Update one task by id
router.patch('/tasks/:id', auth, async (req, res) => {

  const updates = Object.keys(req.body)
  const allowedUpdates = ['description', 'completed']
  const isValid = updates.every(update => allowedUpdates.includes(update))

  if (!isValid) {
    return res.status(400).send({ error: 'Invalid update inputs' })
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    })
    if (!task) {
      return res.status(404).send()
    }
    
    updates.forEach(update => task[update] = req.body[update])
    await task.save()
  
    res.send(task)
  } catch(error) {
    res.status(500).send(error)
  }
})

// Delete one task
router.delete('/tasks/:id', auth, async (req, res) => {  
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    })
    if (!task) {
      return res.status(404).send({ error: 'task not found' })
    }
    res.status(202).send({ success: `task successfully deleted: ${task}`})
  } catch(error) {
    res.status(500).send(error)
  }
})

module.exports = router