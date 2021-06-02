class ImagesService {
    constructor(log) {
        this.log = log
    }

    addOne(db, patienceId, image) {
        return db.collection('patiences_ctimage').doc(patienceId).collection('images').add({url: image.url}).then(() => {
            return 'success'
        }).catch(err => {
            console.log(err);
            return 'fail'
        });
    }

    setVideoUrlInDatabase(db, patienceId, video_url) {
        return db.collection('patiences_ctimage').doc(patienceId).collection('videos').add({url: video_url}).then(() => {
            return 'success'
        }).catch(err => {
            console.log(err);
            return 'fail'
        });
    }

    getAllImages(db, key) {
        const patiencesInfoRef = db.collection('patiences_ctimage').doc(key).collection('images')
        return patiencesInfoRef.get().then(snapshot => {
            let patiencesInfo = {}
            // let patiencesInfo = []
            snapshot.forEach(doc => {
                patiencesInfo[doc.id] = doc.data()
                //patiencesInfo.push(doc.data())
            })
            return {status: true, dataList: patiencesInfo}
        }).catch(err => {
            return err
        })
    }

    getAllVideos(db, key) {
        const patiencesInfoRef = db.collection('patiences_ctimage').doc(key).collection('videos')
        return patiencesInfoRef.get().then(snapshot => {
            let patiencesInfo = {}
            // let patiencesInfo = []
            snapshot.forEach(doc => {
                patiencesInfo[doc.id] = doc.data()
                //patiencesInfo.push(doc.data())
            })
            return {status: true, dataList: patiencesInfo}
        }).catch(err => {
            return err
        })
    }
}

module.exports = ImagesService