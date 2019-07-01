// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

var user_name = "Danny";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://humira-helper-d1384.firebaseio.com/',
});

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  /*
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function saveName(agent) {
	const nameParam = agent.parameters.name;
    const name = nameParam;
    agent.add(`Thank you, `+name+`!`);
    //return admin.database().push({name:name});
    return admin.database().ref('/names').push({name: name}).then((snapshot) => {
      console.log('DB write name successful: '+snapshot.ref.toString());
    });
  }
  */
  /*function getNameData(agent) {
    const nameParam = agent.parameters.name;
    const name = nameParam;
    agent.add(`Hey, `+name+`!`);
    //IF name exists in DB:
    return admin.database().ref('/names/'+name).once('value').then((snapshot) => {
      var apptDate = snapshot.child("appt_date").val();
      var med = snapshot.child("med").val();
      var shotDate = snapshot.child("shot_date").val();
      var output = "Your next dose of "+med+" needs to be taken on "+shotDate+". ";
      if(snapshot.child("appt_date").exists()) output+="Your next appointment is on "+apptDate+". ";
      else output+="You have no appointments currently scheduled. ";
      agent.add(output);
      //say "schedule" to sched appt
    });
    //ELSE create new DB entry
    //add physician attribute
}*/

  function getName(agent) {
    user_name = agent.parameters.name;
    agent.add(`Hey, `+user_name+`! What can I help you with?`);
  }

  function checkNotif(agent) {
    return admin.database().ref('/names/'+user_name+"/meds").once('value').then((snapshot) => {
      var meds = [];
      var dates = [];
      snapshot.forEach(function(childSnapshot) {
          var med = childSnapshot.child("name").val()+"";
          meds.push(med.trim());
          var date = childSnapshot.child("shot_date").val()+"";
          dates.push(date.trim());
      });
      var objToday = new Date(),
        dayOfMonth = String(objToday.getDate()).padStart(2, '0'),
        months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'),
        curMonth = months[objToday.getMonth()],
        curYear = objToday.getFullYear();
        var today = curMonth + " " + dayOfMonth + " " + curYear;
      for(var x=0; x<dates.length; x++) {
        if(dates[x]==today) agent.add(`You need to take your `+meds[x]+` injection today. Do you need help with that?`);
      }
    });
  }

  function demo(agent) {
    agent.add(new Card({
         title: `Demonstration video`,
         //imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
         text: `Click the button to play the video!`,
         buttonText: 'Play',
         buttonUrl: 'https://www.youtube.com/watch?v=S-2JD2MRKtc'
       })
     );
  }

  function appoint(agent) {
    return admin.database().ref('/names/'+user_name).once('value').then((snapshot) => {
      var apptDate = snapshot.child("appt_date").val();
      agent.add(`Your next appoinment is, `+apptDate+`. Does this still work for you?`);
    });
  }
  
  function tConvert (time) {
  	// Check correct time format and split into components
  	time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

  	if (time.length > 1) { // If time format correct
    	time = time.slice (1);  // Remove full string match value
    	time[5] = +time[0] < 12 ? ' AM' : ' PM'; // Set AM/PM
    	time[0] = +time[0] % 12 || 12; // Adjust hours
  	}
  	var tempTime = time.join (''); // return adjusted time or original string
    var returnStr = tempTime.substring(0, tempTime.length-6)+" "+tempTime.substring(tempTime.length-2).toLowerCase();
    return returnStr;
  }
  
  function dConvert(date) {
    var year = date.substring(0, 4);
    var monthNum = date.substring(5, 7);
    var day = date.substring(8, 10);
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var month = months[parseInt(monthNum, 10)-1];
    return month+" "+day+" "+year;
  }

  function resched(agent) {
    const dateParam = agent.parameters.date;
    const timeParam = agent.parameters.time;
    var time = tConvert(timeParam);
    var date = dConvert(dateParam);
    agent.add(`Reschedule request submitted. You will receive confirmation from your doctor’s office within 24 hours. Do you have any additional questions today?`);
    return admin.database().ref('/names/'+user_name+"/appt_date").set(date+" at "+time);
  }

  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://assistant.google.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/dialogflow-fulfillment-nodejs/tree/master/samples/actions-on-google
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  //intentMap.set('Default Welcome Intent', welcome);
  //intentMap.set('Default Fallback Intent', fallback);
  //intentMap.set('Get Name', getNameData);
  intentMap.set('Name Getter', getName);
  intentMap.set('Check notification', checkNotif);
  //intentMap.set('Demonstration', demo);
  intentMap.set('Appointment', appoint);
  intentMap.set('Reschedule Yes', resched);
  agent.handleRequest(intentMap);
});