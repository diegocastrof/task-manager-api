const sgMail = require('@sendgrid/mail')


sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const welcomeUser = (user => {
  
  const welcomeMsg = {
    to: user.email,
    from: '',
    subject: `Welcome to the Task Manager API, ${user.name}`,
    text: `Hi ${user.name}, we're happy to have you on board`,
  }
  sgMail.send(welcomeMsg)
    .then(() => console.log('welcome email sent'))
    .catch(error => console.log(error.response.body.errors))
}) 

const goodbyeUser = (user => {
  
  const goodbyeMsg = {
    to: user.email,
    from: '',
    subject: `We hope to see you back soon, ${user.name}`,
    text: `We hope you enjoyed the app, ${user.name}. Come back soon!`,
  }
  sgMail.send(goodbyeMsg)
    .then(() => console.log('goodbye email sent'))
    .catch(error => console.log(error.response.body.errors))
}) 

module.exports = {
  welcomeUser,
  goodbyeUser
}



