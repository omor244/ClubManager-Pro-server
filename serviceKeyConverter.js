const fs = require('fs')
const jsonData = fs.readFileSync('./b12-a11-project-firebase-adminsdk-fbsvc-b8af6f1762.json')

const base64String = Buffer.from(jsonData, 'utf-8').toString('base64')
console.log(base64String)
