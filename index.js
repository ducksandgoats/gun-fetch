const makeFetch = require('make-fetch')
const Gun = require('gun')
require('gun/lib/path')
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

    const SUPPORTED_METHODS = ['HEAD', 'GET', 'PUT', 'PATCH', 'POST', 'DELETE']

    function userPub(hostpath){
        return new Promise((resolve) => {
            gun.user(hostpath).once(done => {resolve(done)})
        })
    }
    function userPath(host, path){
        return new Promise((resolve) => {
            gun.user(host).path(path).once(done => {resolve(done)})
        })
    }
    function userIn(body){
        return new Promise((resolve) => {
            gun.user().create(body.user, body.pass, (ack) => {resolve(ack)})
        })
    }
    function userOut(body){
        return new Promise((resolve) => {
            gun.user().delete(body.user, body.pass, (ack) => {resolve(ack)})
        })
    }
    function userLogin(body){
        return new Promise((resolve) => {
            gun.user().auth(body.user, body.pass, (ack) => {
                resolve(ack)
            })
        })
    }
    function userLogout(hostpath){
        return new Promise((resolve) => {
            gun.user().leave()
            resolve(hostpath)
        })
    }
    function getGun(hostpath){
        return new Promise((resolve) => {
            gun.path(hostpath.split('/').join('.')).once(found => {resolve(found)})
        })
    }
    function setGun(hostpath, data){
        return new Promise((resolve) => {
            gun.path(hostpath.split('/').join('.')).put(data).once(done => {resolve(done)})
        })
    }
    function postGun(hostpath, data){
        return new Promise((resolve) => {
            gun.path(hostpath.split('/').join('.')).put(data).once(done => {resolve(done)})
        })
    }
    function deleteGun(hostpath, data){
        return new Promise((resolve) => {
            gun.path(hostpath.split('/').join('.')).put(data).once(done => {resolve(done)})
        })
    }
    function unsetGun(hostpath, data){
        return new Promise((resolve) => {
            gun.path(hostpath.split('/').join('.')).put(data).once(done => {resolve(done)})
        })
    }

    const fetch = makeFetch(async request => {
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
            //   const hostpath = pathname ? hostname + '/' + pathname : hostname
              if(protocol !== 'gun:'){
                  return new Error('invalid protocol, must be gun:')
              }
              if(method === 'HEAD'){
                //   if(hostname === 'user'){
                //       let data = await headGunUser(pathname)
                //       if(data){
                //         return {statusCode: 200, headers, data: [Buffer.from(JSON.stringify(data), 'utf-8')]}
                //     } else {
                //         return {statusCode: 200, headers, data: []}
                //     }
                //   } else if(hostname === 'in'){
                //       gun.create(body.user, body.pass, body.cb, body.opt)
                //   } else if(hostname === 'login'){
                //       gun.auth(body.user, body.pass, body.cb, body.opt)
                //   } else if(hostname === 'logout'){} else if(hostname === 'out'){} else if(hostname === 'recall'){} else if(hostname === 'alive'){} else if(hostname === 'trust'){} else if(hostname === 'grant'){} else if(hostname === 'secret'){} else if(hostname === 'db'){} else {
                //     return {
                //         // statusCode: 404,
                //         statusCode: 400,
                //         headers,
                //         data: []
                //       }
                //   }
                return {statusCode: 400, headers, data}
              } else if(method === 'GET'){
                  if(hostname === 'user'){
                    let data = await userPub(pathname)
                    if(data){
                        return {statusCode: 200, headers, data: [Buffer.from(JSON.stringify(data), 'utf-8')]}
                    } else {
                        return {statusCode: 200, headers, data: []}
                    }
                  } else if(hostname === 'path'){
                    let data = await userPath(pathname)
                    if(data){
                        return {statusCode: 200, headers, data: [Buffer.from(JSON.stringify(data), 'utf-8')]}
                    } else {
                        return {statusCode: 200, headers, data: []}
                    }
                  } else if(hostname === 'get'){
                        let data = await getGun(pathname)
                        if(data){
                            return {statusCode: 200, headers, data: [Buffer.from(JSON.stringify(data), 'utf-8')]}
                        } else {
                            return {statusCode: 200, headers, data: []}
                        }
                  } else {
                    return {statusCode: 400, headers, data: []}
                  }
              } else if(method === 'DELETE'){
                  if(hostname === 'user'){
                    let data = await userOut(body)
                    return {statusCode: 200, headers, data: [Buffer.from(JSON.stringify(data), 'utf-8')]}
                  } else if(hostname === 'logout'){
                    let data = await userLogout('true')
                    return {statusCode: 200, headers, data: [Buffer.from(JSON.stringify(data), 'utf-8')]}
                  } else if(hostname === 'delete'){
                    let data = await deleteGun(pathname, null)
                    if(data){
                        return {statusCode: 200, headers, data: [Buffer.from(JSON.stringify(data), 'utf-8')]}
                    } else {
                        return {statusCode: 200, headers, data: []}
                    }
                  } else {
                    return {statusCode: 200, headers, data: []}
                  }
                // if(hostname === 'unset'){
                // //     let data = await unsetGun(pathname, body)
                // //     if(data){
                // //       return {statusCode: 200, headers, data: [Buffer.from(JSON.stringify(data), 'utf-8')]}
                // //   } else {
                // //       return {statusCode: 200, headers, data: []}
                // //   }

                // // unset not working right now
                // return {statusCode: 200, headers, data: []}
                //   }
              } else if(method === 'POST'){
                  if(hostname === 'user'){
                    let data = await userIn(body)
                    return {statusCode: 200, headers, data: [Buffer.from(JSON.stringify(data), 'utf-8')]}
                  } else if(hostname === 'login'){
                    let data = await userLogin(body)
                    return {statusCode: 200, headers, data: [Buffer.from(JSON.stringify(data), 'utf-8')]}
                  } else if(hostname === 'create'){
                    let data = await postGun(pathname, body)
                    if(data){
                        return {statusCode: 200, headers, data: [Buffer.from(JSON.stringify(data), 'utf-8')]}
                    } else {
                        return {statusCode: 200, headers, data: []}
                    }
                  } else {
                      return {statusCode: 200, headers, data: []}
                  }
                //   if(hostname === 'set'){
                //       let data = await setGun(pathname, body)
                //       if(data){
                //         return {statusCode: 200, headers, data: [Buffer.from(JSON.stringify(data), 'utf-8')]}
                //     } else {
                //         return {statusCode: 200, headers, data: []}
                //     }
                //   }
              }
          } catch (e) {
                return {statusCode: 500, data: [e.stack]}
          }
    })

    fetch.destroy = () => {
        gun = undefined
    }

    return fetch

    // async function gunFetch({ url, headers: rawHeaders, method, signal, body }){}

}