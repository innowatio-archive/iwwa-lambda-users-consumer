import BPromise from "bluebird";
import router from "kinesis-router";
import {merge, partial} from "ramda";
import dotenv from "dotenv";

import * as ses from "./common/ses";
import * as mongodb from "./common/mongodb";

dotenv.load();
var VERIFICATION_URL = process.env.VERIFICATION_URL;
var MONGODB_URL = process.env.MONGODB_URL;

function writeToMongo (event) {
    var {element, id} = event.data;
    return mongodb.upsert({
        url: MONGODB_URL,
        collectionName: "users",
        query: {
            _id: id
        },
        element: merge(element, {
            _id: id
        })
    });
}

function sendVerificationEmail (event) {
    var verificationToken = event.data.element.services.email.verificationTokens[0];
    return ses.sendEmail({
        Destination: {
            ToAddresses: [verificationToken.address]
        },
        Message: {
            Body: {
                Text: {
                    Data: `${VERIFICATION_URL}/?token=${verificationToken.token}&email=${verificationToken.address}`
                }
            },
            Subject: {
                Data: "Verify your email"
            }
        }
    });
}

export var handler = router()
    .on("element inserted in collection users", event => {
        return BPromise.resolve()
            .then(partial(writeToMongo, event))
            .then(partial(sendVerificationEmail, event))
            .catch((e) => {
                console.log(e);
            });
    })
    .on("element replaced in collection users", writeToMongo);
