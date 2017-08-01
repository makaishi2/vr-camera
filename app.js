var express = require('express');
var fs = require('fs');
var multer  = require('multer');
var os = require('os');
if (fs.existsSync('./env.js')) {
    Object.assign(process.env, require('./env.js'));
}
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
var app = express();
var watson = require('watson-developer-cloud');
console.log(appEnv);
var vr_credentials = appEnv.getServiceCreds('visualrecognition-for-darkvision');
console.log(vr_credentials);
var visualRecognition = new watson.VisualRecognitionV3({
  version_date: '2015-05-19',
  api_key: vr_credentials.api_key
});
app.use(express.static(__dirname + '/public'));
var appEnv = cfenv.getAppEnv();
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

// Setup the upload mechanism
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, os.tmpdir());
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
  
var upload = multer({
    storage: storage
});
app.upload = upload; 

app.post('/send', app.upload.single('images_file'), function(req, res) {
    var params = {
        url: null,
        images_file: null
    };

    if (req.file) { // file image
        params.images_file = fs.createReadStream(req.file.path);
        console.log( req.file );
    }
});