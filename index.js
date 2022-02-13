const makeFetch = require('make-fetch')
const Gun = require('gun')
const path = require('path')
const fs = require('fs')
require('gun/lib/path')
require('gun/lib/not')
require('gun/lib/unset')

const LIST_OF_URLS = ['https://gun-manhattan.herokuapp.com/gun',
  'https://us-west.xerberus.net/gun',
  'http://gun-matrix.herokuapp.com/gun',
  'https://gun-ams1.maddiex.wtf:443/gun',
  'https://gun-sjc1.maddiex.wtf:443/gun',
  'https://dletta.rig.airfaas.com/gun',
  'https://mg-gun-manhattan.herokuapp.com/gun',
  'https://gunmeetingserver.herokuapp.com/gun',
  'https://e2eec.herokuapp.com/gun',
  'https://gun-us.herokuapp.com/gun',
  'https://gun-eu.herokuapp.com/gun',
  'https://gunjs.herokuapp.com/gun',
  'https://www.raygun.live/gun',
  'https://gun-armitro.herokuapp.com/',
  'https://fire-gun.herokuapp.com/gun']

const STORAGE_FOLDER = path.resolve('./storage')
const DEFAULT_OPTS = {
  peers: LIST_OF_URLS,
  file: STORAGE_FOLDER
}

module.exports = function makeGunFetch (opts = {}) {
  const finalOpts = { ...DEFAULT_OPTS, ...opts }

  const fileLocation = finalOpts.file

  if (fileLocation && (!fs.existsSync(fileLocation))) {
    fs.mkdirSync(fileLocation)
  }

  const gun = Gun(finalOpts)

  const SUPPORTED_METHODS = ['GET', 'PUT', 'DELETE']
  // 'POST', 'PATCH'
  const encodeType = '-'
  const hostType = '_'
  const users = {}

  async function getBody (body) {
    let mainData = ''
    if (body) {
      for await (const data of body) {
        mainData += data
      }
      try {
        mainData = JSON.parse(mainData)
      } catch (error) {
        console.error(error)
      }
    } else {
      mainData = body
    }
    return mainData
  }

  function formatReq (hostname, pathname, method, searching, headers) {
    const mainReq = {}
    mainReq.mainPath = `${hostname}${pathname}`.split('/').filter(Boolean).map(data => { return decodeURIComponent(data) })
    mainReq.multiple = mainReq.mainPath.length > 1
    mainReq.mainHost = mainReq.mainPath.shift()
    mainReq.queryType = mainReq.mainHost[0] === hostType ? mainReq.mainHost[0] : ''
    mainReq.mainHost = mainReq.mainHost.replace(mainReq.queryType, '')
    mainReq.mainPath = mainReq.mainPath.join('.')

    mainReq.makeQuery = null
    mainReq.mainQuery = null
    if (mainReq.queryType) {
      if (mainReq.mainHost) {
        if (mainReq.mainHost.includes('.') || mainReq.mainHost.includes('-') || mainReq.mainHost.includes('_')) {
          mainReq.makeQuery = mainReq.multiple ? gun.get('~' + mainReq.mainHost).path(mainReq.mainPath) : gun.get('~' + mainReq.mainHost)
        } else if (users[mainReq.mainHost]) {
          mainReq.makeQuery = mainReq.multiple ? users[mainReq.mainHost].path(mainReq.mainPath) : users[mainReq.mainHost]
        } else if (!users[mainReq.mainHost]) {
          mainReq.makeQuery = mainReq.multiple ? gun.get('~@' + mainReq.mainHost).path(mainReq.mainPath) : gun.get('~@' + mainReq.mainHost)
        }
        mainReq.mainQuery = true
      } else {
        mainReq.makeQuery = mainReq.mainHost
        mainReq.mainQuery = false
      }
    } else {
      mainReq.makeQuery = mainReq.multiple ? gun.get(mainReq.mainHost).path(mainReq.mainPath) : gun.get(mainReq.mainHost)
      mainReq.mainQuery = true
    }

    mainReq.queryMethod = method
    mainReq.wantReq = headers.accept && headers.accept.includes('text/html')
    mainReq.wantRes = mainReq ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8'
    if (mainReq.queryMethod === 'GET') {
      mainReq.queryAlias = headers['x-alias']
      mainReq.queryNot = headers['x-not'] ? JSON.parse(headers['x-not']) : null
      mainReq.queryPaginate = headers['x-paginate'] ? JSON.parse(headers['x-paginate']) : null
      mainReq.queryReg = !(mainReq.queryNot || mainReq.queryPaginate)
    } else if (mainReq.queryMethod === 'PUT') {
      mainReq.queryCreate = headers['x-create']
      mainReq.queryLogin = headers['x-login']
      mainReq.queryErr = !(mainReq.queryCreate || mainReq.queryLogin)
      mainReq.queryReg = !(headers['x-set'] && JSON.parse(headers['x-set']))
    } else if (mainReq.queryMethod === 'DELETE') {
      mainReq.queryDelete = headers['x-delete']
      mainReq.queryLogout = headers['x-logout']
      mainReq.queryErr = !(mainReq.queryDelete || mainReq.queryLogout)
      mainReq.queryReg = !(headers['x-unset'] && JSON.parse(headers['x-unset']))
    }

    return mainReq
  }

  const fetch = makeFetch(async request => {
    const { url, method, headers, body } = request

    try {
      const { hostname, pathname, protocol, searchParams } = new URL(url)
      let mainHostname = null
      if (hostname && hostname[0] === encodeType) {
        mainHostname = Buffer.from(hostname.slice(1), 'hex').toString('utf-8')
      } else {
        mainHostname = hostname
      }

      if (protocol !== 'gun:' || !method || !SUPPORTED_METHODS.includes(method) || !mainHostname || mainHostname[0] === encodeType || !/^[a-zA-Z0-9-_.]+$/.test(mainHostname)) {
        const reqErr = { statusCode: 400, headers: {}, data: [] }
        if (headers.accept && headers.accept.includes('text/html')) {
          reqErr.data = ['<html><head><title>Gun</title></head><body><p>query is incorrect</p></body></html>']
          reqErr.headers['Content-Type'] = 'text/html; charset=utf-8'
        } else {
          reqErr.data = [JSON.stringify('query is incorrect')]
          reqErr.headers['Content-Type'] = 'application/json; charset=utf-8'
        }
        return reqErr
      }

      const req = formatReq(hostname, pathname, method, searchParams, headers)

      const res = { statusCode: 0, headers: {}, data: [] }
      switch (req.queryMethod) {
        case 'GET': {
          let mainData = null
          if (req.mainQuery) {
            if (req.queryReg) {
              mainData = await new Promise((resolve) => {
                req.makeQuery.once(found => { resolve(found) })
              })
            } else if (req.queryNot) {
              mainData = await Promise.any([
                new Promise((resolve) => {
                  setTimeout(() => { resolve({ found: null, result: false }) }, 5000)
                }),
                new Promise((resolve) => {
                  req.makeQuery.not(found => { resolve({ found, result: true }) })
                })
              ])
            } else if (req.queryPaginate) {
              mainData = await Promise.any([
                new Promise((resolve) => {
                  setTimeout(() => { resolve(undefined) }, 5000)
                }),
                new Promise((resolve) => {
                  req.makeQuery.get(req.queryPaginate).once().map().once(found => { resolve(found) })
                })
              ])
            } else {
              mainData = undefined
            }
            if (mainData !== undefined) {
              res.data = req.wantReq ? [`<html><head><title>Gun</title></head><body><p>${JSON.stringify(mainData)}</p></body></html>`] : [JSON.stringify(mainData)]
              res.statusCode = 200
            } else {
              res.data = req.wantReq ? ['<html><head><title>Gun</title></head><body><p>Data is empty</p></body></html>'] : [JSON.stringify('Data is empty')]
              res.statusCode = 400
            }
            res.headers['Content-Type'] = req.wantRes
          } else {
            if (req.queryAlias) {
              if (users[req.queryAlias]) {
                res.data = req.wantReq ? [`<html><head><title>Gun</title></head><body><p>you are logged in as ${req.queryAlias}</p></body></html>`] : [JSON.stringify(`you are logged in as${req.queryAlias}`)]
                res.statusCode = 200
              } else {
                res.data = req.wantReq ? [`<html><head><title>Gun</title></head><body><p>you are not logged in as ${req.queryAlias}</p></body></html>`] : [JSON.stringify(`you are not logged in as ${req.queryAlias}`)]
                res.statusCode = 400
              }
              res.headers['Content-Type'] = req.wantRes
            } else {
              res.data = req.wantReq ? ['<html><head><title>Gun</title></head><body><p>"x-alias" header was not used</p></body></html>'] : [JSON.stringify('"x-alias" header was not used')]
              res.statusCode = 400
              res.headers['Content-Type'] = req.wantRes
            }
          }
          break
        }

        case 'PUT': {
          let mainData = null
          if (req.mainQuery) {
            if (req.queryReg) {
              const useBody = await getBody(body)
              mainData = await new Promise((resolve) => {
                req.makeQuery.put(useBody).once(found => { resolve(found) })
              })
            } else {
              const useBody = await getBody(body)
              mainData = await new Promise((resolve) => {
                req.makeQuery.set(useBody).once(found => { resolve(found) })
              })
            }
            if (mainData !== undefined) {
              res.data = req.wantReq ? [`<html><head><title>Gun</title></head><body><p>${JSON.stringify(mainData)}</p></body></html>`] : [JSON.stringify(mainData)]
              res.statusCode = 200
            } else {
              res.data = req.wantReq ? ['<html><head><title>Gun</title></head><body><p>Data is empty</p></body></html>'] : [JSON.stringify('Data is empty')]
              res.statusCode = 400
            }
            res.headers['Content-Type'] = req.wantRes
          } else {
            if (req.queryErr) {
              res.data = req.wantReq ? ['<html><head><title>Gun</title></head><body><p>"x-create" or "x-login" header is needed with the alias</p></body></html>'] : [JSON.stringify('"x-create" or "x-login" header is needed with the alias')]
              res.statusCode = 400
              res.headers['Content-Type'] = req.wantRes
            } else if (req.queryCreate) {
              const useBody = await getBody(body)
              if (useBody) {
                mainData = await new Promise((resolve) => {
                  gun.user().create(req.queryCreate, useBody, ack => {
                    resolve(ack)
                  }, { already: false })
                })
                if (mainData.err) {
                  res.statusCode = 400
                  res.headers['Content-Type'] = req.wantRes
                } else {
                  res.statusCode = 200
                  res.headers['Content-Type'] = req.wantRes
                }
                res.data = req.wantReq ? [`<html><head><title>Gun</title></head><body><p>${JSON.stringify(mainData)}</p></body></html>`] : [JSON.stringify(mainData)]
              } else {
                res.data = req.wantReq ? ['<html><head><title>Gun</title></head><body><p>password is needed in the body</p></body></html>'] : [JSON.stringify('password is needed in the body')]
                res.statusCode = 400
                res.headers['Content-Type'] = req.wantRes
              }
            } else if (req.queryLogin) {
              const useBody = await getBody(body)
              if (useBody) {
                if (users[req.queryLogin]) {
                  res.data = req.wantReq ? [`<html><head><title>Gun</title></head><body><p>${JSON.stringify({ err: 'User is currently logged in' })}</p></body></html>`] : [JSON.stringify({ err: 'User is currently logged in' })]
                  res.statusCode = 400
                  res.headers['Content-Type'] = req.wantRes
                } else {
                  users[req.queryLogin] = gun.user()
                  mainData = await new Promise((resolve) => {
                    users[req.queryLogin].auth(body.user, body.pass, ack => {
                      if (ack.err) {
                        resolve(ack)
                      } else {
                        resolve({ soul: ack.soul })
                      }
                    })
                  })
                  if (mainData.err) {
                    // users[body.user].leave()
                    delete users[req.queryLogin]
                    res.statusCode = 400
                    res.headers['Content-Type'] = req.wantRes
                  } else {
                    res.statusCode = 200
                    res.headers['Content-Type'] = req.wantRes
                  }
                  res.data = req.wantReq ? [`<html><head><title>Gun</title></head><body><p>${JSON.stringify(mainData)}</p></body></html>`] : [JSON.stringify(mainData)]
                }
              } else {
                res.data = req.wantReq ? ['<html><head><title>Gun</title></head><body><p>password is needed in the body</p></body></html>'] : [JSON.stringify('password is needed in the body')]
                res.statusCode = 400
                res.headers['Content-Type'] = req.wantRes
              }
            }
          }
          break
        }

        case 'DELETE': {
          let mainData = null
          if (req.mainQuery) {
            if (req.queryReg) {
              mainData = await new Promise((resolve) => {
                req.makeQuery.put(null).once(found => { resolve(found) })
              })
            } else {
              const useBody = await getBody(body)
              mainData = await new Promise((resolve) => {
                req.makeQuery.unset(useBody).once(found => { resolve(found) })
              })
            }
            if (mainData !== undefined) {
              res.data = req.wantReq ? [`<html><head><title>Gun</title></head><body><p>${JSON.stringify(mainData)}</p></body></html>`] : [JSON.stringify(mainData)]
              res.statusCode = 200
            } else {
              res.data = req.wantReq ? ['<html><head><title>Gun</title></head><body><p>Data is empty</p></body></html>'] : [JSON.stringify('Data is empty')]
              res.statusCode = 400
            }
            res.headers['Content-Type'] = req.wantRes
          } else {
            if (req.queryErr) {
              res.data = req.wantReq ? ['<html><head><title>Gun</title></head><body><p>"x-delete" or "x-logout" header is needed with the alias</p></body></html>'] : [JSON.stringify('"x-delete" or "x-logout" header is needed with the alias')]
              res.statusCode = 400
              res.headers['Content-Type'] = req.wantRes
            } else if (req.queryLogout) {
              if (!users[req.queryLogout]) {
                mainData = { err: 'User is not logged in' }
                res.data = req.wantReq ? [`<html><head><title>Gun</title></head><body><p>${JSON.stringify({ err: 'User is not logged in' })}</p></body></html>`] : [JSON.stringify({ err: 'User is not logged in' })]
                res.statusCode = 400
                res.headers['Content-Type'] = req.wantRes
              } else {
                users[req.queryLogout].leave()
                delete users[req.queryLogout]
                res.data = req.wantReq ? [`<html><head><title>Gun</title></head><body><p>${JSON.stringify({ message: 'User has been logged out' })}</p></body></html>`] : [JSON.stringify({ message: 'User has been logged out' })]
                res.statusCode = 200
                res.headers['Content-Type'] = req.wantRes
              }
            } else if (req.queryDelete) {
              const useBody = await getBody(body)
              if (useBody) {
                mainData = await new Promise((resolve) => {
                  gun.user().delete(req.queryDelete, useBody, ack => {
                    resolve(ack)
                  })
                })
                res.data = req.wantReq ? [`<html><head><title>Gun</title></head><body><p>${JSON.stringify(mainData)}</p></body></html>`] : [JSON.stringify(mainData)]
                res.statusCode = 200
                res.headers['Content-Type'] = req.wantRes
              } else {
                res.data = req.wantReq ? ['<html><head><title>Gun</title></head><body><p>password is needed in the body</p></body></html>'] : [JSON.stringify('password is needed in the body')]
                res.statusCode = 400
                res.headers['Content-Type'] = req.wantRes
              }
            }
          }
          break
        }
      }
      return res
    } catch (e) {
      return { statusCode: 500, headers, data: [e.stack] }
    }
  })

  return fetch
}
