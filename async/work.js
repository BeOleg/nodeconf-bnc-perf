var async = require('async'),
    timers = require('timers');

module.exports = work;

function work(items, reportProgress, done) {
  async.each(items, each, done);

  function each(item, cb) {
    // Report progress
    var percent = 10;
    var total = items.length - (items.length % percent);
    var step = total / percent;
    var progress = (item / step) * percent;
    if (item % step === 0)
      reportProgress(progress);

    // Simulate a little local processing e.g. producing a request
    var d = Date.now();

      countDown(d, function(time) {
        if(time < d - 4000) {
            done();
            setTimeout(cb, 100);
        }
    });

    // Simulate remote processing e.g. db operation

  }
}

function countDown(time, cb) {
    var newTime = time - 1000;
    timers.setImmediate(cb, newTime);
}

process.on('SIGUSR2', function() {
    console.log('SIGUSR2 fired');
    heapdump.writeSnapshot('/tmp/after.heapsnapshot');
});