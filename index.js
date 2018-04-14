var http = require('http');
var httpRange = require("http-range")

var ram = require('random-access-memory');
var hyperdrive = require('hyperdrive');
var defaultStorage = require('dat-storage');
var discovery = require('hyperdiscovery');

const PORT = 7000;
const USE_RAM = true;

const DRIVE_OPTS = {
                    "latest": true,
                    "sparse": true,
                   }


// ===========================================================================
function getStorage(key) {
  if (USE_RAM) {
    return ram;
  } else {
    return defaultStorage(`/tmp/${key}`);
  }
}


// ===========================================================================
function overrideStorage() {
  const storage = defaultStorage(...arguments)
  return {
    metadata: function(file, opts) {
      return storage.metadata(...arguments)
    },
    content: function(file, opts) {
      console.log(arguments);

      return storage.content(...arguments)
    }
  }
}


// ===========================================================================
function streamFile(key, filename, response, start, end) {
  var drive = hyperdrive(getStorage(key), key, DRIVE_OPTS);

  drive.on('ready', function() {
    discovery(drive);

/*
    drive.lstat(filename, function(err, stats) {
      console.log(err);
      console.log(stats);
    });
*/
    var opts = {}

    if (start > 0) {
      opts["start"] = start;
    }

    if (end >= 0) {
      var length = end - start + 1;

      opts["end"] = end;
      //opts["length"] = length;

      response.setHeader("Content-Length", length);
    }

    var stream = drive.createReadStream(filename, opts);

    stream.on('error', function(err) {
      var msg = "ERROR: " + err;

      if (!response.headersSent) {
        response.statusCode = 400;
        response.setHeader("Content-Length", msg.length);
        response.end(msg);
      }

      console.log(err);
    });

    response.on('finish', function() {
      drive.close();
    });

    stream.pipe(response);
/*
    stream.on('data', function(data) {
      console.log("data");
      //console.log(data);
      response.write(data);
    });

    stream.on('end', function() {
      console.log("end");
      response.end();
    });
*/

  });

  drive.on('error', function(err) {
    console.log("DAT Error: " + err);
  });
}

// ===========================================================================
http.createServer(function(request, response) {
  response.statusCode = 200;

  var index = request.url.indexOf("/", 1);
  var key = request.url.substring(1, index);
  var path = request.url.substring(index + 1);

  path = decodeURIComponent(path);

  //console.log("File: " + path);

  var start = 0;
  var end = -1;

  try {
    if (request.headers.range) {
      var range = httpRange.Range.prototype.parse(request.headers.range).ranges[0];
      start = range.low;
      end = range.high;
    }
  } catch (e) {
    console.log(e);
  }

  streamFile(key, path, response, start, end);

}).listen(PORT, function() {
  console.log('Server start on: ' + PORT);
});
 

