/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');
var path =require('path');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var session = require('express-session');

// create a new express server
var app = express();

var bodyParser =require('body-parser');


//set up configuration

//app.set('view engine', 'ejs');
app.set('view engine', 'ejs');
//app.set('views', __dirname+ '/views');
app.set('views', path.join(__dirname, 'views'));
// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();
app.use(bodyParser.json());
var port = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');
// start server on the specified port and binding host
app.use(cookieParser())
 //new line *****
//app.use(cookieParser());
app.use(session({resave: 'true', saveUninitialized: 'true' , secret: 'keyboard cat'}));
app.use(passport.initialize());
app.use(passport.session()); 
//
//
passport.serializeUser(function(user, done) {
   done(null, user);
}); 

passport.deserializeUser(function(obj, done) {
   done(null, obj);
});         

// VCAP_SERVICES contains all the credentials of services bound to
// this application. For details of its content, please refer to
// the document or sample of each service.  
var services = JSON.parse(process.env.VCAP_SERVICES || "{}");
console.log("***",services.SingleSignOn);
var ssoConfig = services.SingleSignOn[0]; 
var client_id = ssoConfig.credentials.clientId;
var client_secret = ssoConfig.credentials.secret;
var authorization_url = ssoConfig.credentials.authorizationEndpointUrl;
var token_url = ssoConfig.credentials.tokenEndpointUrl;
var issuer_id = ssoConfig.credentials.issuerIdentifier;
var callback_url = 'https://CMIPAngApp.mybluemix.net/auth/sso/callback';        

var OpenIDConnectStrategy = require('passport-idaas-openidconnect').IDaaSOIDCStrategy;
var Strategy = new OpenIDConnectStrategy({
                 authorizationURL : authorization_url,
                 tokenURL : token_url,
                 clientID : client_id,
                 scope: 'openid',
                 response_type: 'code',
                 clientSecret : client_secret,
                 callbackURL : callback_url,
                 skipUserProfile: true,
                 issuer: issuer_id}, 
	function(iss, sub, profile, accessToken, refreshToken, params, done)  {
	         	process.nextTick(function() {
		profile.accessToken = accessToken;
		profile.refreshToken = refreshToken;
		done(null, profile);
         	})
}); 

passport.use(Strategy); 
app.get('/login', passport.authenticate('openidconnect', {})); 
//app.get('/login', passport.authenticate('mytest', {})); 
          
function ensureAuthenticated(req, res, next) {
	if(!req.isAuthenticated()) {
	          	req.session.originalUrl = req.originalUrl;
		res.redirect('/login');
	} else {
		return next();
	}
}
 app.get('/', ensureAuthenticated, function(req, res){
       res.render('mytable', {});
 });
 
 
       
      
 //second add line
 app.get('/auth/sso/callback',function(req,res,next) {               
             var redirect_url = req.session.originalUrl;                
             passport.authenticate('openidconnect', {
                     successRedirect: redirect_url,                                
                     failureRedirect: '/failure',                        
          })(req,res,next);
        });
        
        
 app.get('/hello', ensureAuthenticated, function(req, res, next) {
             //res.send('Hello, '+ req.user['id'] + '!'); 
             //res.redirect('/login');
             console.log(req.user);
             res.render('mytest', {
             	user : req.user 
             	});
             	next();
            
   });

 //
 app.get('/failure', function(req, res) { 
             res.send('login failed'); });

app.get('/home', function(req, res){
	res.render('mytable', {});
	
});

app.get('/logout', function(req, res){
	
     console.log(req.logout());
              res.send("you have logout successfully");
                 
      });
//start server on the specified port and binding hostnew
app.listen(appEnv.port, host, function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
/*
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
*/