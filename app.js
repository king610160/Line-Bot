require('dotenv').config()

const express = require('express')
const line = require('@line/bot-sdk')
const { OpenAI } = require('openai')

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_LINE_SECRET// This is also the default, can be omitted
})

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
}

// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
})

// create Express app
const app = express()

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err)
      res.status(500).end()
    })
})

// event handler
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null)
  }

  const completion = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: event.message.text,
  })

  // create an echoing text message
  const echo = { type: 'text', text: completion.data.choices[0].text }

  // use reply API
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [echo],
  })
}

// listen on port
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`listening on ${port}`)
})

