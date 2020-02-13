const chai = require('chai');
const expect = require('chai').expect;
const assert = require("chai").assert;

chai.use(require('chai-http'));

import app from '../src/server'



describe('authentation tests', function () {
    describe('Api endpoint POST /auth/create-user', function () {

        it("should create a new user", function () {
            return chai.request(app)
                .post('/v1/auth/create-user')
                .send({
                    "firstName": "kazem",
                    "lastName": "me",
                    "email": "jib@epicmail.com",
                    "gender":"",
                    "jobRole":"",
                    "password": "12345",
                    "password2": "12345"
                })

                .then(function (res) {
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body.data[0]).to.have.property('token');
                    expect(res.body.data[0]).to.have.property('id');
                })
        })

        it("should all fields are required", function () {
            return chai.request(app)
                .post('/v1/auth/signup')
                .send({
                    "email": null,
                    "firstName": "",
                    "lastName": "",
                    "password": ""
                })
                .then(function (res) {
                    expect(res).to.have.status(400);
                    throw new Error('all fields are required');
                })
                .catch(function (err) {
                    console.log(err.message);
                })

        })
    });
    describe("Api endpoint POST /auth/login", function () {
        it("return login details if user has an account", function () {
            return chai.request(app)
                .post("/v1/auth/login")
                .send({
                    "email": "kazem@epicmail.com",
                    "password": "12345"
                })
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body.data[0]).to.have.property('token');
                    expect(res.body.data[0]).to.have.property('id');
                })
        });

        it("should return status 401 with no data when email/password is wrong", function () {
            return chai.request(app)
                .post("/v1/auth/login")
                .send({
                    "email": "kazem@epicmail.com",
                    "password": ''
                })
                .then(function (res) {
                    expect(res).to.have.status(401)
                })
        })
    });
})


describe("Messages rest apit tests", function () {
    describe("Api endpoint POST /v1/messages", function () {
        it("create a new message with status 201", function () {
            return chai.request(app)
                .post('/v1/messages')
                .send({
                    "from": "alevel7@epicmail.com",
                    "subject": "wisling championship",
                    "message": "win to win the championship",
                    "to": "kazem@epicmail.com"
                })
                .then(function (res) {
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                })
                .catch(function (err) {
                    console.log(err.message);
                })
        })
        it("should return bad request with status 406", function () {
            return chai.request(app)
                .post('/v1/messages')
                .send({
                    "from": null,
                    "subject": "entry cup championship",
                    "message": "win to win the championship",
                    "status": "sent",
                    "to": 2
                })
                .then(function (res) {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;
                })
        })
    })
    describe("Api endpoint GET /v1/messages", function () {
        it("should return all recieved messages", function () {
            return chai.request(app)
                .get("/v1/messages")
                .then(function (res) {
                    expect(res).to.have.status(200);
                })
        })
    })
    describe("Api endpoint GET /v1/messages/unread", function () {
        it("should return all unread messages", function () {
            return chai.request(app)
                .get("/v1/messages/unread")
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body.data).to.be.an('array');
                })
        })
    })
    describe("Api endpoint GET /v1/messages/sent", function () {
        it("should return all sent messages", function () {
            return chai.request(app)
                .get("/v1/messages/sent")
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body.data).to.be.an('array');
                })
        })
    })
    describe("Api endpoint GET /v1/messages/:id", function () {
        it("should return a mail message with :id", function () {
            return chai.request(app)
                .get("/v1/messages/0")
                .then(function (res) {
                    if (typeof (res.body.data) == 'object') {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body).to.be.an('object');
                        expect(res.body).to.have.property('data').with.lengthOf(1)
                    } else {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body).to.be.an('object');
                    }

                })
        })

    })
    describe("Api endpoint DELETE /v1/messages/:id", function () {
        it("should return a deleted mail message with :id", function () {
            return chai.request(app)
                .delete("/v1/messages/0")
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                })
        })

    })
})