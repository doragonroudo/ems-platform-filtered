const admin = require('firebase-admin');

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

db = admin.firestore();

class DatabaseService {
    constructor(log) {
        this.log = log
        this.list = {
            status: 'success',
            message: 'This is a response from service-another-one'
        }
    }

    getAllPatiences() {
        const patiencesInfoRef = db.collection('patiences_info')
        return patiencesInfoRef.get().then(snapshot => {
            let patiencesInfo = {}
            // let patiencesInfo = []
            snapshot.forEach(doc => {
                patiencesInfo[doc.id] = doc.data()
                patiencesInfo[doc.id].last_seen_normal = {
                    date: this.getFormatDate(doc.data().last_seen_normal.toDate()),
                    time: this.getFormatTime(doc.data().last_seen_normal.toDate())
                }
                patiencesInfo[doc.id].onset = {
                    date: this.getFormatDate(doc.data().onset.toDate()),
                    time: this.getFormatTime(doc.data().onset.toDate())
                }
                //patiencesInfo.push(doc.data())
            })
            return {status: true, dataList: patiencesInfo}
        }).catch(err => {
            return err
        })
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

    databaseFindByKey(key) {
        try {
            const patientInfoRef = db.collection('patiences_info').doc(key)
            return patientInfoRef.get().then(snapshot => {
                if (snapshot.data() == undefined)
                    return new Error('Invalid ID.')
                let info = snapshot.data()
                info.last_seen_normal = {
                    date: this.getFormatDate(info.last_seen_normal.toDate()),
                    time: this.getFormatTime(info.last_seen_normal.toDate())
                }
                info.onset = {
                    date: this.getFormatDate(info.onset.toDate()),
                    time: this.getFormatTime(info.onset.toDate())
                }
                return {status: true, data: info}
            }).catch(err => {
                return err
            })
        } catch(err) {
            return err
        }
    }

    addPatience(data) {
        try {
            const patience = {
                id: data.id,
                name: data.name,
                age: data.age,
                medical_treatment_right: data.medical_treatment_right,
                diagnosis: data.diagnosis,
                sympthom_description: data.sympthom_description,
                congenital_disease: data.congenital_disease,
                last_seen_normal: admin.firestore.Timestamp.fromDate(new Date(data.last_seen_normal.date + " " + data.last_seen_normal.time)),
                onset: admin.firestore.Timestamp.fromDate(new Date(data.onset.date + " " + data.onset.time)),
            };
    
            // console.log(patience);
              
            return db.collection('patiences_info').doc(data.id.toString()).set(patience).then( () => {
                return true
            }).catch(err => {
                console.log(err);
                return err
            });

        } catch (err) {
            log.debug("catched", err);
            return err
        }
    }
}

module.exports = DatabaseService