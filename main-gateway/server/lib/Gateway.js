const axios = require('axios')
var FormData = require('form-data');
const fs = require('fs');
const concat = require('concat-stream');
const streamifier = require('streamifier')

const CircuitBreaker = require('./CircuitBreaker')
const circuitBreaker = new CircuitBreaker()

class GatewayService {
    constructor(log) {
        this.log = log
        this.list = {}
    }

    async forwardGetToService(service, endpoint, argument) {
        const res = await this.getService(service)
        //console.log(res.status)
        //console.log(argument);

        if(argument)
            argument = '/' + argument
        else
            argument = ''

        if (res.status == "error") {
            return ({error: { message: res.result }})
        } else {
            const { ip, port } = res
            return this.callService({
                method: 'get',
                url: `http://${ip}:${port}/${endpoint}${argument}`
            })
        }
    }

    async forwardPostToService(service, endpoint, argument, body){
        const res = await this.getService(service)
        // console.log(res.status)
        if(argument)
            argument = '/' + argument
        else
            argument = ''
        
        if (res.status == "error") {
            return ({error: { message: res.result }})
        } else {
            const { ip, port } = res
            return this.callService({
                method: 'post',
                url: `http://${ip}:${port}/${endpoint}${argument}`,
                data: body
            })
        }
    }

    async forwardPostToServiceMultipartForm(service, endpoint, argument, body, files){
        const res = await this.getService(service)
        // console.log(res.status)
        if(argument)
            argument = '/' + argument
        else
            argument = ''
        
        if (res.status == "error") {
            return ({error: { message: res.result }})
        } else {
            const { ip, port } = res
            var formData = new FormData();

            files.map((file, index) => {
                formData.append("images", fs.createReadStream(file.path))
            })

            for (var key in body ) {
                formData.append(key, body[key]);
            }

            return this.callService({
                method: 'post',
                url: `http://${ip}:${port}/${endpoint}${argument}`,
                data: formData,
                headers: formData.getHeaders()
            })
        }
    }

    async forwardPutToService(service, endpoint, argument, body){
        const res = await this.getService(service)
        // console.log(res.status)
        if(argument)
            argument = '/' + argument
        else
            argument = ''
        
        if (res.status == "error") {
            return ({error: { message: res.result }})
        } else {
            const { ip, port } = res
            return this.callService({
                method: 'put',
                url: `http://${ip}:${port}/${endpoint}${argument}`,
                data: body
            })
        }
    }

    async forwardPutToServiceMultipartForm(service, endpoint, argument, body, files){
        const res = await this.getService(service)
        // console.log(res.status)
        if(argument)
            argument = '/' + argument
        else
            argument = ''
        
        if (res.status == "error") {
            return ({error: { message: res.result }})
        } else {
            const { ip, port } = res
            var formData = new FormData();

            files.map((file, index) => {
                formData.append("images", fs.createReadStream(file.path))
            })

            for (var key in body ) {
                formData.append(key, body[key]);
            }

            return this.callService({
                method: 'put',
                url: `http://${ip}:${port}/${endpoint}${argument}`,
                data: formData,
                headers: formData.getHeaders()
            })
        }
    }

    async getService(serviceName) {
        try {
            const res = await axios.get(`http://localhost:3001/find/${serviceName}/1`)
            return res.data
        } catch (err) {
            return err.response.data
        }
    }

    async callService(reqOptions) {
        return circuitBreaker.callService(reqOptions)
    }
}

module.exports = GatewayService