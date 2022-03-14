const makeFetch = require('make-fetch')
const Gun = require('gun')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const http = require('http')
const https = require('https')
require('gun/lib/path')
require('gun/lib/not')
require('gun/lib/unset')
const SEA = Gun.SEA

// const LIST_OF_URLS = [
//   'https://gun-manhattan.herokuapp.com/gun',
//   'https://us-west.xerberus.net/gun',
//   'http://gun-matrix.herokuapp.com/gun',
//   'https://gun-ams1.maddiex.wtf:443/gun',
//   'https://gun-sjc1.maddiex.wtf:443/gun',
//   'https://dletta.rig.airfaas.com/gun',
//   'https://mg-gun-manhattan.herokuapp.com/gun',
//   'https://gunmeetingserver.herokuapp.com/gun',
//   'https://e2eec.herokuapp.com/gun',
//   'https://gun-us.herokuapp.com/gun',
//   'https://gun-eu.herokuapp.com/gun',
//   'https://gunjs.herokuapp.com/gun',
//   'https://www.raygun.live/gun',
//   'https://gun-armitro.herokuapp.com/',
//   'https://fire-gun.herokuapp.com/gun'
// ]

const LIST_OF_URLS = []

const STORAGE_FOLDER = path.resolve('./storage')
const DEFAULT_OPTS = {
  file: STORAGE_FOLDER
}

module.exports = function makeGunFetch (opts = {}) {
  const finalOpts = { ...DEFAULT_OPTS, ...opts }

  const fileLocation = finalOpts.file

  if (fileLocation && (!fs.existsSync(fileLocation))) {
    fs.mkdirSync(fileLocation)
  }

  const gun = Gun(finalOpts)

  const SUPPORTED_METHODS = ['HEAD', 'GET', 'PUT', 'DELETE']
  // 'POST', 'PATCH'
  const encodeType = '-'
  const hostType = '_'
  const users = {}

  async function getBody (body) {
    let mainData = ''
    for await (const data of body) {
      mainData += data
    }
    try {
      mainData = JSON.parse(mainData)
    } catch (error) {
      console.error(error)
    }
    return mainData
  }

  function formatReq (hostname, pathname) {
    const mainReq = {}
    mainReq.mainPath = `${hostname}${pathname}`.split('/').filter(Boolean).map(data => { return decodeURIComponent(data) })
    mainReq.multiple = mainReq.mainPath.length > 1
    mainReq.mainHost = mainReq.mainPath.shift()
    mainReq.queryType = mainReq.mainHost[0] === hostType ? mainReq.mainHost[0] : ''
    mainReq.mainHost = mainReq.mainHost.replace(mainReq.queryType, '')
    mainReq.mainPath = mainReq.mainPath.join('.')

    if (mainReq.queryType) {
      if (mainReq.mainHost) {
        mainReq.mainQuery = true
      } else {
        mainReq.mainQuery = false
      }
    } else {
      mainReq.mainQuery = true
    }

    return mainReq
  }

  function queryizeReq (mainReq, user) {
    if (user) {
      return mainReq.multiple ? users[mainReq.mainHost].path(mainReq.mainPath) : users[mainReq.mainHost]
    } else {
      if (mainReq.queryType) {
        if (mainReq.mainHost.includes('.') || mainReq.mainHost.includes('-') || mainReq.mainHost.includes('_')) {
          return mainReq.multiple ? gun.get('~' + mainReq.mainHost).path(mainReq.mainPath) : gun.get('~' + mainReq.mainHost)
        } else {
          return mainReq.multiple ? gun.get('~@' + mainReq.mainHost).path(mainReq.mainPath) : gun.get('~@' + mainReq.mainHost)
        }
      } else {
        return mainReq.multiple ? gun.get(mainReq.mainHost).path(mainReq.mainPath) : gun.get('~' + mainReq.mainHost)
      }
    }
  }

  // function checkPeer(url){
  //   if(url.startsWith('https')){
  //     return new Promise((resolve) => {
  //       https.get(url, res => {
  //         res.resume()
  //         resolve(res.statusCode === 200)
  //       })
  //     })
  //   } else if(url.startsWith('http')){
  //     return new Promise((resolve) => {
  //       http.get(url, res => {
  //         res.resume()
  //         resolve(res.statusCode === 200)
  //       })
  //     })
  //   } else {
  //     return null
  //   }
  //   return new Promise((resolve) => {
  //     http.get(url, res => resolve(res.statusCode === 200))
  //   })
  // }

  async function checkPeer(url){
    if(url.startsWith('https')){
      return await new Promise((resolve) => {
        https.get(url, res => {
          res.resume()
          resolve(res.statusCode === 200)
        })
      })
    } else if(url.startsWith('http')){
      return await new Promise((resolve) => {
        http.get(url, res => {
          res.resume()
          resolve(res.statusCode === 200)
        })
      })
    } else {
      return null
    }
  }

  const fetch = makeFetch(async request => {
    const { url, method, headers, body } = request

    try {
      const { hostname, pathname, protocol } = new URL(url)
      let mainHostname = null
      if (hostname && hostname[0] === encodeType) {
        mainHostname = Buffer.from(hostname.slice(1), 'hex').toString('utf-8')
      } else {
        mainHostname = hostname
      }

      if (protocol !== 'gun:' || !method || !SUPPORTED_METHODS.includes(method) || !mainHostname || mainHostname[0] === encodeType || !/^[a-zA-Z0-9-_.]+$/.test(mainHostname)) {
        return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('query is incorrect')] }
      }

      const main = formatReq(mainHostname, pathname)

      if(method === 'HEAD'){
        if (main.mainQuery) {
          let gunQuery = null
          let mainData = null
          // if this is a query for the user space, then we make sure the user is authenticated
          if (headers.authorization) {
            if (!users[main.mainHost] || !Boolean(await SEA.verify(headers.authorization, users[main.mainHost].check.pub))) {
              return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('either user is not logged in, or you are not verified')] }
            }
          }
          // if the user is authenticated, then we turn the request into a query
          gunQuery = queryizeReq(main, headers.authorization)
          // if x-not or x-paginate is not sent, then we assume this is a regular query
          mainData = await new Promise((resolve) => {
            gunQuery.once(found => {
              // if(found['_']){
              //   delete found['_']
              // }
              resolve(found)
            })
          })
          if (mainData !== undefined) {
            return { statusCode: 200, headers: {}, data: [] }
          } else {
            return { statusCode: 400, headers: {}, data: [] }
          }
        } else {
          if(headers['x-node']){
            if (!LIST_OF_URLS.includes(headers['x-node'])) {
              return { statusCode: 400, headers: {}, data: [] }
            } else {
              return { statusCode: 200, headers: {}, data: [] }
            }
          } else if(headers['x-nodes']){
            let doesNotHaveIt = false
            try {
              for(const relay of JSON.parse(headers['x-nodes'])){
                if(!LIST_OF_URLS.includes(relay)){
                  doesNotHaveIt = true
                }
              }
            } catch (err) {
              console.error(err)
            }
            if (doesNotHaveIt) {
              return { statusCode: 400, headers: {}, data: [] }
            } else {
              return { statusCode: 200, headers: {}, data: [] }
            }
          } else if (headers['x-peer']) {
            if (!headers['x-peer'].endsWith('/gun') || LIST_OF_URLS.includes(headers['x-peer']) || !await checkPeer(headers['x-peer'])) {
              return { statusCode: 400, headers: {}, data: [] }
            } else {
              LIST_OF_URLS.push(headers['x-peer'])
              gun.opt({peers: [headers['x-peer']]})
              return { statusCode: 200, headers: {}, data: [] }
            }
          } else if(headers['x-peers']){
            const peersArr = []
            try {
              for(const relay of JSON.parse(headers['x-peers'])){
                if(relay.endsWith('/gun') && !LIST_OF_URLS.includes(relay) && await checkPeer(relay)){
                  peersArr.push(relay)
                }
              }
            } catch (err) {
              console.error(err)
            }
            if(!peersArr.length){
              return { statusCode: 400, headers: {}, data: [] }
            } else {
              LIST_OF_URLS.push(...peersArr)
              gun.opt({peers: peersArr})
              return { statusCode: 200, headers: {}, data: [] }
            }
          } else {
            return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [] }
          }
        }
      } else if (method === 'GET') {
        if (main.mainQuery) {
          let gunQuery = null
          let mainData = null
          // if this is a query for the user space, then we make sure the user is authenticated
          if (headers.authorization) {
            if (!users[main.mainHost] || !Boolean(await SEA.verify(headers.authorization, users[main.mainHost].check.pub))) {
              return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('either user is not logged in, or you are not verified')] }
            }
          }
          // if the user is authenticated, then we turn the request into a query
          gunQuery = queryizeReq(main, headers.authorization)
          // if x-not or x-paginate is not sent, then we assume this is a regular query
          if (!headers['x-not'] && !headers['x-paginate']) {
            mainData = await new Promise((resolve) => {
              gunQuery.once(found => {
                // if(found['_']){
                //   delete found['_']
                // }
                resolve(found)
              })
            })
          } else if (headers['x-not'] && JSON.parse(headers['x-not'] === true)) {
            const queryTimer = headers['x-timer'] && !Number.isNaN(Number(headers['x-timer'])) ? JSON.parse(headers['x-timer']) * 1000 : 2500
            mainData = await Promise.any([
              new Promise((resolve) => {
                setTimeout(() => { resolve({ found: null, result: false }) }, queryTimer)
              }),
              new Promise((resolve) => {
                gunQuery.not(found => { resolve({ found, result: true }) })
              })
            ])
          } else if (headers['x-paginate'] && typeof (JSON.parse(headers['x-paginate'])) === 'object') {
            const queryTimer = headers['x-timer'] && !Number.isNaN(Number(headers['x-timer'])) ? JSON.parse(headers['x-timer']) * 1000 : 2500
            // mainData = await Promise.any([
            //   new Promise((resolve) => {
            //     setTimeout(() => { resolve(undefined) }, queryTimer)
            //   }),
            //   new Promise((resolve) => {
            //     gunQuery.get(JSON.parse(headers['x-paginate'])).once().map().once(found => { resolve(found) })
            //   })
            // ])
            mainData = await new Promise((resolve) => {
              const arr = []
              let len = arr.length
              gunQuery.get(JSON.parse(headers['x-paginate'])).once().map().once(found => {
                // if(found['_']){
                //   delete found['_']
                // }
                // for(const prop in found){
                //   if(found[prop]['#']){}
                // }
                arr.push(found)
              })
              const check = setInterval(() => {
                if(len === arr.length){
                  clearInterval(check)
                  resolve(arr)
                } else {
                  len = arr.length
                }
              }, queryTimer)
            })
          } else {
            mainData = undefined
          }
          if (mainData !== undefined) {
            return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify(mainData))] }
          } else {
            return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('Data is empty')] }
          }
        } else {
          if (headers['x-alias']) {
            if (users[headers['x-alias']]) {
              return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(`you are logged in as${headers['x-alias']}`)] }
            } else {
              return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(`you are not logged in as ${headers['x-alias']}`)] }
            }
          } else {
            return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('"x-alias" header was not used')] }
          }
        }
      } else if (method === 'PUT') {
        if (main.mainQuery) {
          let gunQuery = null
          let mainData = null
          if (headers.authorization) {
            if (!users[main.mainHost] || !Boolean(await SEA.verify(headers.authorization, users[main.mainHost].check.pub))) {
              return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('either user is not logged in, or you are not verified')] }
            }
          }
          gunQuery = queryizeReq(main, headers.authorization)
          if (!headers['x-set'] || !JSON.parse(headers['x-set'])) {
            const useBody = await getBody(body)
            mainData = await new Promise((resolve) => {
              gunQuery.put(useBody).once(found => {
                // if(found['_']){
                //   delete found['_']
                // }
                resolve(found)
              })
            })
          } else {
            const useBody = await getBody(body)
            mainData = await new Promise((resolve) => {
              gunQuery.set(useBody).once(found => {
                // if(found['_']){
                //   delete found['_']
                // }
                resolve(found)
              })
            })
          }
          if(mainData !== undefined){
            // if(headers['x-extra'] && Array.isArray(JSON.parse(headers['x-extra']))){
            //   for(const headerPath of JSON.parse(headers['x-extra'])){
            //     const headerArr = headerPath.split(' ')
            //     if(JSON.parse(headerArr[0])){
            //       await new Promise((resolve) => {
            //         gun.path(headerArr[1]).set(mainData).once(data => resolve(data))
            //       })
            //     } else {
            //       await new Promise((resolve) => {
            //         gun.path(headerArr[1]).put(mainData).once(data => resolve(data))
            //       })
            //     }
            //   }
            // }
            return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify(mainData))] }
          } else {
            return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('Data is empty')] }
          }
        } else {
          let mainData = null
          if (!headers['x-create'] && !headers['x-login']) {
            return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('"x-create" or "x-login" header is needed with the alias')] }
          } else if (headers['x-create']) {
            const useBody = await getBody(body)
            mainData = await new Promise((resolve) => {
              gun.user().create(headers['x-create'], useBody, ack => {
                resolve(ack)
              }, { already: false })
            })
            if (mainData.err) {
              return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify(mainData))] }
            } else {
              return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify(mainData))] }
            }
          } else if (headers['x-login']) {
            const useBody = await getBody(body)
            if (users[headers['x-login']]) {
              if (users[headers['x-login']].check.hash === await SEA.work(headers['x-login'], useBody)) {
                return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(users[headers['x-login']].check.token)] }
              } else {
                return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('password is incorrect')] }
              }
            } else {
              users[headers['x-login']] = gun.user()
              mainData = await new Promise((resolve) => {
                users[headers['x-login']].auth(headers['x-login'], useBody, ack => {
                  resolve(ack)
                })
              })
              if (mainData.err) {
                users[headers['x-login']].leave()
                delete users[headers['x-login']]
                return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify(mainData))] }
              } else {
                users[headers['x-login']].check = {}
                users[headers['x-login']].check.hash = await SEA.work(headers['x-login'], useBody)
                users[headers['x-login']].check.pub = mainData.sea.pub
                users[headers['x-login']].check.token = await SEA.sign(await SEA.work(crypto.randomBytes(16).toString('hex')), mainData.sea)
                return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify({token: users[headers['x-login']].check.token, address: users[headers['x-login']].check.pub}))] }
              }
            }
          }
        }
      } else if (method === 'DELETE') {
        if (main.mainQuery) {
          let gunQuery = null
          let mainData = null
          if (headers.authorization) {
            if (!users[main.mainHost] || !Boolean(await SEA.verify(headers.authorization, users[main.mainHost].check.pub))) {
              return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('either user is not logged in, or you are not verified')] }
            }
          }
          gunQuery = queryizeReq(main, headers.authorization)
          if (!headers['x-unset'] || !JSON.parse(headers['x-unset'])) {
            mainData = await new Promise((resolve) => {
              gunQuery.put(null).once(found => {
                // if(found['_']){
                //   delete found['_']
                // }
                resolve(found)
              })
            })
          } else {
            const useBody = await getBody(body)
            mainData = await new Promise((resolve) => {
              gunQuery.unset(useBody).once(found => {
                // if(found['_']){
                //   delete found['_']
                // }
                resolve(found)
              })
            })
          }
          if(mainData !== undefined){
            // if(headers['x-extra'] && Array.isArray(JSON.parse(headers['x-extra']))){
            //   for(const headerPath of JSON.parse(headers['x-extra'])){
            //     const headerArr = headerPath.split(' ')
            //     if(JSON.parse(headerArr[0])){
            //       await new Promise((resolve) => {
            //         gun.path(headerArr[1]).unset(mainData).once(data => resolve(data))
            //       })
            //     } else {
            //       await new Promise((resolve) => {
            //         gun.path(headerArr[1]).put(null).once(data => resolve(data))
            //       })
            //     }
            //   }
            // }
            return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify(mainData))] }
          } else {
            return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('Data is empty')] }
          }
        } else {
          let mainData = null
          if (!headers['x-delete'] && !headers['x-logout']) {
            return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('"x-delete" or "x-logout" header is needed with the alias')] }
          } else if (headers['x-logout']) {
            if (users[headers['x-logout']]) {
              if (headers.authorization) {
                if (!Boolean(await SEA.verify(headers.authorization, users[headers['x-logout']].check.pub))) {
                  return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('either user is not logged in, or you are not verified')] }
                } else {
                  users[headers['x-logout']].leave()
                  delete users[headers['x-logout']]
                  return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify({ message: 'User has been logged out' }))] }
                }
              } else {
                return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('the header x-authorization is required')] }
              }
            } else {
              return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('user is currently logged out')] }
            }
          } else if (headers['x-delete']) {
            if (users[headers['x-delete']]) {
              // if (headers.authorization) {
              //   if (!Boolean(await SEA.verify(headers.authorization, users[headers['x-logout']].check.pub))) {
              //     return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('either user is not logged in, or you are not verified')] }
              //   } else {
              //     users[headers['x-logout']].leave()
              //     delete users[headers['x-logout']]
              //     const useBody = await getBody(body)
              //     mainData = await new Promise((resolve) => {
              //       gun.user().delete(headers['x-delete'], useBody, ack => {
              //         resolve(ack)
              //       })
              //     })
              //     return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify(mainData))] }
              //   }
              // } else {
              //   return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('user is currently logged in')] }
              // }
              return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('user is currently logged in')] }
            } else {
              const useBody = await getBody(body)
              mainData = await new Promise((resolve) => {
                gun.user().delete(headers['x-delete'], useBody, ack => {
                  resolve(ack)
                })
              })
              return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify(mainData))] }
            }
          }
        }
      } else {
        return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('method is not supported')] }
      }
    } catch (e) {
      return { statusCode: 500, headers, data: [e.stack] }
    }
  })

  return fetch
}
