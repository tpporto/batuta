var express = require('express');
var tw = require('../twitterlogin');
var router = express.Router();
var pi = require('../personality.js');

// Facebook 

var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var FB = require('fb');
var request = require("request")
var accesstoken="";
var app = require ('../app');
//App para facebook

passport.use(new Strategy({
  clientID: "821548781349833",//process.env.CLIENT_ID,
  clientSecret: "bcd02f7ae7100ac0396df7dde70d54ac",//process.env.CLIENT_SECRET,
  callbackURL: '/login/facebook/return'
  //callbackURL: 'http://localhost:3000/login/facebook/return'
},
function(accessToken, refreshToken, profile, cb) {   
  accesstoken=accessToken;
  //console.log("accessToken: "+accessToken);
  return cb(null, profile);
}));
passport.serializeUser(function(user, cb) {
  cb(null, user);
});
  
passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

/* GET users listing. */
router.get('/twittersucess', function(req, res, next) {
  tw.getAccessToken(req,res);
});

router.get('/', function(req, res, next) {
  res.render('login',{ user: req.user });
});

router.get('/login-twitter', function(req, res, next) {
  tw.requestToken(req,res,next);
});


//Rotas de Login para o Facebook

router.get('/login',
function(req, res){
  res.render('login');
});


router.get('/process',
function(req, res){
  res.render('process');
});

router.get('/facebook',
passport.authenticate('facebook', { scope: 'user_posts' }));

router.get('/facebook/return', 
passport.authenticate('facebook', { failureRedirect: '/login',scope: 'user_posts' }),
function(req, res) {
/*  res.render('wait');
  profile();*/
  //res.redirect('/login/profile');
  //res.redirect('/login/process');
  res.redirect('/quiz');
});

//Variaveis auxiliares
var p = null;
//var itens = {};
texto = '';
qtdPosts = {"lidos":null, "utilizados":null, "caracteres": null};
//itens.contentItems='';
var index = 0;

router.get('/profile',
require('connect-ensure-login').ensureLoggedIn(),
function(req, res, next){
  
  console.log("accesstoken: "+accesstoken);
  FB.setAccessToken(accesstoken); 
  
  FB.api('me', function (res) {
    if(!res || res.error) {
     console.log(!res ? 'error occurred' : res.error);
     return;
    }
    console.log(res.id);
    req.session.nameFB = res.name;
    req.session.save();
    console.log("aq: "+res.name);

  });
  
	FB.api('me', {fields :'id,name,posts'}, function(response) {
					console.log(response.name);
	                //itens.contentItems = '';
	                texto = '';
	                qtdPosts = {"lidos":0, "utilizados":0};
	                var dataStr = "data:application/octet-stream;charset=utf-8," + encodeURIComponent(JSON.stringify(response));
				    p = response.posts.paging.next;
				    getMessages(req, response.posts.data);
				    index++;
				    getPagePost(req,res,response,p);


    });
});

// Fim das rotas do facebook
// Utilitarios para login com FB

    function getMessages(req, posts){
    	
    	for(var i=0;i<posts.length;i++){
		    	  if(posts[i].message){
		    	  	  //var objeto = {};
		    	  	  //objeto.content=posts[i].message;
		    	  	  //objeto.language = "es";
		    	  	  //console.log('post ', posts[i].message);
		    	  	  //itens.contentItems.
		    	  	  texto = texto + posts[i].message + ". ";
		    	  	  console.log('entrou aqui?');
		    	  	  qtdPosts.utilizados++;
		    	  	  console.log(qtdPosts);

		    	  }
    	}
    	//console.log('dentro do get message', texto);
    	//req.session.itens=itens;
    	req.session.itens=texto;
    	
	}
	function getPagePost(req,res,response,p){
			request({
			    url: p,
			    json: true
			}, function (error, response, body) {

			    if (!error && response.statusCode === 200) {
			        //console.log(body.data) // Print the json response
					    getMessages(req, body.data);
					    index++;
					    if(body.paging && texto.length < 7000){
						    p = body.paging.next;
						    console.log('Proxima página de posts');
						    //console.log(body);
						    console.log('Total de caracteres ', texto.length);
						    qtdPosts.lidos = qtdPosts.lidos + Number(body.data.length);
					    	getPagePost(req,res,body,p);
					    }
					    else{
							    //res.render('/pi/match', { req: req.user, posts:JSON.stringify(itens)  });
							    console.log('Entrou no redirecionamento do post');
							    //console.log(itens);
							    //req.session.itens=itens.contentItems;
							    req.session.itens.texto=texto;
							    qtdPosts.caracteres = texto.length;
							    req.session.qtdPosts = qtdPosts;
							    //req.session.save();
							    console.log(qtdPosts.lidos, qtdPosts.utilizados,qtdPosts.caracteres );

							    pi.personalidade(req,res,req.session.itens);
							    //res.redirect("/pi/match");
							    //res.send(itens);
					    }
			    }
			});
			
		
	}
 function getItens(){
 	 return itens;
 }
module.exports = router;