var fs = require('fs')
var archiver = require('archiver')

// 如果 zipDist 文件夹不存在，就创建它
if (!fs.existsSync('zipDist')) {
  fs.mkdirSync('zipDist')
}
var output = fs.createWriteStream('zipDist/luch-request.zip')

var archive = archiver('zip')

archive.on('error', function(err){
  throw err
})
const buildRequest = () => {
  archive.pipe(output)
  archive.directory('DCloud/luch-request', 'luch-request')
  archive.finalize()
}
buildRequest()
