'use strict';

var express = require('express');
const request = require('request');

// start express module
var app = express();


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/')
  },
  filename: function (req, file, cb) {
	  //console.log(file);
    cb(null, file.originalname)
  }
});


app.use(express.static(path.join(__dirname, 'public')));
app.use(multer({
	//dest:'./public/uploads/',
	storage:storage
}).single('userfile'));




app.post('/upload', upload.single('myFile'), function (req, res) {
    const file = req.file;
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