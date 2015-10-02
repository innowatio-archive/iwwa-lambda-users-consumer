import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import * as userConsumer from "index";

chai.use(sinonChai);

describe("`writeToMongo`", function () {

    var mongodb = {
        upsert: sinon.spy()
    };

    var MONGODB_URL = "mongodbUrl";

    beforeEach(function () {
        userConsumer.__Rewire__("mongodb", mongodb);
        userConsumer.__Rewire__("MONGODB_URL", MONGODB_URL);
        process.env.MONGODB_URL = MONGODB_URL;
        mongodb.upsert.reset();
    });

    afterEach(function () {
        userConsumer.__ResetDependency__("mongodb");
        userConsumer.__ResetDependency__("MONGODB_URL");
        userConsumer.__ResetDependency__("VERIFICATION_URL");
    });

    it("upserts the user into mongodb", function () {
        var writeToMongo = userConsumer.__get__("writeToMongo");
        writeToMongo.call({mongodbCollectionName: "users"}, {
            data: {
                element: {
                    key: "value"
                },
                id: "id"
            }
        });
        expect(mongodb.upsert).to.have.been.calledWith({
            url: process.env.MONGODB_URL,
            collectionName: "users",
            query: {
                _id: "id"
            },
            element: {
                _id: "id",
                key: "value"
            }
        });
    });

});

describe("`sendVerificationEmail`", function () {

    var VERIFICATION_URL = "verificationURL";

    var ses = {
        sendEmail: sinon.spy()
    };

    beforeEach(function () {
        userConsumer.__Rewire__("ses", ses);
        userConsumer.__Rewire__("VERIFICATION_URL", VERIFICATION_URL);
        process.env.MONGODB_URL = VERIFICATION_URL;
    });

    afterEach(function () {
        userConsumer.__ResetDependency__("VERIFICATION_URL");
        userConsumer.__ResetDependency__("ses");
    });

    it("send the verification email with correct object", function () {
        var sendVerificationEmail = userConsumer.__get__("sendVerificationEmail");
        sendVerificationEmail(
            {data: {
                element: {
                    services: {
                        email: {
                            verificationTokens: [{
                                address: "test@email.com",
                                token: "token"
                            }]
                        }
                    }
                }
            }
        });
        var expectedObject = {
            Destination: {
                ToAddresses: ["test@email.com"]
            },
            Message: {
                Body: {
                    Text: {
                        Data: "verificationURL/?token=token&email=test@email.com"
                    }
                },
                Subject: {
                    Data: "Verify your email"
                }
            }
        };
        expect(ses.sendEmail).to.be.calledWith(expectedObject);

    });

});
