const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = 3000

app.use(express.json())

/*
|--------------------------------------------------------------------------
| Data files
|--------------------------------------------------------------------------
*/

const provincesFile = path.join(__dirname, 'data', 'rdc-provinces.geojson')
const zonesFile = path.join(__dirname, 'data', 'health-zones.geojson')
const ouvragesFile = path.join(__dirname, 'data', 'ouvrages.json')

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
}

/*
|--------------------------------------------------------------------------
| Provinces API
|--------------------------------------------------------------------------
*/

app.get('/api/provinces', (req, res) => {

  fs.readFile(provincesFile, 'utf8', (err, data) => {

    if (err) {
      return res.status(500).json({
        error: 'Unable to load provinces',
        innerError: err
      })
    }

    res.json(JSON.parse(data))

  })

})


/*
|--------------------------------------------------------------------------
| Health Zones API
|--------------------------------------------------------------------------
*/

app.get('/api/health_zones', (req, res) => {

  fs.readFile(zonesFile, 'utf8', (err, data) => {

    if (err) {
      return res.status(500).json({
        error: 'Unable to load health zones'
      })
    }
    const { province } = req.query;
    let jsonData = JSON.parse(data);
    if(province) {
      jsonData = jsonData.features.filter(d => d.properties.province==province);
    }
    res.json(jsonData)

  })

})


/*
|--------------------------------------------------------------------------
| Ouvrages API
|--------------------------------------------------------------------------
*/

app.get('/api/ouvrages', (req, res) => {

  fs.readFile(ouvragesFile, 'utf8', (err, data) => {

    if (err) {
      return res.status(500).json({
        error: 'Unable to load ouvrages'
      })
    }

    res.json(JSON.parse(data))

  })

})


/*
|--------------------------------------------------------------------------
| Filtered ouvrages by province
|--------------------------------------------------------------------------
*/

app.get('/api/ouvrages/province/:province', (req, res) => {

  const province = req.params.province

  fs.readFile(ouvragesFile, 'utf8', (err, data) => {

    if (err) {
      return res.status(500).json({ error: 'Unable to load ouvrages' })
    }

    const ouvrages = JSON.parse(data)

    const filtered = ouvrages.filter(o =>
      o.province === province
    )

    res.json(filtered)

  })

})


/*
|--------------------------------------------------------------------------
| Filter by type
|--------------------------------------------------------------------------
*/

app.get('/api/ouvrages/type/:type', (req, res) => {

  const type = req.params.type

  fs.readFile(ouvragesFile, 'utf8', (err, data) => {

    if (err) {
      return res.status(500).json({ error: 'Unable to load ouvrages' })
    }

    const ouvrages = JSON.parse(data)

    const filtered = ouvrages.filter(o =>
      o.type === type
    )

    res.json(filtered)

  })

})


/*
|--------------------------------------------------------------------------
| Server start
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})