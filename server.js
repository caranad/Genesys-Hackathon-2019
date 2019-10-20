'use strict';

var express = require('express');
const request = require('request');
var multer = require('multer');
var path = require('path');
var https = require('https');
var fse = require('fse');
const jo = require('jpeg-autorotate')
const options = {quality: 100}


const ipath = './public/uploads/image.jpg' 

var privateKey  = fse.readFileSync('sslcert/key.pem', 'utf8');
var certificate = fse.readFileSync('sslcert/cert.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};




// start express module
var app = express();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function (req, file, cb) {
        // console.log(file);
        //cb(null, file.originalname);
        cb(null, "image.jpg");
    }
});
var upload = multer({ storage: storage })

app.use(express.static(path.join(__dirname, 'public')));
app.use(upload.single('userfile'));




app.post('/upload', function (req, res) {
    
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var country = req.body.country;
    var weather = req.body.weather;
    var userfile = req.file;

    console.log(latitude, longitude, country, weather);

    fse.writeFileSync('./public/uploads/data.json', JSON.stringify({
        "lat" : latitude,
        "long" : longitude,
        "country" : country,
        "weather" : weather,
        "problem" : "water the crops"
    }));

    console.log(userfile);

    res.end(JSON.stringify({}));
});






var httpsServer = https.createServer(credentials, app);
httpsServer.listen(process.env.PORT || 3000, function () {
    var host = httpsServer.address().address;
    var port = httpsServer.address().port;

    console.log('Prince Farming started at https://%s:%s', host, port);
});



/*
const Clarifai = require('clarifai');
const app = new Clarifai.App({
    apiKey: 'f9c4e799879b4ea18641017d1a8a6feb'
});

app.models.predict(Clarifai.GENERAL_MODEL, 'https://res.cloudinary.com/patch-gardens/image/upload/c_fill,f_auto,h_840,q_auto:good,w_840/v1568385956/qee7f4jxsabwphslmjfz.jpg')
.then(response => {
  console.log(JSON.stringify(response, null, 4));
})
.catch(err => {
  console.log(err);
});
*/




/*
let subscriptionKey = "38952973ab824afe8673284add426299";
let endpoint = "https://westcentralus.api.cognitive.microsoft.com/"

var uriBase = endpoint + 'vision/v2.1/analyze';

const imageUrl =
    'https://res.cloudinary.com/patch-gardens/image/upload/c_fill,f_auto,h_840,q_auto:good,w_840/v1568385956/qee7f4jxsabwphslmjfz.jpg';

// Request parameters.
const params = {
    'visualFeatures': 'Categories,Description,Color,Brands,Faces,Objects,Tags',
    'details': '',
    'language': 'en'
};

const options = {
    uri: uriBase,
    qs: params,
    body: '{"url": ' + '"' + imageUrl + '"}',
    headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key' : subscriptionKey
    }
};

request.post(options, (error, response, body) => {
  if (error) {
    console.log('Error: ', error);
    return;
  }
  let jsonResponse = JSON.stringify(JSON.parse(body), null, 4);
  console.log('JSON Response\n');
  console.log(jsonResponse);
});

*/