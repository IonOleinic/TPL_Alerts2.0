const Client = require('ssh2').Client

const conn = new Client()

function sendSSHComand(command) {
  conn.exec(command, function (err, stream) {
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
}

conn.on('ready', function () {
  console.log('SSH connection established.')
  // Execute a command on the remote server
  sendSSHComand('ipconfig')
})
conn.on('error', (error) => {
  if (error.code != 'ECONNRESET') {
    console.error('Error occurred:', error)
  }
  // Handle the error here
  conn.end()
})

conn.connect({
  host: '10.85.96.102',
  port: 22,
  username: 'obc',
  password: '123qwe',
  readyTimeout: 30000,
})
