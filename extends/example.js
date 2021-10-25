const gunFetch = require('./index')({peers: ["https://gun-manhattan.herokuapp.com/gun",
"https://us-west.xerberus.net/gun",
"http://gun-matrix.herokuapp.com/gun",
"https://gun-ams1.maddiex.wtf:443/gun",
"https://gun-sjc1.maddiex.wtf:443/gun",
"https://dletta.rig.airfaas.com/gun",
"https://mg-gun-manhattan.herokuapp.com/gun",
"https://gunmeetingserver.herokuapp.com/gun",
"https://e2eec.herokuapp.com/gun",
"https://gun-us.herokuapp.com/gun",
"https://gun-eu.herokuapp.com/gun",
"https://gunjs.herokuapp.com/gun",
"https://www.raygun.live/gun",
"https://gun-armitro.herokuapp.com/",
"https://fire-gun.herokuapp.com/gun"]})
// const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
// import someGun from './index.js'
// const gunFetch = someGun({peers: ["https://gun-manhattan.herokuapp.com/gun",
// "https://us-west.xerberus.net/gun",
// "http://gun-matrix.herokuapp.com/gun",
// "https://gun-ams1.maddiex.wtf:443/gun",
// "https://gun-sjc1.maddiex.wtf:443/gun",
// "https://dletta.rig.airfaas.com/gun",
// "https://mg-gun-manhattan.herokuapp.com/gun",
// "https://gunmeetingserver.herokuapp.com/gun",
// "https://e2eec.herokuapp.com/gun",
// "https://gun-us.herokuapp.com/gun",
// "https://gun-eu.herokuapp.com/gun",
// "https://gunjs.herokuapp.com/gun",
// "https://www.raygun.live/gun",
// "https://gun-armitro.herokuapp.com/",
// "https://fire-gun.herokuapp.com/gun"]})
// import {Headers} from 'node-fetch'

async function test(){
    let test = await gunFetch('gun://_hello/test/testing', {method: 'GET'})
    // let test = await gunFetch('gun://testing/testers', {method: 'DELETE', body: JSON.stringify({"_":{"#":"kuxuxky7AhHP0Zx7vgxq",">":{"test":1634634091087.001}},"test":"test"}), headers: {'X-Gun-Fig': 'PATH', 'X-Gun-Func':'UNSET'}})
    let testText = await test.text()
    console.log(testText)
    // let tests = await gunFetch('gun://testing', {method: 'GET', headers: {'X-Gun-Fig': 'PATH', 'X-Gun-Func':'REG', 'Authorization': 'hello'}})
    // let testsText = await tests.text()
    // console.log(testsText)
}

test()

// const Gun = require('gun')
// require('gun/lib/not.js')
// const gun = Gun({peers: ['https://gun-manhattan.herokuapp.com/gun']})
// gun.get('tesgdf34543r').get('dsfds43234').not(data => {console.log('worked')})