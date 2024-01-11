require('dotenv').config()

const express = require('express')
const line = require('@line/bot-sdk')
const { OpenAI } = require('openai')

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_LINE_SECRET 
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
  // event.message.text need to be json
  console.lof(event.message.text)

  const completion = await openai.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: event.message.text,
      }],
      max_tokens: 200,
  })
  // create an echoing text message
  const echo = { type: 'text', text: completion.choices[0].message.trim() || '抱歉，我沒有話可說了。' }

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

