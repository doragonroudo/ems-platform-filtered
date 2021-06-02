const semver = require('semver')

const admin = require('firebase-admin');

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

db = admin.firestore();

class ServiceRegistry {
    constructor(log) {
        this.log = log
        this.services = {}
        this.timeout = 30 // in seconds
        // STATUS TO DB
        db.collection('services_status').get().then((snapshot) => {
            snapshot.forEach( doc => {
                db.collection('services_status').doc(doc.id).delete()
            })
            this.log.debug(`Database services cleared`)
        })
    }

    get(name, version) {
        this.cleanup()
        const serviceList = Object.values(this.services).filter(service => service.name === name && semver.satisfies(service.version, version))
        // simulate load balancing by picking random satisfied version from the list 
        return serviceList[Math.floor(Math.random() * serviceList.length)]
    }

    register(name, version, ip, port) {
        this.cleanup()
        // generate unique key
        const key = name+version+ip+port
        // if the service is not exist
        if (!this.services[key]) {
            this.services[key] = {}
            this.services[key].timestamp = Math.floor(new Date() / 1000) // unix timestamp in seconds
            this.services[key].ip = ip
            this.services[key].port = port
            this.services[key].name = name
            this.services[key].version = version
            this.log.debug(`Added service ${name}, version ${version} at ${ip}:${port}`)
            // STATUS TO DB
            db.collection('services_status').doc(key).set({
                name: name,
                version: version,
                ip: ip,
                port: port,
                timestamp: admin.firestore.Timestamp.fromDate(new Date())
            })
            return key
        }
        // if the service is already exists
        this.services[key].timestamp = Math.floor(new Date() / 1000) // unix timestamp in seconds
        // STATUS TO DB
        db.collection('services_status').doc(key).set({
            name: name,
            version: version,
            ip: ip,
            port: port,
            timestamp: admin.firestore.Timestamp.fromDate(new Date())
        })
        this.log.debug(`Updated service ${name}, version ${version} at ${ip}:${port}`)
        return key
    }

    unregister(name, version, ip, port) {
        // generate unique key
        const key = name+version+ip+port
        // if the service is not exist
        if (!this.services[key]) {
            return null
        }
        // delete is a reserved word for deleting object within key, its not working with array btw
        delete this.services[key]
        // STATUS TO DB
        db.collection('services_status').doc(key).delete()
        return key
    }

    cleanup() {
        const now = Math.floor(new Date() / 1000)
        Object.keys(this.services).forEach(key => {
            if (this.services[key].timestamp + this.timeout < now) {
                delete this.services[key]
                // STATUS TO DB
                db.collection('services_status').doc(key).delete()
                this.log.debug(`Removed service ${key}`)
            }
        })
    }
}

module.exports = ServiceRegistry