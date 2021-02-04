const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { url } = require('inspector');
const app = express();
const port = 3000;

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const uri = "mongodb+srv://user_dummy:dummy@ketancluster-rv7sp.gcp.mongodb.net/test?retryWrites=true&w=majority";

let key = '';
let salt = '';
let txnid = '';
let amount = '';
let status = '';
let udf1 = '';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', (req, res) => {
    res.send('Welcome!!!');
 //   updateUserMembership('arihant.one@gmail.com');

});

app.post('/hash', (req, res) => {
    key = req.body.key;
    salt = req.body.salt;
    txnid = req.body.txnid;
    amount = req.body.amount;
    let prodinfo = req.body.prodinfo;
    let fname = req.body.fname;
    let email = req.body.email;
    udf1 = req.body.udf1;
    let hashStr = key + "|" + txnid + "|" + amount + "|" + prodinfo + "|" + fname + "|" + email +  "|" + udf1 + "||||||||||" + salt;
    console.log(hashStr);
    let hash = calcHash(hashStr);
    console.log(hash);
    res.send({"hash": hash});
});

function calcHash(hashStr) {
    let cryp = crypto.createHash('sha512');
    cryp.update(hashStr);
    let hash = cryp.digest('hex');
    return hash;
}

app.post('/response', (req, res) => {
    txnid = req.body.txnid;
    amount = req.body.amount;
    let prodinfo = req.body.productinfo;
    let fname = req.body.firstname;
    let email = req.body.email;
    udf1 = req.body.udf1;
    status = req.body.status;
    let hashStr = salt + "|" + status + "||||||||||" + udf1 + "|" + email + "|" + fname + "|" + prodinfo + "|" + amount + "|" + txnid + "|" + key;
    
    var doc = req.body;
    if(req.body.additionalCharges) {
        let addChrges = req.body.additionalCharges;
        hashStr = addChrges + "|" + hashStr;
    }
    let hash = calcHash(hashStr);
    if(hash == req.body.hash) {
        
        addToDB(doc);
        console.log("Transaction id and Email below :");
        console.log(txnid)
        console.log(email)
        if (status == "success"){
            console.log("Upading use and membership tables");
            updateUserDoc(txnid);
            updateUserMembership(prodinfo,email);

        }
        else {
            console.log("Payment failed");
        }
       
    res.redirect('http://localhost:4200/#/payment-response/Success');
    } else {
        console.log('Failure');
       
    }
});


async function addToDB(insertPaymentRecord){
    console.log('Adding payment details to DB');
    MongoClient.connect(uri,function(err,db){
        if (err) throw err;
        dbo = db.db("legidox_db");
        result = dbo.collection("Payment").insertOne(insertPaymentRecord);
        console.log("Payment created");
        db.close();
       });
   

}
async function updateUserDoc(txnid){
    console.log('Updating user document');
    if (udf1 == "Doc"){
    MongoClient.connect(uri,function(err,db){
        if (err) throw err;
        dbo = db.db("legidox_db");
        var myquery = {"_id": ObjectId(txnid)};
        var newvalues = { $set: {docStatus: "Active"} };
        const resutl = dbo.collection("UserDocuments").updateOne(myquery, newvalues)
        console.log("1 document updated");
        db.close();
       });
    }
    
}

async function updateUserMembership(prodinfo,email){
    console.log('Updating user membership' + prodinfo);
    var myquery = {"userId": email};
    if (prodinfo == "Gold"){
        if (udf1 == "Doc"){
            MongoClient.connect(uri,function(err,db){
                if (err) throw err;
                dbo = db.db("legidox_db");
                var newvalues = { $inc: {docsCreatedinGold: 1} };
                const resutl = dbo.collection("UserMembership").updateOne(myquery, newvalues)
                console.log("Membership table updated");
                db.close();
            });
            
        }
        MongoClient.connect(uri,function(err,db){
            if (err) throw err;
            dbo = db.db("legidox_db");
            var newvalues = { $set: {membershipType: "Gold"} };
            const resutl = dbo.collection("UserMembership").updateOne(myquery, newvalues)
            console.log("Membership table updated");
            db.close();
        });

        

    }
    else {
        MongoClient.connect(uri,function(err,db){
            if (err) throw err;
            dbo = db.db("legidox_db");
            var newvalues = { $inc: {docsCreatedinStandard: 1} };
            const resutl = dbo.collection("UserMembership").updateOne(myquery, newvalues)
            console.log("Membership table updated");
            db.close();
        });

    }
    
       
    
}


app.get('/getResponse', (req, res) => {
    res.send({'status': status, 'txnid': txnid, 'amount': amount});
});

app.listen(port, () => {
    console.log(`App is running on port ${port}`);
});
