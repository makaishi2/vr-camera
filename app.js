var express = require('express');
var fs = require('fs');
if (fs.existsSync('./env.js')) {
    Object.assign(process.env, require('./env.js'));
}
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
var app = express();
var watson = require('watson-developer-cloud');
console.log(appEnv);
var vr_credentials = appEnv.getServiceCreds('visual-recognition-1');
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
