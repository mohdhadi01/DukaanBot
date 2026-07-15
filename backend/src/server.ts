import { getApp } from './app'

const PORT = parseInt(process.env.BACKEND_PORT || '4000', 10)

getApp()
  .then((app) => {
    app.listen(PORT, () => {
      console.log(`DukaanBot API running on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err)
    process.exit(1)
  })
