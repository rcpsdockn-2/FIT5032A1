import { createServer } from 'node:http'
import handler from '../api/send-email.js'

const server = createServer(async (request, response) => {
  if (request.url !== '/api/send-email') {
    response.writeHead(404).end()
    return
  }
  try { await handler(request, response) } catch {
    if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ message: 'Email service is temporarily unavailable.' }))
  }
})
server.listen(8787, '127.0.0.1', () => console.log('Email API: http://127.0.0.1:8787'))
