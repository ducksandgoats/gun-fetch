const makeFetch = require('make-fetch')
const Gun = require('gun')
require('gun/lib/path')
require('gun/lib/not')
// require('gun/lib/unset')
// require( 'gun-unset' )

// const LIST_OF_URLS = ["https://gun-manhattan.herokuapp.com/gun",
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
// "https://fire-gun.herokuapp.com/gun"]

module.exports = function makeGunFetch(opts = {}){

    const gun = Gun(opts)

    const SUPPORTED_METHODS = ['GET', 'PUT', 'DELETE']
    const GUN_HEADER = {USER: ['ALIAS'], GET: ['NOT'], PUT: [], DELETE: []}

    // X-Auth uses GUN_HEADER.USER
    // X-Gun user all other properties of GUN_HEADER

    const fetch = makeFetch(async request => {

        if(request.url.includes(' ')){
            return new Error('gun url can not contain space')
        }

        const {
            url,
            method,
            headers,
            body
          } = request
          
          try {
            const {
                hostname,
                pathname,
                protocol
              } = new URL(url)

              if(protocol !== 'gun:'){
                  return new Error('invalid protocol, must be gun:')
              }

              if(method === SUPPORTED_METHODS[0]){
                  // get route

                  let mainQuery = null
                  let mainRes = {statusCode: 0, headers: {}, data: null}

                  if(!headers['x-auth']){
                      mainQuery = `${hostname}${pathname}`.split('/').join('.')
                  } else if(headers['x-auth'] === GUN_HEADER.USER[0]){
                      mainQuery = `~@${hostname}${pathname}`.split('/').join('.')
                  } else {
                      mainRes.statusCode = 400
                      mainRes.headers = {}
                      mainRes.data = ['Error with Headers']
                      return mainRes
                  }

                  if(!headers['x-gun']){
                      mainData = await new Promise((resolve) => {
                        gun.path(mainQuery).once(found => {resolve(found)})
                    })
                    
                    mainRes.statusCode = 200
                    mainRes.headers['Content-Type'] = 'application/json; charset=utf-8'
                    mainRes.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                    if(mainRes.data.length){
                        mainRes.headers['Content-Type'] = 'application/json; charset=utf-8'
                    } else {
                        mainRes.headers = {}
                    }
                  } else if(headers['x-gun'] === GUN_HEADER.GET[0]){
                    mainData = await new Promise((resolve) => {
                        gun.path(mainQuery).not(found => {resolve({propkey: found, not: 1})})
                        // if .not() callback does not run after 15 seconds, then setTimeout cuts off the function
                        setTimeout(() => {
                            resolve({propkey: mainQuery.split('.').pop(), not: 0})
                        }, 15000)
                    })

                    mainRes.statusCode = 200
                    mainRes.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                    if(mainRes.data.length){
                        mainRes.headers['Content-Type'] = 'application/json; charset=utf-8'
                    } else {
                        mainRes.headers = {}
                    }
                  } else {
                        mainRes.statusCode = 400
                        mainRes.headers = {}
                        mainRes.data = ['Error with Headers']
                        return mainRes
                  }

                  return mainRes
              } else if(method === SUPPORTED_METHODS[1]){
                  // put route
                let data = await new Promise((resolve) => {
                    gun.path(`${hostname}/${pathname}`.split('/').join('.')).put(body).once(found => {resolve(found)})
                })
                return {statusCode: 200, headers, data: typeof(data) !== 'undefined' ? [JSON.stringify(data)] : []}
              } else if(method === SUPPORTED_METHODS[2]){
                  // delete route
                  let data = await new Promise((resolve) => {
                    gun.path(`${hostname}/${pathname}`.split('/').join('.')).put(null).once(found => {resolve(found)})
                })
                return {statusCode: 200, headers, data: typeof(data) !== 'undefined' ? [JSON.stringify(data)] : []}
              } else {
                return {statusCode: 400, headers, data: []}
              }
          } catch (e) {
                return {statusCode: 500, headers, data: [e.stack]}
          }
    })

    fetch.destroy = () => {
        gun = undefined
    }

    return fetch

    // async function gunFetch({ url, headers: rawHeaders, method, signal, body }){}

}