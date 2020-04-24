var fs = require('fs')
var archiver = require('archiver')

var output = fs.createWriteStream('zipDist/request-demo.zip')

var archive = archiver('zip')

archive.on('error', function(err){
  throw err
})
const buildDemo = () => {
  archive.pipe(output)
  archive.directory('DCloud/request-demo', 'request-demo')
  archive.finalize()
}

buildDemo()
