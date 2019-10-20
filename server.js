'use strict';

var express = require('express');
const request = require('request');
var multer = require('multer');
var path = require('path');
var https = require('https');
var fse = require('fse');
var ExifImage = require('exif').ExifImage;
var Jimp = require('jimp'); 
var piexif = require('piexifjs');
const sharp = require('sharp');
const sendmail = require('sendmail')();

var privateKey  = fse.readFileSync('sslcert/key.pem', 'utf8');
var certificate = fse.readFileSync('sslcert/cert.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};


const TYPE = `binary`

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
    var temperature = req.body.temperature;
    var userfile = req.file;

    new ExifImage({ image : './public/uploads/image.jpg' }, async function (error, exifData) {
        
        if (error) {
            console.log('Error: ' + error.message);
        }

        // get orientation
        var orientation = exifData.image.Orientation;
        console.log("orientation", orientation);
   
        // remove exif metadata
        if (orientation==1 || orientation==3 || orientation==6 || orientation==8) {
            const newData = piexif.remove(
                fse.readFileSync('./public/uploads/image.jpg').toString(TYPE)
            )
            fse.writeFileSync('./public/uploads/image.jpg', new Buffer(newData, TYPE))
        }

        // rotate image
        const image = await Jimp.read('./public/uploads/image.jpg'); 
        if (orientation == 1) {
            await image.rotate(0).writeAsync('./public/uploads/image.jpg'); 
        } else if (orientation == 3) {
            await image.rotate(180).writeAsync('./public/uploads/image.jpg');
        } else if (orientation == 6) {
            await image.rotate(270).writeAsync('./public/uploads/image.jpg');
        } else if (orientation == 8) {
            await image.rotate(90).writeAsync('./public/uploads/image.jpg');
        }

        // originals
        //1: 'rotate(0deg)',
        //3: 'rotate(180deg)',
        //6: 'rotate(90deg)',
        //8: 'rotate(270deg)'

        getImageDetails(function(img_data) {

            var env_data = {
                "lat" : latitude,
                "long" : longitude,
                "country" : country,
                "city" : "Toronto",
                "weather" : weather,
                "extreme_weather" : false,
                "temperature" : temperature,
                "img_data" : img_data
            };
    
            askGenesys(env_data, function(suggestion, confidence) {
                var full_data = {
                    env_data : env_data,
                    suggestion : suggestion,
                    confidence : confidence
                };
                fse.writeFileSync('./public/uploads/data.json', JSON.stringify(full_data));
    
                //return res.end(JSON.stringify({}));
                
                sendmail({
                    from: 'no-reply@yourdomain.com',
                    to: 'baranadi@rogers.com',
                    subject: 'Prince Farming Notification',
                    html: 
                       "<div>Latitude: " + env_data.lat + "</div>"+
                       "<div>Longitude: " + env_data.long + "</div>"+
                       "<div>Country: " + env_data.country + "</div>"+
                       "<div>City: " + env_data.city + "</div>"+
                       "<div>Weather: " + env_data.weather + "</div>"+
                       "<div>Temperature: " + env_data.temperature + "°C</div>"+
                       "<div>Image Color: <span style=\"width:10px;height:10px;background-color:" + env_data.img_data.color + "\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>" +
                       "<div>Image Tags: " + env_data.img_data.tags.join(", ") + "</div>" +
                       "<div>Suggestion: " + full_data.suggestion + "</div>" +
                       "<div>Confidence: " + (full_data.confidence*100) + "%</div>"
                  }, function(err, reply) {
                    res.end(JSON.stringify({}));
                });
            });
        });

        console.log("Image Processing Completed"); 
    });
});




function askGenesys(env_data, callback) {
    var options = { 
        method: 'POST',
        url: 'https://api.genesysappliedresearch.com/v2/knowledge/generatetoken',
        headers: { secretkey: '96a8e5ad-06a6-4ed7-87ec-8e1d0e6c8820', organizationid: 'a078486f-4ed7-4814-af1a-11718c78ea21' } 
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        var body = JSON.parse(body);
        
        var token = body.token;
        //console.log(body);
        askGenesysQuestion(token, env_data, callback);
    });
}

function askGenesysQuestion(token, env_data, callback) {

    console.log(env_data);

    var options = { method: 'POST',
      url: 'https://api.genesysappliedresearch.com/v2/knowledge/knowledgebases/43a214a6-be93-477d-a2e6-25601ff1a247/search',
      headers: 
       { token: token,
         organizationid: 'a078486f-4ed7-4814-af1a-11718c78ea21',
         'Content-Type': 'application/json' },
      body: 
       { 
        query: "Location: Toronto; Color: green; Pests: no; weather forecast: rain; temperature: mild; extreme forecast: no",
       //query: "Location: Toronto; Color: green; Pests: no; weather forecast: rain; temperature: mild; extreme forecast: no",
       //query2: "Location: Toronto; Color: green; Pests: yes; weather forecast: rain; temperature forecast: hot; extreme forecast: yes",
       //query3: "Location: Toronto; Color: yellow; Pests: yes; weather forecast: rain; temperature forecast: cold; extreme forecast: yes",  
         pageSize: 5,
         pageNumber: 1,
         sortOrder: 'string',
         sortBy: 'string',
         languageCode: 'en-US',
         documentType: 'Faq' },
      json: true };
    
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
    
        //console.log(JSON.stringify(body,null,4));

        var results = body.results.filter(function(x) {
            return x.confidence > 0.1;
        });
        if (results.length > 0) {
            var result = results[0];
            callback(result.faq.answer, result.confidence);
        }
    });
}

function getImageDetails(callback) {

    sharp('./public/uploads/image.jpg').resize(400).toFile('./public/uploads/image_resized.jpg', (err, info) => { 

        var imageToUSe = fse.readFileSync('./public/uploads/image_resized.jpg');

        var subscriptionKey = "38952973ab824afe8673284add426299";
        var endpoint = "https://westcentralus.api.cognitive.microsoft.com/"
        var uriBase = endpoint + 'vision/v2.1/analyze';

        // Request parameters.
        var params = {
            'visualFeatures': 'Categories,Description,Color,Brands,Faces,Objects,Tags',
            'details': '',
            'language': 'en'
        };
        
        var options = {
            uri: uriBase,
            qs: params,
            body:imageToUSe,
            headers: {
                'Content-Type': 'application/octet-stream',
                'Ocp-Apim-Subscription-Key' : subscriptionKey
            }
        };
        
        request.post(options, (error, response, body) => {
            if (error) {
                console.log('Error: ', error);
                return callback({});
            }

            var body = JSON.parse(body);
            var color = body.color.accentColor;
            var desc_tags = body.description.tags;
            var tags = body.tags.map(function(x) {return x.name;});
            
            var Obj = {};
            desc_tags.map(x => {Obj[x] = true; });
            tags.map(x => {Obj[x] = true; });

            var t = Object.keys(Obj).sort();

            callback({
                color : "#" + color,
                tags : t
            });
        });
    });
}

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
