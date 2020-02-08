require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const Immutable = require('Immutable');

const app = express();
const port = 3000;

const rovers = Immutable.List(['Curiosity', 'Opportunity', 'Spirit']);
const NASA_API = 'https://api.nasa.gov/mars-photos/api/v1';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, '../public')));

// your API calls

// example API call
app.get('/apod', async (req, res) => {
    try {
        let image = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`)
            .then(res => res.json());
        res.send({ image })
    } catch (err) {
        console.log('error:', err);
    }
});


// Get the rover manifest data
app.get('/roverData/manifests', async (req, res) => {
    try {
        let roversManifest =  await Promise.all(rovers.map( rover => fetch(`${NASA_API}/manifests/${rover}?api_key=${process.env.API_KEY}`)
            .then(res => res.json())
        ));
        await res.send({ roversManifest })
    } catch (err) {
        console.log('error:', err);
    }
});

// Get the corresponding image data
app.get('/photos/:rover/:sol', async (req, res) => {
    try {
        let roverPhotos = await fetch(`${NASA_API}/rovers/${req.params.rover}/photos?sol=${req.params.sol}&api_key=${process.env.API_KEY}`)
            .then(res => res.json());
        res.send(roverPhotos)
    } catch (err) {
        console.log('error:', err);
    }
});

app.listen(port, () => console.log(`NASA app is LIVE on http://localhost:${port}/`));
