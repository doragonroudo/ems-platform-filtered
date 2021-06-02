const admin = require('firebase-admin');

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

db = admin.firestore();

class VitalService {
    constructor(log) {
        this.log = log
        this.list = {
            status: 'success',
            message: 'This is a response from service-another-one'
        }
    }

    getPatienceAllVitalSigns(key) {
        try {
            const vitalRef = db.collection('patiences_vitalsign').doc(key)
            return vitalRef.get().then(snapshot => {
                if (snapshot.data() == undefined)
                    return new Error('Invalid ID.')
                if (Object.keys(snapshot.data()).length == 0)
                    return new Error('There is no vital sign data for specified ID.')
                let vital = snapshot.data()
                vital.timestamp = {
                    date: this.getFormatDate(vital.timestamp.toDate()),
                    time: this.getFormatTime(vital.timestamp.toDate())
                }
                return {status: true, data: vital}
            }).catch(err => {
                return err
            })
        } catch(err) {
            return err
        }
    }

    getFormatDate(date) {
        var mm = ('0' + (date.getMonth()+1)).slice(-2)
        var dd = ('0' + date.getDate()).slice(-2)
        var yy = date.getFullYear();
        return yy + '-' + mm + '-' + dd;
    }

    getFormatTime(date) {
        var hh = ("0" + date.getHours()).slice(-2)
        var mm = ("0" + date.getMinutes()).slice(-2) 
        var ss = ("0" + date.getSeconds()).slice(-2)
        return hh + ':' + mm + ':' + ss;
    }

    addVitalSignToPatience(id, data) {
        try {
            const vitalSigns = {
                hr: data.hr,
                spo2: data.spo2,
                nibp: data.nibp,
                timestamp: admin.firestore.Timestamp.fromDate(new Date(data.date + " " + data.time)),
            };
    
            // console.log(patience);
              
            return db.collection('patiences_vitalsign').doc(id).set(vitalSigns, {merge: true}).then( () => {
                return true
            }).catch(err => {
                console.log(err);
                return err
            });
        } catch (err) {
            return err
        }
        
    }

    addTwelveLeadsToPatience(id, data) {
        try {
            // console.log(patience);
              
            return db.collection('patiences_vitalsign').doc(id).set({twelveleads: data.twelveleads}, {merge: true}).then( () => {
                return true
            }).catch(err => {
                console.log(err);
                return err
            });
        } catch (err) {
            return err
        }
        
    }
}

module.exports = VitalService