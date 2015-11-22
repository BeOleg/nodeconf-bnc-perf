// This program is tasked with serving a file through a web server, but the
// file is bigger than the amount of memory that the program can use.

function startHttpServer(cb) {
  console.log('Starting http server...');
  var port = 9999;
  var server = http.createServer(onRequest);
  server.listen(port, whenReady);

  function whenReady() {
    console.log('Server listening on port', port);
    console.log('Serving file: ', filePath);
    console.log('Download file at: http://localhost:%d/download', port);
    cb();
  }
}

function onRequest(req, res) {
  if (req.method !== 'GET' || req.url !== '/download' ) {
    res.writeHead(404);
    res.write('<body>404 - Not found</body>');
    res.end();
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': filename
  });

  // -------------------------------------------------------------------------
  // --- FIX ME! -------------------------------------------------------------
  // -------------------------------------------------------------------------
  // This bit makes the program crash
  var readStream = fs.createReadStream(filePath);
    readStream.on('error', function(error) {
        //error handling
        throw error;
    });
    readStream.pipe(res);


  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
}


// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// --- The rest of the file isn't that interesting ---------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

// Mem watch — This program is on a diet and isn't allowed to use more than a
// certain amount of memory.

memKiller(200);
function memKiller(mbs) {
  var oneMb = Math.pow(2, 20);
  setInterval(check, 333).unref();

  function check() {
    var total = process.memoryUsage().rss / oneMb;
    if (total > mbs)
      throw new Error('Using too much memory: ' + total + ' MBs');
  }
}

// Ensure the necessary file exists and is large enough before starting
// the server.

var os = require('os');
var fs = require('fs');
var path = require('path');
var http = require('http');

var tmpDir = os.tmpDir();
var filename = 'big.dat';
var filePath = path.join(os.tmpDir(), filename);
var targetSize = Math.pow(2, 20) * 500;

asyncSeries([
  ensureFile,
  ensureSize,
  startHttpServer
], ready);

function asyncSeries(ops, cb) {
  doNext();

  function doNext() {
    var next = ops.shift();
    if (!next)
      return cb();

    next(then);
  }

  function then(err) {
    if (err)
      return cb(err);

    setImmediate(doNext);
  }
}

function ready(err) {
  if (err) throw err;
  console.log('All ready!');
}

function ensureFile(cb) {
  console.log('Making sure data file exists...');
  fs.exists(filePath, checked);

  function checked(exists) {
    if (exists)
      return cb();

    create(cb);
  }
}

function ensureSize(cb) {
  console.log('Ensuring the file is big enough...');
  fs.stat(filePath, then);

  function then(err, stat) {
    if (err)
      return cb(err);

    if (stat.size < targetSize)
      return create(cb);

    cb();
  }
}

function create(cb) {
  console.log('Creating the file...');
  var total = 0;
  var stream = fs.createWriteStream(filePath);
  var bufferSize = Math.pow(2, 10); // 1 Kb
  writeSome();

  function writeSome() {
    while (true) {
      var full = !stream.write(new Buffer(bufferSize));
      total += bufferSize;

      if (total >= targetSize)
        return stream.once('drain', cb);

      if (full)
        return stream.once('drain', writeSome);
    }
  }
}
