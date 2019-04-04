const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const Twitter = require('twitter');
const geodist = require('geodist')
const cors = require('cors')({origin : true});
admin.initializeApp(functions.config().firebase);

const client = new Twitter({
    consumer_key: 'xwNrOdgCku5apLJzqohNLxEQi',
    consumer_secret: 'r3FUC3xqx1CcGADreVVTdNuLfuhhRYlOE7gAHj1fjOoxiDU3jH',
    access_token_key: '937584145357619200-oLYU3QbbXXvymCAL6Bff9PRqQRObVDt',
    access_token_secret: 'UbCDUhRm3fVp1ZUOrMhE0dvZC0utlntabQge0o3hnxHLP'
});

const app = express();
app.use(cors);
// /* Express */
exports.api = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        client.get('search/tweets', {q: '%23#Hemato_blood_request',tweet_mode:'extended'}, function (error, tweets, res) {
            if (!error) {
                response.send({ tweets: tweets })
            }
            else {
                response.send({ error: "this is error: " + error })
            }
        });
    });
});
//
exports.deleteTweetById = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
                        client.post('statuses/destroy', {id: request.body.tweetId}, function (error, tweets, res) {
                            if (!error) {
                                console.log(tweets)
                            }
                            else console.log(error)
                        });
                    })
                })


exports.deleteTweet = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        client.get('search/tweets', {q: '%23#Hemato_blood_request',tweet_mode:'extended'}, function (error, tweets, res) {
            if (!error) {
                tweets.statuses.forEach(tweet => {
                     let dateInTweet = tweet.full_text.slice(tweet.full_text.indexOf('Expires at: ')+12, tweet.full_text.indexOf(' -'));
                    var today = new Date();
                     if( (new Date(dateInTweet) < new Date(today.toISOString().substring(0, 10))))
                    {
                        client.post('statuses/destroy', {id: request.body.tweetId}, function (error, tweets, res) {
                            if (!error) {
                                console.log(tweets)
                            }
                            else console.log(error)
                        });
                     }
                })

            }
            else {
                response.send({ error: "this is error: " + error })
            }
        });
    });
});




//
exports.sendNotificationToGroup = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
    var db = admin.firestore();
    var usersRef = db.collection('userProfile');
    var users = usersRef.get()
        .then(snapshot => {
            const payload = {
                notification: {
                    title: 'A person has accepted to donate blood to your request!!',
                    body:  `A person has accepted to donate blood to your request!`,
                    sound: 'default',
                    priority: "high"
                    ,click_action:"FCM_PLUGIN_ACTIVITY"
                },
            };
            snapshot.forEach(doc => {
              if(geodist(doc.data().location, doc.data().location, {limit: 200,unit: 'km'})){
                  admin.messaging().sendToDevice(doc.data().token,payload).catch(error => {
                      console.log("this is the error "+error)
                  })
              }
              else {
                  console.log("out")
              }
            });
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    })
    })



exports.addMessage = functions.https.onRequest((req, res) => {
    let id = 'null'
    let rId = 'null'
    let recipientToken =  'null'
    if(req.body.id){
        id = req.body.id;
        console.log("id:  "+id)
    }
    if(req.body.recipientId){
        recipientToken = req.body.recipientToken
        rId = req.body.recipientId;
        console.log("rId:  "+rId)
    }
    cors(req, res, () => {
        const payload = {
        notification: {
            title: 'A person has accepted to donate blood to your request!!',
            body:  `A person has accepted to donate blood to your request!`,
            sound: 'default',
            priority: "high"
            ,click_action:"FCM_PLUGIN_ACTIVITY"
        },
            data: {
                clientId: id,
                recipientId:rId,
                recipientToken:recipientToken
            }
    };
    const name = req.body.token;
    console.log("this is name:"+ name)
    admin.messaging().sendToDevice(name,payload).then((result) => {
        res.send(result)
    }).catch(error => {
        console.log("this is the error "+error)
    })
    })
});
//https://www.google.com/maps/search/?api=1&query=47.5951518,-122.3316393

//status: `Recipient Email: ${request.body.currentEmail} \n userToken:${request.body.userToken}* \n  place Id ${JSON.stringify(request.body.placeId)};
//URGENT BLOOD REQUEST ~ DONORS NEEDED  \n Recipient Email: ${request.body.currentEmail} \n Blood Transfer Location: ${request.body.hospitalName}  \n Transfer Date: ${request.body.event.month} \n Transfer Time: ${request.body.event.timeStarts} \n
exports.postTweet = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        console.log(JSON.stringify(request.body.userData))
        console.log(JSON.stringify(request.body.userData.location))
        console.log(JSON.stringify(request.body.locationInfo))
        console.log(JSON.stringify(request.body.location))
        console.log(JSON.stringify(request.body))
        console.log("substr "+JSON.stringify(request.body.userData.id.substr(request.body.userData.id.length - 4)))
        console.log("substr2 "+JSON.stringify(request.body.userData.id))
        // \n hospital location: https://www.google.com/maps/search/?api=1&query=${request.body.userData.location._lat},${request.body.userData.location._long}
        client.post('statuses/update/', {status: `Urgently required blood transfer for the following person \n City: ${request.body.locationInfo.locality} \n Blood Group: ${request.body.bloodGroup} \n Expires at: ${request.body.event.month} - ${request.body.event.timeStarts} \n user id:${JSON.stringify(request.body.userData.id.substr(request.body.userData.id.length - 4))}* \n place Id ${JSON.stringify(request.body.placeId.substr(request.body.placeId.length - 4))}; #Hemato_blood_request`}, function (error, tweets, res) {
            if (!error) {
                response.send({tweets: tweets})
            }
            else {
                response.send(JSON.stringify(tweets) + "\n \n this is error " + JSON.stringify(error))
                console.log(error)
            }
        });
    });
});

exports.fetchReplies = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        client.get('search/tweets', {q: '%23#Hemato_blood_response',tweet_mode:'extended'}, function (error, tweets, res) {
            if (!error) {
                response.send({ tweets: tweets })
            }
            else {
                response.send({ error: "this is error: " + error })
            }
        });
    });
});

exports.getReplysForTweetById = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        client.get('search/tweets', {q: '%23#Hemato_blood_response',tweet_mode:'extended'}, function (error, tweets, res) {
            if (!error) {
                    console.log("data " + tweets)
                response.send({ tweets: tweets })
            }
            else {
                response.send({ error: "this is error: " + error })
            }
        });
    });
});
exports.getCompletionTweets = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        client.get('search/tweets', {q: '%23#Hemato_blood_completed',tweet_mode:'extended'}, function (error, tweets, res) {
            if (!error) {
                console.log("data " + tweets)
                response.send({ tweets: tweets })
            }
            else {
                response.send({ error: "this is error: " + error })
            }
        });
    });
});


exports.replyToTweet = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        client.post('statuses/update/', {in_reply_to_status_id:request.body.tweetId,status: `A person has accepted to donate blood to this request! \n place Id ${JSON.stringify(request.body.donorId.substr(request.body.donorId.length - 4))}; #Hemato_blood_response`}, function (error, tweets, res) {
            if (!error) {
                console.log(JSON.stringify(request.body))
                console.log("im in reply" + JSON.stringify(tweets))
                response.send({tweets: tweets})
            }
            else {
                response.send(JSON.stringify(tweets) + "\n \n this is error " + JSON.stringify(error))
                console.log(error)
            }
        });
    });
});


exports.completeDonation = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        if(req.body.otherSide){
            console.log("jam:  "+req.body.otherSide)
        }
        console.log(JSON.stringify(req.body))
        console.log("reply tweetid"+req.body.replyTweetId);
        client.post('statuses/update/', {in_reply_to_status_id:req.body.replyTweetId,status: `blood transfer completed! \n #Hemato_blood_completed`}, function (error, tweets, res) {
            if (!error) {
                console.log("im in reply" + JSON.stringify(tweets))
            }
            else {
                console.log(error)
                res.send(JSON.stringify(tweets) + "\n \n this is error " + JSON.stringify(error))
            }
        });

        const payload = {
            notification: {
                title: 'donation completed!!!',
                body:  `donation completed!!!`,
                sound: 'default',
                priority: "high"
                ,click_action:"FCM_PLUGIN_ACTIVITY"
            }
        };
        let userToken;
        if (req.body.otherSide){
            userToken = req.body.recipientToken;
        }
        else {
             userToken = req.body.token;
        }

        console.log("this is name:"+ req.body.recipientToken)
            admin.messaging().sendToDevice(userToken,payload).then( result => {
                res.send(result)
            }).catch(error => {
                console.log("this is the error "+error)
            })
    })
});