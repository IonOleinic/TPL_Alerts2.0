const Client = require('ssh2').Client

const conn = new Client()

conn.on('ready', function () {
  console.log('SSH connection established.')

  // Execute a command on the remote server
  conn.exec('dir', function (err, stream) {
    if (err) throw err

    stream
      .on('close', function (code, signal) {
        console.log('Stream closed with code ' + code)
        conn.end()
      })
      .on('data', function (data) {
        console.log('STDOUT: ' + data)
      })
      .stderr.on('data', function (data) {
        console.log('STDERR: ' + data)
      })
  })
})

conn.connect({
  host: '192.168.95.70',
  port: 22,
  username: 'admin',
  password: 'tpl@1234',
  readyTimeout: 30000,
})
