import {SES} from "aws-sdk";
import {promisify} from "bluebird";

var ses = new SES({
    apiVersion: "2010-12-01"
});

export var publish = promisify(ses.sendEmail, ses);
