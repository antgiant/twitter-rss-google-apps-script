/**
 * Twitter Atom Feeds - Google Apps Script
 *
 * Google Apps Script to use Twitter API v1.1 to create Atom feeds of
 * user's timeline, search results, user's favorites, or Twitter
 * Lists.
 *
 * @author Amit Agarwal <amit@labnol.org>
 * @author Mitchell McKenna <mitchellmckenna@gmail.com>
 */

function start() {
    // Get your Twitter keys from dev.twitter.com/apps
    var CONSUMER_KEY = "YOUR_TWITTER_CONSUMER_KEY";
    var CONSUMER_SECRET = "YOUR_TWITTER_CONSUMER_SECRET";

    initialize(CONSUMER_KEY, CONSUMER_SECRET);
}

function initialize(key, secret) {
    ScriptProperties.setProperty("TWITTER_CONSUMER_KEY", key);
    ScriptProperties.setProperty("TWITTER_CONSUMER_SECRET", secret);

    var url = ScriptApp.getService().getUrl();

    if (url) {
        connectTwitter();

        var msg = "";

        msg += "Sample Atom Feeds for Twitter\n";
        msg += "============================";

        msg += "\n\nTwitter Timeline of user @labnol";
        msg += "\n" + url + "?action=timeline&q=labnol";

        msg += "\n\nTwitter Favorites of user @labnol";
        msg += "\n" + url + "?action=favorites&q=labnol";

        msg += "\n\nTwitter List labnol/friends-in-india";
        msg += "\n" + url + "?action=list&q=labnol/friends-in-india";

        msg += "\n\nTwitter Search for New York";
        msg += "\n" + url + "?action=search&q=new+york";

        msg += "\n\nYou should replace the value of the 'q' parameter in the URLs to the one you want.";
        msg += "\n\nFor help, please refer to https://github.com/MitchellMcKenna/twitter-atom-google-apps-script";

    }
}

function doGet(e) {
    var a ;//= e.parameter.action;
    var q ;//= e.parameter.q;

    var feed;
    var permalink;
    var description;

    switch (a) {
        case "timeline":
            feed = "https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=" + q;
            permalink = "https://twitter.com/" + q;
            description = "Twitter updates from " + q + ".";
            break;
        case "search":
            feed = "https://api.twitter.com/1.1/search/tweets.json?q=" + encodeString (q);
            permalink = "https://twitter.com/search?q=" + encodeString (q);
            description = "Twitter updates from search for: " + q + ".";
            break;
        case "favorites":
            feed = "https://api.twitter.com/1.1/favorites/list.json?screen_name=" + q;
            permalink = "https://twitter.com/" + q + "/favorites/";
            description = "Twitter favorites from " + q + ".";
            break;
        case "list":
            var i = q.split("/");
            feed = "https://api.twitter.com/1.1/lists/statuses.json?slug=" + i[1] + "&owner_screen_name=" + i[0];
            permalink = "https://twitter.com/" + q;
            description = "Twitter updates from " + q + ".";
            break;
        default:
            feed = "https://api.twitter.com/1.1/statuses/home_timeline.json";
            description = "Twitter Home timeline.";
            a = "Home Timeline";
            q = "antgiant";
            permalink = "https://twitter.com/"+q;
            break;
    }

    var id = Utilities.base64Encode(feed);

    var cache = CacheService.getPublicCache();

    var atom   ;//= cache.get(id);

    if (!atom) {
        atom = jsonToatom(feed, permalink, description, a, q);

        cache.put(id, atom, 900);
    }

    return ContentService.createTextOutput(atom)
        .setMimeType(ContentService.MimeType.ATOM);
}


function jsonToatom(feed, permalink, description, type, key) {
    oAuth();

    var options =
    {
        "method": "get",
        "oAuthServiceName":"twitter",
        "oAuthUseToken":"always"
    };

    try {
        var result = UrlFetchApp.fetch(feed, options);

        if (result.getResponseCode() === 200) {
            var tweets = Utilities.jsonParse(result.getContentText());

            if (type == "search") {
                tweets = tweets.statuses;
            }

            if (tweets) {
                var len = tweets.length;

                var atom = "";

                if (len) {
                    var date_now = new Date();
                    atom =  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
                    atom += '  <feed xmlns="http://www.w3.org/2005/Atom">\n';
                    atom += "    <id>" + ScriptApp.getService().getUrl() + "</id>\n";
                    atom += '    <link href="'+ScriptApp.getService().getUrl()+'" rel="self" type="application/atom+xml" />\n';
                    atom += '    <title>Twitter ' + type + ': ' + key + '</title>\n';
                    atom += "    <updated>"+date_now.toRFC3339UTCString()+"</updated>\n";
                    atom += '    <link rel="alternate" type="text/html" href="' + permalink + '" />\n';
                    atom += '    <subtitle>' + description + '</subtitle>\n';

                    for (var i = 0; i < len; i++) {
                      
                        if (typeof tweets[i].retweeted_status != 'undefined') {
                          var tweet = tweets[i].retweeted_status;
                        } else {
                          var tweet = tweets[i];
                        }
                        var sender = tweet.user.screen_name;
                        var sender_name = tweet.user.name;
                        var senderpic = tweet.user.profile_image_url_https;
                        var original_tweet = htmlentities(tweet.text);
                        var display_tweet = tweet.text;
                        var retweets = tweet.retweet_count;
                        var favs = tweet.favorite_count;
                        date = new Date(tweet.created_at);
                        var enclosures = "";
                        var images = "";
                        var embeds = "";
                                           
                       //Parse Tweet for Display
                      if (typeof tweet.entities.hashtags != 'undefined') {
                        for (var j = 0; j < tweet.entities.hashtags.length; j++) {
                          display_tweet = display_tweet.replace("#"+tweet.entities.hashtags[j].text, "<a href='https://twitter.com/search?q=%23"+tweet.entities.hashtags[j].text+"&src=hash'>#" + tweet.entities.hashtags[j].text + "</a>");
                        }
                      }
                      if (typeof tweet.entities.media != 'undefined') {
                        for (j = 0; j < tweet.entities.media.length; j++) {
//                          display_tweet = display_tweet.replace(tweet.entities.media[j].url, "<a href='"+tweet.entities.media[j].expanded_url+"' title='"+tweet.entities.media[j].display_url+"'><img src='"+tweet.entities.media[j].media_url_https+"'></a>");
                          display_tweet = display_tweet.replace(tweet.entities.media[j].url, "<a href='"+tweet.entities.media[j].expanded_url+"'>"+tweet.entities.media[j].display_url+"</a>");
                          var tmp = UrlFetchApp.fetch(tweet.entities.media[j].media_url_https);
                          tmp = tmp.getHeaders();
                          if (typeof tmp["Content-Length"] != 'undefined' && typeof tmp["Content-Type"] != 'undefined') {
                            enclosures += "<link rel='enclosure' href='"+tweet.entities.media[j].media_url_https+"' length='"+tmp["Content-Length"]+"' type='"+tmp["Content-Type"]+"'/>\n";
                          }
                        }
                      }
                      if (typeof tweet.entities.urls != 'undefined') {
                        for (j = 0; j < tweet.entities.urls.length; j++) {
                          display_tweet = display_tweet.replace(tweet.entities.urls[j].url, "<a href='"+tweet.entities.urls[j].url+"' title='"+tweet.entities.urls[j].expanded_url+"'>"+unsortenURL(tweet.entities.urls[j].expanded_url, tweet.entities.urls[j].display_url)+"</a>");
                          embeds += createEmbed(tweet.entities.urls[j].expanded_url);
                        }
                      }
                      if (typeof tweet.entities.user_mentions != 'undefined') {
                        for (j = 0; j < tweet.entities.user_mentions.length; j++) {
                          display_tweet = display_tweet.replace("@"+tweet.entities.user_mentions[j].screen_name, "<a href='https://www.twitter.com/"+tweet.entities.user_mentions[j].screen_name+"' title='"+tweet.entities.user_mentions[j].name+"'>@"+tweet.entities.user_mentions[j].screen_name+"</a>");
                        }
                      }
                      
                        atom += "  <entry>\n";
                        atom += "    <title>" + sender + ": " + original_tweet + "</title>\n";
                        atom += '    <id>https://twitter.com/' + sender + '/statuses/' + tweets[i].id_str + '</id>\n';
                        atom += '    <link rel="alternate" type="text/html" href="https://twitter.com/' + sender + '/statuses/' + tweets[i].id_str + '" />\n';
                        atom += "    <published>" + date.toRFC3339UTCString() + "</published>\n";
                        atom += '    <updated>' + date_now.toRFC3339UTCString() + '</updated>\n';
                        atom += '    <author>\n';
                        atom += '      <name>'+sender_name+' (@'+sender+')</name>\n';
                        atom += '      <uri>https://twitter.com/' + sender + '</uri>\n';
                        atom += '    </author>\n';
                        atom += '    '+enclosures;
                        atom += '    <content type="html">\n';
                        atom += '      <![CDATA[\n';
                        atom += '        <table>\n';
                        if (typeof tweets[i].retweeted_status != 'undefined') {
                          atom += "          <tr>\n";
                          atom += "            <td colspan='2'><a href='https://twitter.com/" + tweets[i].user.screen_name + "'>" + tweets[i].user.name + " (@" + tweets[i].user.screen_name + ") Retweeted</a></td>\n";
                          atom += "          </tr>\n";
                        }
                        atom += "          <tr>\n";
                        atom += "            <td><a href='https://twitter.com/" + sender + "'><img src='"+senderpic+"'></a></td>\n"+
                               "            <td><strong>"+sender_name+"</strong> <a href='https://twitter.com/" + sender + "'>@"+sender+"</a> <br>\n";
                        atom += "                " + display_tweet + "                <br>\n";
                        atom += "                " + retweets+" Retweets | "+favs+" Favorites</td>\n";
                        atom += "          </tr>\n";
                        atom += "        </table>\n";
                        atom += "                " + embeds;
                        atom += "      ]]>\n";
                        atom += "    </content>\n";
                        atom += "  </entry>\n";
                    }

                    atom += "</feed>";

                    return atom;
                }
            }
        }
    } catch (e) {
        Logger.log(e.toString());
    }
}

function connectTwitter() {
    oAuth();

    var search = "https://api.twitter.com/1.1/application/rate_limit_status.json";

    var options =
    {
        "method": "get",
        "oAuthServiceName":"twitter",
        "oAuthUseToken":"always"
    };

    try {
        var result = UrlFetchApp.fetch(search, options);
    } catch (e) {
        Logger.log(e.toString());
    }
}

function unsortenURL(url, defaultDisplayURL) {
	//If no default is passed in use URL
	defaultDisplayURL = typeof defaultDisplayURL !== 'undefined' ? defaultDisplayURL : url;

	//Cache Unshortened URLs for Speed
	var id = Utilities.base64Encode(url);
    var cache = CacheService.getPrivateCache();
    var longURL = cache.get(id);

    if (!temp) {
		longURL = defaultDisplayURL;

		if (url.substring(0,14) == "http://bit.ly/" || url.substring(0,13) == "http://ow.ly/") {
			var z = 0;
			temp = "";
			temp = UrlFetchApp.fetch(url, {"followRedirects":false});
			temp = temp.getHeaders();
			while (typeof temp["Location"] != 'undefined' && z++ < 2) {
			  longURL = temp["Location"];
			  temp = UrlFetchApp.fetch(temp["Location"], {"followRedirects":false});
			  temp = temp.getHeaders();
			}
		}
		longURL = longURL.replace( new RegExp("[^/]*//",""),"");
        cache.put(id, longURL, 21600);
    }

	return longURL;
}

function createEmbed(url) {
	var embeds = "";
	if (url.substring(0,16) == "http://youtu.be/") {
		embeds += '<br>\n<iframe width="560" height="315" src="//www.youtube.com/embed/'+url.substring(16)+'" frameborder="0" allowfullscreen></iframe>\n';
	}
	if (url.substring(0,17) == "http://vimeo.com/") {
		embeds += '<br>\n<iframe width="500" height="281" src="//player.vimeo.com/video/'+url.substring(17)+'" frameborder="0"></iframe>\n';
	}
	if (url.substring(0,23) == "http://instagram.com/p/") {
		embeds += '<br>\n<iframe width="612" height="710" src="//instagram.com/p/'+url.substring(23)+'/embed/" scrolling="no" allowtransparency="true"></iframe>\n';
	}
	if (url.substring(0,13) == "http://fb.me/") {
		embeds += '<iframe name="f2a33898cc" width="500px" height="1000px" frameborder="0" allowtransparency="true" scrolling="no" title="fb:post Facebook Social Plugin" src="https://www.facebook.com/plugins/post.php?app_id=113869198637480&amp;channel=https%3A%2F%2Fs-static.ak.facebook.com%2Fconnect%2Fxd_arbiter%2FwTH8U0osOYl.js%3Fversion%3D40%23cb%3Df29fb9f5a8%26domain%3Ddevelopers.facebook.com%26origin%3Dhttps%253A%252F%252Fdevelopers.facebook.com%252Ff380eee8f8%26relation%3Dparent.parent&amp;href=https%3A%2F%2F'+unsortenURL(url)+'&amp;locale=en_US&amp;sdk=joey&amp;width=500" class="" style="border: none; visibility: visible; width: 500px; height: 909px;"></iframe>';
	}
	return embeds;
}

function encodeString(q) {
    var str = encodeURIComponent(q);
    str = str.replace(/!/g,'%21');
    str = str.replace(/\*/g,'%2A');
    str = str.replace(/\(/g,'%28');
    str = str.replace(/\)/g,'%29');
    str = str.replace(/'/g,'%27');
    return str;
}

function htmlentities(str) {
    str = str.replace(/&/g, "&amp;");
    str = str.replace(/>/g, "&gt;");
    str = str.replace(/</g, "&lt;");
    str = str.replace(/"/g, "&quot;");
    str = str.replace(/'/g, "&#039;");
    return str;
}

function oAuth() {
    var oauthConfig = UrlFetchApp.addOAuthService("twitter");
    oauthConfig.setAccessTokenUrl("https://api.twitter.com/oauth/access_token");
    oauthConfig.setRequestTokenUrl("https://api.twitter.com/oauth/request_token");
    oauthConfig.setAuthorizationUrl("https://api.twitter.com/oauth/authorize");
    oauthConfig.setConsumerKey(ScriptProperties.getProperty("TWITTER_CONSUMER_KEY"));
    oauthConfig.setConsumerSecret(ScriptProperties.getProperty("TWITTER_CONSUMER_SECRET"));
}


/*
 * rfc3339date.js version 0.1.3
 *
 * Adds ISO 8601 / RFC 3339 date parsing to the Javascript Date object.
 * Usage:
 *   var d = Date.parseISO8601( "2010-07-20T15:00:00Z" );
 *   var d = Date.parse( "2010-07-20T15:00:00Z" );
 * Tested for compatibilty/coexistence with:
 *   - jQuery [http://jquery.com]
 *   - datejs [http://www.datejs.com/]
 *
 * Copyright (c) 2010 Paul GALLAGHER http://tardate.com
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 */

/*
 * Number.prototype.toPaddedString
 * Number instance method used to left-pad numbers to the specified length
 * Used by the Date.prototype.toRFC3339XXX methods
 */
Number.prototype.toPaddedString = function(len , fillchar) {
  var result = this.toString();
  if(typeof(fillchar) == 'undefined'){ fillchar = '0' };
  while(result.length < len){ result = fillchar + result; };
  return result;
}

/*
 * Date.prototype.toRFC3339UTCString
 * Date instance method to format the date as ISO8601 / RFC 3339 string (in UTC format).
 * Usage: var d = new Date().toRFC3339UTCString();
 *              => "2010-07-25T11:51:31.427Z"
 * Parameters:
 *  supressFormating : if supplied and 'true', will force to remove date/time separators
 *  supressMillis : if supplied and 'true', will force not to include milliseconds
 */
Date.prototype.toRFC3339UTCString = function(supressFormating , supressMillis){
  var dSep = ( supressFormating ? '' : '-' );
  var tSep = ( supressFormating ? '' : ':' );
  var result = this.getUTCFullYear().toString();
  result += dSep + (this.getUTCMonth() + 1).toPaddedString(2);
  result += dSep + this.getUTCDate().toPaddedString(2);
  result += 'T' + this.getUTCHours().toPaddedString(2);
  result += tSep + this.getUTCMinutes().toPaddedString(2);
  result += tSep + this.getUTCSeconds().toPaddedString(2);
  if((!supressMillis)&&(this.getUTCMilliseconds()>0)) result += '.' + this.getUTCMilliseconds().toPaddedString(3);
  return result + 'Z';
}