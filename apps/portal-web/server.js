const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const path = require('path')
const fs = require('fs')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '8080', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      const { pathname } = parsedUrl

      // Handle /_next/static files directly
      if (pathname.startsWith('/_next/static/')) {
        const filePath = path.join(__dirname, '.next', 'static', pathname.replace('/_next/static/', ''))
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath)
          const contentType = ext === '.js' ? 'application/javascript' 
                          : ext === '.css' ? 'text/css'
                          : ext === '.json' ? 'application/json'
                          : 'application/octet-stream'
          res.setHeader('Content-Type', contentType)
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          fs.createReadStream(filePath).pipe(res)
          return
        }
      }

      // Handle favicon.ico
      if (pathname === '/favicon.ico') {
        const faviconPath = path.join(__dirname, 'app', 'favicon.ico')
        if (fs.existsSync(faviconPath)) {
          res.setHeader('Content-Type', 'image/x-icon')
          fs.createReadStream(faviconPath).pipe(res)
          return
        }
      }

      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log(`✅ portal-web listening on http://${hostname}:${port}`)
    })
})
