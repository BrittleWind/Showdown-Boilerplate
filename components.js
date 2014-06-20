/**
 * Components
 * Created by CreaturePhil - https://github.com/CreaturePhil
 *
 * These are custom commands for the server. This is put in a seperate file
 * from commands.js and config/commands.js to not interfere with them.
 * In addition, it is easier to manage when put in a seperate file.
 * Most of these commands depend on core.js.
 *
 * Command categories: General, Staff, Server Management
 *
 * @license MIT license
 */

var fs = require("fs");
var path = require("path");

var components = exports.components = {

    away: 'back',
    back: function (target, room, user, connection, cmd) {
        if (!user.away && cmd.toLowerCase() === 'back') return this.sendReply('You are not set as away.');
        user.away = !user.away;
        user.updateIdentity();
        this.sendReply("You are " + (user.away ? "now" : "no longer") + " away.");
    },

    earnbuck: 'earnmoney',
    earnbucks: 'earnmoney',
    earnmoney: function (target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<strong><u>Ways to earn money:</u></strong><br /><br /><ul><li>Follow <a href="https://github.com/CreaturePhil"><u><b>CreaturePhil</b></u></a> on Github for 5 bucks.</li><li>Star this <a href="https://github.com/CreaturePhil/Showdown-Boilerplate">repository</a> for 5 bucks. If you don\'t know how to star a repository, click <a href="http://i.imgur.com/0b9Mbff.png">here</a> to learn how.</li><li>Participate in and win tournaments.</li><br /><br />Once you done so pm an admin. If you don\'t have a Github account you can make on <a href="https://github.com/join"><b><u>here</b></u></a>.</ul>');
    },

    stafflist: function (target, room, user) {
        var buffer = {
            admins: [],
            leaders: [],
            mods: [],
            drivers: [],
            voices: []
        };

        var staffList = fs.readFileSync(path.join(__dirname, './', './config/usergroups.csv'), 'utf8').split('\n');
        var numStaff = 0;
        var staff;

        var len = staffList.length;
        while (len--) {
            staff = staffList[len].split(',');
            if (staff.length >= 2) numStaff++;
            if (staff[1] === '~') {
                buffer.admins.push(staff[0]);
            }
            if (staff[1] === '&') {
                buffer.leaders.push(staff[0]);
            }
            if (staff[1] === '@') {
                buffer.mods.push(staff[0]);
            }
            if (staff[1] === '%') {
                buffer.drivers.push(staff[0]);
            }
            if (staff[1] === '+') {
                buffer.voices.push(staff[0]);
            }
        }

        buffer.admins = buffer.admins.join(', ');
        buffer.leaders = buffer.leaders.join(', ');
        buffer.mods = buffer.mods.join(', ');
        buffer.drivers = buffer.drivers.join(', ');
        buffer.voices = buffer.voices.join(', ');

        this.popupReply('Administrators:\n--------------------\n' + buffer.admins + '\n\nLeaders:\n-------------------- \n' + buffer.leaders + '\n\nModerators:\n-------------------- \n' + buffer.mods + '\n\nDrivers:\n--------------------\n' + buffer.drivers + '\n\nVoices:\n-------------------- \n' + buffer.voices + '\n\n\t\t\t\tTotal Staff Members: ' + numStaff);
    },

    regdate: function (target, room, user, connection) {
        if (!this.canBroadcast()) return;
        if (!target || target == "." || target == "," || target == "'") return this.parse('/help regdate');
        var username = target;
        target = target.replace(/\s+/g, '');
        var util = require("util"),
            http = require("http");

        var options = {
            host: "www.pokemonshowdown.com",
            port: 80,
            path: "/forum/~" + target
        };

        var content = "";
        var self = this;
        var req = http.request(options, function (res) {

            res.setEncoding("utf8");
            res.on("data", function (chunk) {
                content += chunk;
            });
            res.on("end", function () {
                content = content.split("<em");
                if (content[1]) {
                    content = content[1].split("</p>");
                    if (content[0]) {
                        content = content[0].split("</em>");
                        if (content[1]) {
                            regdate = content[1];
                            data = username + ' was registered on' + regdate + '.';
                        }
                    }
                } else {
                    data = username + ' is not registered.';
                }
                self.sendReplyBox(data);
                room.update();
            });
        });
        req.end();
    },

    atm: 'profile',
    profile: function (target, room, user) {
        if (!this.canBroadcast()) return;
        if (target.length >= 19) return this.sendReply('Usernames are required to be less than 19 characters long.');

        var targetUser = this.targetUserOrSelf(target);

        if (!targetUser) {
            var userId = toId(target);
            var money = Core.profile.money(userId);
            var elo = Core.profile.tournamentElo(userId);
            var about = Core.profile.about(userId);

            if (elo === 1000 && about === 0) {
                return this.sendReplyBox(Core.profile.avatar(false, userId) + Core.profile.name(false, userId) + Core.profile.group(false, userId) + Core.profile.lastSeen(false, userId) + Core.profile.display('money', money) + '<br clear="all">');
            }
            if (elo === 1000) {
                return this.sendReplyBox(Core.profile.avatar(false, userId) + Core.profile.name(false, userId) + Core.profile.group(false, userId) + Core.profile.display('about', about) + Core.profile.lastSeen(false, userId) + Core.profile.display('money', money) + '<br clear="all">');
            }
            if (about === 0) {
                return this.sendReplyBox(Core.profile.avatar(false, userId) + Core.profile.name(false, userId) + Core.profile.group(false, userId) + Core.profile.lastSeen(false, userId) + Core.profile.display('money', money) + Core.profile.display('elo', elo, Core.profile.rank(userId)) + '<br clear="all">');
            }
            return this.sendReplyBox(Core.profile.avatar(false, userId) + Core.profile.name(false, target) + Core.profile.group(false, userId) + Core.profile.display('about', about) + Core.profile.lastSeen(false, userId) + Core.profile.display('money', money) + Core.profile.display('elo', elo, Core.profile.rank(userId)) + '<br clear="all">');
        }

        var money = Core.profile.money(targetUser.userid);
        var elo = Core.profile.tournamentElo(toId(targetUser.userid));
        var about = Core.profile.about(targetUser.userid);

        if (elo === 1000 && about === 0) {
            return this.sendReplyBox(Core.profile.avatar(true, targetUser, targetUser.avatar) + Core.profile.name(true, targetUser) + Core.profile.group(true, targetUser) + Core.profile.lastSeen(true, targetUser) + Core.profile.display('money', money) + '<br clear="all">');
        }
        if (elo === 1000) {
            return this.sendReplyBox(Core.profile.avatar(true, targetUser, targetUser.avatar) + Core.profile.name(true, targetUser) + Core.profile.group(true, targetUser) + Core.profile.display('about', about) + Core.profile.lastSeen(true, targetUser) + Core.profile.display('money', money) + '<br clear="all">');
        }
        if (about === 0) {
            return this.sendReplyBox(Core.profile.avatar(true, targetUser, targetUser.avatar) + Core.profile.name(true, targetUser) + Core.profile.group(true, targetUser) + Core.profile.lastSeen(true, targetUser) + Core.profile.display('money', money) + Core.profile.display('elo', elo, Core.profile.rank(targetUser.userid)) + '<br clear="all">');
        }
        return this.sendReplyBox(Core.profile.avatar(true, targetUser, targetUser.avatar) + Core.profile.name(true, targetUser) + Core.profile.group(true, targetUser) + Core.profile.display('about', about) + Core.profile.lastSeen(true, targetUser) + Core.profile.display('money', money) + Core.profile.display('elo', elo, Core.profile.rank(targetUser.userid)) + '<br clear="all">');
    },

    setabout: 'about',
    about: function (target, room, user) {
        if (!target) return this.parse('/help about');
        if (target.length > 30) return this.sendReply('About cannot be over 30 characters.');

        var now = Date.now();

        if ((now - user.lastAbout) * 0.001 < 30) {
            this.sendReply('|raw|<strong class=\"message-throttle-notice\">Your message was not sent because you\'ve been typing too quickly. You must wait ' + Math.floor(
                (30 - (now - user.lastAbout) * 0.001)) + ' seconds</strong>');
            return;
        }

        user.lastAbout = now;

        target = Tools.escapeHTML(target);
        target = target.replace(/[^A-Za-z\d ]+/g, '');

        var data = Core.stdin('about', user.userid);
        if (data === target) return this.sendReply('This about is the same as your current one.');

        Core.stdout('about', user.userid, target);

        this.sendReply('Your about is now: "' + target + '"');
    },

    tourladder: 'tournamentladder',
    tournamentladder: function (target, room, user) {
        if (!this.canBroadcast()) return;

        if (!target) target = 10;
        if (!/[0-9]/.test(target) && target.toLowerCase() !== 'all') target = -1;

        var ladder = Core.ladder(Number(target));
        if (ladder === 0) return this.sendReply('No one is ranked yet.');

        return this.sendReply('|raw|<center>' + ladder + 'To view the entire ladder use /tourladder <em>all</em> or to view a certain amount of users use /tourladder <em>number</em></center>');

    },

    shop: function (target, room, user) {
        if (!this.canBroadcast()) return;
        return this.sendReplyBox(Core.shop(true));
    },

    buy: function (target, room, user) {
        if (!target) this.parse('/help buy');
        var userMoney = Number(Core.stdin('money', user.userid));
        var shop = Core.shop(false);
        var len = shop.length;
        while (len--) {
            if (target.toLowerCase() === shop[len][0].toLowerCase()) {
                var price = shop[len][2];
                if (price > userMoney) return this.sendReply('You don\'t have enough money for this. You need ' + (price - userMoney) + ' more bucks to buy ' + target + '.');
                Core.stdout('money', user.userid, (userMoney - price));
                if (target.toLowerCase() === 'symbol') {
                    user.canCustomSymbol = true;
                    this.sendReply('You have purchased a custom symbol. You will have this until you log off for more than an hour. You may now use /customsymbol now.');
                    this.parse('/help customsymbol');
                    this.sendReply('If you do not want your custom symbol anymore, you may use /resetsymbol to go back to your old symbol.');
                } else {
                    this.sendReply('You have purchased ' + target + '. Please contact an admin to get ' + target + '.');
                }
                room.add(user.name + ' has bought ' + target + ' from the shop.');
            }
        }
    },

    transferbuck: 'transfermoney',
    transferbucks: 'transfermoney',
    transfermoney: function (target, room, user) {
        if (!target) return this.parse('/help transfermoney');
        if (!this.canTalk()) return;

        if (target.indexOf(',') >= 0) {
            var parts = target.split(',');
            parts[0] = this.splitTarget(parts[0]);
            var targetUser = this.targetUser;
        }

        if (!targetUser) return this.sendReply('User ' + this.targetUsername + ' not found.');
        if (targetUser.userid === user.userid) return this.sendReply('You cannot transfer money to yourself.');
        if (isNaN(parts[1])) return this.sendReply('Very funny, now use a real number.');
        if (parts[1] < 1) return this.sendReply('You can\'t transfer less than one buck at a time.');
        if (String(parts[1]).indexOf('.') >= 0) return this.sendReply('You cannot transfer money with decimals.');

        var userMoney = Core.stdin('money', user.userid);
        var targetMoney = Core.stdin('money', targetUser.userid);

        if (parts[1] > Number(userMoney)) return this.sendReply('You cannot transfer more money than what you have.');

        var b = 'bucks';
        var cleanedUp = parts[1].trim();
        var transferMoney = Number(cleanedUp);
        if (transferMoney === 1) b = 'buck';

        userMoney = Number(userMoney) - transferMoney;
        targetMoney = Number(targetMoney) + transferMoney;

        Core.stdout('money', user.userid, userMoney, function () {
            Core.stdout('money', targetUser.userid, targetMoney);
        });

        this.sendReply('You have successfully transferred ' + transferMoney + ' ' + b + ' to ' + targetUser.name + '. You now have ' + userMoney + ' bucks.');
        targetUser.send(user.name + ' has transferred ' + transferMoney + ' ' + b + ' to you. You now have ' + targetMoney + ' bucks.');
    },

    tell: function (target, room, user) {
        if (!target) return;
        var message = this.splitTarget(target);
        if (!message) return this.sendReply("You forgot the comma.");
        if (user.locked) return this.sendReply("You cannot use this command while locked.");

        message = this.canTalk(message, null);
        if (!message) return this.parse('/help tell');

        if (!global.tells) global.tells = {};
        if (!tells[toId(this.targetUsername)]) tells[toId(this.targetUsername)] = [];
        if (tells[toId(this.targetUsername)].length > 5) return this.sendReply("User " + this.targetUsername + " has too many tells queued.");

        tells[toId(this.targetUsername)].push(Date().toLocaleString() + " - " + user.getIdentity() + " said: " + message);
        return this.sendReply("Message \"" + message + "\" sent to " + this.targetUsername + ".");
    },

    viewtell: 'viewtells',
    viewtells: function (target, room, user, connection) {
        if (user.authenticated && global.tells) {
            var alts = user.getAlts();
            alts.push(user.name);
            alts.map(toId).forEach(function (user) {
                if (tells[user]) {
                    tells[user].forEach(connection.sendTo.bind(connection, room));
                    delete tells[user];
                }
            });
        }
    },

    vote: function (target, room, user) {
        if (!Poll[room.id].question) return this.sendReply('There is no poll currently going on in this room.');
        if (!this.canTalk()) return;
        if (!target) return this.parse('/help vote');
        if (Poll[room.id].optionList.indexOf(target.toLowerCase()) === -1) return this.sendReply('\'' + target + '\' is not an option for the current poll.');

        var ips = JSON.stringify(user.ips);
        Poll[room.id].options[ips] = target.toLowerCase();

        return this.sendReply('You are now voting for ' + target + '.');
    },

    votes: function (target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReply('NUMBER OF VOTES: ' + Object.keys(Poll[room.id].options).length);
    },

    pr: 'pollremind',
    pollremind: function (target, room, user) {
        if (!Poll[room.id].question) return this.sendReply('There is no poll currently going on in this room.');
        if (!this.canBroadcast()) return;
        this.sendReplyBox(Poll[room.id].display);
    },

    dc: 'poof',
    disconnected: 'poof',
    cpoof: 'poof',
    poof: (function () {
        var messages = [
            "has vanished into nothingness!",
            "used Explosion!",
            "fell into the void.",
            "went into a cave without a repel!",
            "has left the building.",
            "was forced to give BlakJack's mom an oil massage!",
            "was hit by Magikarp's Revenge!",
            "ate a bomb!",
            "is blasting off again!",
            "(Quit: oh god how did this get here i am not good with computer)",
            "was unfortunate and didn't get a cool message.",
            "The Immortal accidently kicked {{user}} from the server!",
        ];

        return function (target, room, user) {
            if (target && !this.can('broadcast')) return false;
            if (room.id !== 'lobby') return false;
            var message = target || messages[Math.floor(Math.random() * messages.length)];
            if (message.indexOf('{{user}}') < 0)
                message = '{{user}} ' + message;
            message = message.replace(/{{user}}/g, user.name);
            if (!this.canTalk(message)) return false;

            var colour = '#' + [1, 1, 1].map(function () {
                var part = Math.floor(Math.random() * 0xaa);
                return (part < 0x10 ? '0' : '') + part.toString(16);
            }).join('');

            room.addRaw('<strong><font color="' + colour + '">~~ ' + Tools.escapeHTML(message) + ' ~~</font></strong>');
            user.disconnectAll();
        };
    })(),

    customsymbol: function (target, room, user) {
        if (!user.canCustomSymbol) return this.sendReply('You need to buy this item from the shop to use.');
        if (!target || target.length > 1) return this.parse('/help customsymbol');
        if (target.match(/[A-Za-z\d]+/g) || '‽!+%@\u2605&~#'.indexOf(target) >= 0) return this.sendReply('Sorry, but you cannot change your symbol to this for safety/stability reasons.');
        user.getIdentity = function (roomid) {
            if (!roomid) roomid = 'lobby';
            var name = this.name + (this.away ? " - \u0410\u051d\u0430\u0443" : "");
            if (this.locked) {
                return '‽' + name;
            }
            if (this.mutedRooms[roomid]) {
                return '!' + name;
            }
            var room = Rooms.rooms[roomid];
            if (room.auth) {
                if (room.auth[this.userid]) {
                    return room.auth[this.userid] + name;
                }
                if (room.isPrivate) return ' ' + name;
            }
            return target + name;
        };
        user.updateIdentity();
        user.canCustomSymbol = false;
        user.hasCustomSymbol = true;
    },

    resetsymbol: function (target, room, user) {
        if (!user.hasCustomSymbol) return this.sendReply('You don\'t have a custom symbol.');
        user.getIdentity = function (roomid) {
            if (!roomid) roomid = 'lobby';
            var name = this.name + (this.away ? " - \u0410\u051d\u0430\u0443" : "");
            if (this.locked) {
                return '‽' + name;
            }
            if (this.mutedRooms[roomid]) {
                return '!' + name;
            }
            var room = Rooms.rooms[roomid];
            if (room.auth) {
                if (room.auth[this.userid]) {
                    return room.auth[this.userid] + name;
                }
                if (room.isPrivate) return ' ' + name;
            }
            return this.group + name;
        };
        user.hasCustomSymbol = false;
        user.updateIdentity();
        this.sendReply('Your symbol has been reset.');
    },

    emoticons: 'emoticon',
    emoticon: function (target, room, user) {
        if (!this.canBroadcast()) return;
        var name = [],
            emoticons = [],
            both = [];
        for (var i in Core.emoticons) {
            name.push(i);
        }
        for (var i = 0; i < name.length; i++) {
            emoticons.push(Core.processEmoticons(name[i]));
        }
        for (var i = 0; i < name.length; i++) {
            both.push((emoticons[i] + '&nbsp;' + name[i]));
        }
        this.sendReplyBox('<b><u>List of emoticons:</b></u> <br/><br/>' + both.join(' ').toString());
    },
    
    
    u: 'urbandefine',
    ud: 'urbandefine',
    urbandefine: function (target, room, user) {
        if (!this.canBroadcast()) return;
        if (!target) return this.parse('/help urbandefine')
        if (target > 50) return this.sendReply('Phrase can not be longer than 50 characters.');

        var self = this;
        var options = {
            url: 'http://www.urbandictionary.com/iphone/search/define',
            term: target,
            headers: {
                'Referer': 'http://m.urbandictionary.com'
            },
            qs: {
                'term': target
            }
        };

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var page = JSON.parse(body);
                var definitions = page['list'];
                if (page['result_type'] == 'no_results') {
                    self.sendReplyBox('No results for <b>"' + Tools.escapeHTML(target) + '"</b>.');
                    return room.update();
                } else {
                    if (!definitions[0]['word'] || !definitions[0]['definition']) {
                        self.sendReplyBox('No results for <b>"' + Tools.escapeHTML(target) + '"</b>.');
                        return room.update();
                    }
                    var output = '<b>' + Tools.escapeHTML(definitions[0]['word']) + ':</b> ' + Tools.escapeHTML(definitions[0]['definition']).replace(/\r\n/g, '<br />').replace(/\n/g, ' ');
                    if (output.length > 400) output = output.slice(0, 400) + '...';
                    self.sendReplyBox(output);
                    return room.update();
                }
            }
        }
        request(options, callback);
    },

    def: 'define',
    define: function (target, room, user) {
        if (!this.canBroadcast()) return;
        if (!target) return this.parse('/help define');
        target = toId(target);
        if (target > 50) return this.sendReply('Word can not be longer than 50 characters.');

        var self = this;
        var options = {
            url: 'http://api.wordnik.com:80/v4/word.json/' + target + '/definitions?limit=3&sourceDictionaries=all' +
                '&useCanonical=false&includeTags=false&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5',
        };

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var page = JSON.parse(body);
                var output = '<font color=' + Core.profile.color + '><b>Definitions for ' + target + ':</b></font><br />';
                if (!page[0]) {
                    self.sendReplyBox('No results for <b>"' + target + '"</b>.');
                    return room.update();
                } else {
                    var count = 1;
                    for (var u in page) {
                        if (count > 3) break;
                        output += '(' + count + ') ' + page[u]['text'] + '<br />';
                        count++;
                    }
                    self.sendReplyBox(output);
                    return room.update();
                }
            }
        }
        request(options, callback);
    },

    
    modmsg: 'declaremod',
     moddeclare: 'declaremod',
     declaremod: function (target, room, user) {
         if (!target) return this.sendReply('/declaremod [message] - Also /moddeclare and /modmsg');
         if (!this.can('declare', null, room)) return false;

         if (!this.canTalk()) return false;

         this.privateModCommand('|raw|<div class="broadcast-red"><b><font size=1><i>Private Auth (Driver +) declare from ' + user.name + '<br /></i></font size>' + target + '</b></div>');

         this.logModCommand(user.name + ' mod declared ' + target);
     },
/***************************************
	* League Cards                         *
	***************************************/
    
	revleague: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/ho-oh.gif"><br />' +
    		'<img src="http://i.imgur.com/20cJgVY.png"><br />' +
    		'<b><font color="red">Champion:</font></b> REV Dolphin<br />' +
    		'<a href="http://revivalleague.weebly.com" >Come visit our website.</a><br />' +
		'Looking to challenge us? Click <a href="https://docs.google.com/document/d/16lVLz79XVi2xKEBsw181tG7QGofHOavqPYxOLYpj_fs/edit">here </a>for information on how');
    	},

	chaosleague: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://fc06.deviantart.net/fs71/f/2013/280/3/2/02_by_nurinaki-d6pkya9.png" width="220"><br />' +
                '<img src="http://i.imgur.com/poIZlDR.gif"><br />' +
                '<b><font color=blue>Champion:</font></b> Maskun<br />' +
                '<a href="http://leagueofchaos.weebly.com" >Come visit our website</a>' +
                '<a href="http://leagueofchaos.weebly.com/league-rules.html" >Our Rules</a></center>');
    	},

	diamondleague: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://th05.deviantart.net/fs70/PRE/i/2014/049/6/5/diancie_by_theangryaron-d7718b0.png" height=130">' +
                '<img src="http://i.imgur.com/kUij7Af.gif"><br />' +
                '<b><font color=purple>Champion:</font></b> Champion Yellow<br />' +
                '<a href="diamond-league.weebly.com" >Come visit our website</a><br />' +
                '<a href="http://diamond-league.weebly.com/challenger-rules.html" >Our Rules</a><br />' +
                '<a href="https://docs.google.com/document/d/1m-1Ed1ZuxziA3RdUXvWrvH8oFIGGHfraGhNrua_01WA/edit" >Track your progression with our Badge Sheet </a></center>');
    	},

	/***************************************
	* Trainer Cards                        *
	***************************************/

	kjflame013: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i7.photobucket.com/albums/y251/ProphetZA/Pokemon/445.jpg" width="100">' +
    		'<img src="http://i.imgur.com/zmHW2Kf.gif" width="330">' +
    		'<img src="http://th03.deviantart.net/fs71/PRE/i/2012/348/1/c/venusaur_by_nar447-d5o0dq8.jpg" width="110"><br />' +
    		'<b>Ace:</b> Garchomp & Venusaur<br />' +
    		'Don\’t give up! There\’s no shame in falling down! True shame is to not stand up again!</center>');
    	},

	dating: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i254.photobucket.com/albums/hh108/naten2006/oie_17447500rCQ2IUY_zps9bdc16b7.gif" width="100">' +
                '<font size=5>Dating: Dolph and Mating</font>' +
                '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/blastoise-mega.gif" width="100"><br />' +
                '<img src="https://i.chzbgr.com/maxW500/5616725504/hC9CC4D55/" width="200"><br />' +
                '<font color="blue"> What happens in Dolph\'s car, stays in Dolph\'s car</center>');
        },

	phantom: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/rd18bxe.jpg" width="90">' +
    		'<img src="http://i.imgur.com/Aj8pOcC.png" width="350">' +
    		'<img src="http://i.imgur.com/yvRIWI4.jpg" width="100"><br />' +
    		'<b>Ace:</b> Gliscor<br />' +
    		'Nyanpassu~</center>');
    	},

	bane: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/EhYWxnE.png" width="180">' +
    		'<img src="http://i.imgur.com/kzR8FsJ.gif"><br />' +
    		'<b>Ace:</b> Scolipede<br />' +
    		'Don\'t give up till the fight is over. Never stop BELIEVING.</center>');
    	},

	impwrath: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/Juhmirh.gif" width="150">' +
    		'<img src="http://i.imgur.com/uQClQ0R.gif">' +
    		'<img src="http://i.imgur.com/LiMJIzg.gif" width="160"><br />' +
    		'<b>Ace:</b> Tyrantrum<br />' +
    		'I can clearly see your weakness with my Ultimate Eye.</center>');
    	},

	rhydon: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://img1.wikia.nocookie.net/__cb20130108174955/pokemontowerdefense/images/5/52/Infernape-infernape-23393713-629-354.png" width="100">' +
    		'<img src="http://i.imgur.com/gWvojqo.png" width="350">' +
    		'<img src="http://1.bp.blogspot.com/-jSWkq15P1es/UllXd4KeuqI/AAAAAAAAEDk/Y4qUdehPZY0/s320/MegaCharizardXYSkyBattle.jpg" width="90"><br />' +
    		'<b>Ace:</b> Infernape<br />' +
    		'My blue flames are stronger than my red flames.</center>');
    	},

	zyns: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://oi57.tinypic.com/zl3yae.jpg" width="80">' +
    		'<img src="http://i.imgur.com/qubm9ul.png" width="360">' +
    		'<img src="http://cdn.bulbagarden.net/upload/thumb/2/21/Cher_Roserade.png/250px-Cher_Roserade.png" width="100"><br />' +
    		'<b>Ace:</b> Roserade<br />' +
    		'Don\'t be fooled by the natural beauty of grass it can be dangerous.</center>');
    	},

	volky: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://fc06.deviantart.net/fs71/i/2013/074/d/5/kabutops_pokedoll_art_by_methuselah_alchemist-d5y5ssk.png" width="85">' +
    		'<img src="http://i.imgur.com/WaIV1TW.gif" width="370">' +
    		'<img src="http://fc01.deviantart.net/fs70/f/2011/340/e/3/pokeddex_challenge___kabutops_by_phantos-d4ie1ip.png" width="85"><br />' +
    		'<b>Ace:</b> Pretzelz<br />' +
    		'I didn\'t choose the thung life, the thug life chose me.</center>');
    	},

	jolts: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/excadrill.gif">' +
    		'<img src="http://i.imgur.com/0LvU4dS.gif" width="330">' +
    		'<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/empoleon.gif"><br />' +
    		'<b>Ace:</b> Drill.I.Am<br />' +
    		'THE GLORIOUS EVOLUTION!</center>');
    	},

	fer: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/meloetta.gif">' +
    		'<img src="http://i.imgur.com/tnclC26.png">' +
    		'<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/slowbro.gif"><br />' +
    		'<b>Ace:</b> Mega Medicham<br />' +
    		'People Need Hard Times, and Oppression To Build Psychic Muscles.</center>');
    	},

	zamuil: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/CoCAmqW.jpg" width="160">' +
    		'<img src="http://i.imgur.com/83MwZKE.png">' +
    		'<img src="http://i.imgur.com/WIQDYoS.jpg" width="160"><br />' +
    		'<b>Ace:</b> Verne the Scarfed Jolteon<br />' +
    		'An eye for an eye leaves the whole world blind, a tooth for a tooth and no one will smile.</center>');
    	},

	corroc: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/k63VSUP.jpg" width="160">' +
    		'<img src="http://i.imgur.com/z5b8zp8.gif">' +
    		'<img src="http://i.imgur.com/syCjHHW.png" width="160"><br />' +
    		'<b>Ace:</b> Bisharp<br />' +
    		'Paramore is love. Paramore is life. Hayley Williams is an angel.</center>');
    	},

	kreme: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/JNtuRyG.png" width="150">' +
    		'<img src="http://i.imgur.com/peLCM5N.gif">' +
    		'<img src="http://i.imgur.com/3DMahw6.jpg" width="150"><br />' +
    		'<b>Ace:</b> Dugtrio<br />' +
    		'These hoes ain\'t loyal :I</center>');
    	},

	chansey: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/TVlZQlp.jpg" width="100"><br />' +
    		'<img src="http://i.imgur.com/4D7p44f.gif" width="400"><br />' +
    		'<img src="http://i.imgur.com/dYeGVCZ.png" width="250"><br />' +
    		'<b>Ace:</b> Chansey<br />' +
    		'The Lord and Mascot for the 3rd Chaos League Master.</center>');
    	},

	cam: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/mawile-mega.gif">' +
    		'<img src="http://i.imgur.com/u3HWuly.png">' +
    		'<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/greninja.gif"><br />' +
    		'<b>Ace:</b> Mega-Mawile<br />' +
    		'Stop Wishing, Start Doing.</center>');
    	},

	psyzen: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://th07.deviantart.net/fs70/PRE/i/2013/299/0/6/trainer_sparky_and_gallade_by_sparkytangerine-d6rvqeq.png" width="120">' +
    		'<img src="http://i.imgur.com/ZBWaYKM.png" width="300">' +
    		'<img src="http://th00.deviantart.net/fs71/PRE/i/2013/099/9/d/475___gallade___art_v_2_by_tails19950-d60zw22.png" width="120"><br />' +
    		'<b>Ace:</b> Gallade<br />' +
    		'Always Aim To Break Their Will.</center>');
    	},

	tsunami: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/J2SlSed.gif" width="140">' +
    		'<img src="http://i.imgur.com/tig1vWj.gif" width="260">' +
    		'<img src="http://i.imgur.com/mWUrtx5.gif" width="140"><br />' +
    		'<b>Ace:</b> Mega-Blastoise<br />' +
    		'Only those who will risk going too far can possibly find out how far one can go.</center>');
    	},

	croven: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/y9PCId4.jpg" width="160">' +
    		'<img src="http://i.imgur.com/l71i2O9.gif">' +
    		'<img src="http://i.imgur.com/gtCuVMu.png" width="160"><br />' +
    		'<b>Ace:</b> Togekiss<br />' +
    		'The reason birds can fly and we can\'t is simply because they have perfect faith, for to have faith is to have wings.</center>');
    	},

	crashy: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/LiQcTfm.gif" width="150">' +
    		'<img src="http://i.imgur.com/1MpUyqF.gif">' +
    		'<img src="http://sprites.pokecheck.org/t/102.gif"><br />' +
    		'<b>Ace:</b> Shuckle<br />' +
    		'I live in a world a gray and that allows me to do things other just can\'t do.</center>');
    	},

	boreas: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://24.media.tumblr.com/39fc7c50c9341c27c02ac1f909a03941/tumblr_mikoaxPZ5j1rtatqpo1_500.gif" width="160">' +
    		'<img src="http://i.imgur.com/4I6VAQ5.png">' +
    		'<img src="http://fc05.deviantart.net/fs71/f/2014/017/6/3/tumblr_mz5bj3hlf71qf8rnjo1_500_by_ryanthescooterguy-d72m8ce.gif" width="160"><br />' +
    		'<b>Ace:</b> Weavile<br />' +
    		'I only face steel. -_-</center>');
    	},

	voltaic: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados-shiny/thundurus.gif">' +
    		'<img src="http://i.imgur.com/L34mXCM.gif">' +
    		'<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados-shiny/thundurus-therian.gif"><br />' +
    		'<img src="http://i.imgur.com/OdXXJCa.jpg" width="100"><br />' +
    		'<b>Ace:</b> Mega Ampharos<br />' +
    		'Jack of all trades, Master of none. You\'re still predicting? I\'ve already won.</center>');
    	},

	happy: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="https://i.imgur.com/CDVPctR.jpg" width="170">' +
    		'<img src="http://i.imgur.com/X84XGIY.png">' +
    		'<img src="https://i.imgur.com/7SNMJza.jpg" width="135"><br />' +
    		'<b>Ace:</b> Chansey<br />' +
    		'You are never too old for a Disney movie.</center>');
    	},

	bis: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.wallchan.com/images/mediums/48275.jpg" width="180">' +
    		'<img src="http://i.imgur.com/tuJXsEd.png">' +
    		'<img src="http://i.imgur.com/v9re2RR.jpg" width="100"><br />' +
    		'<b>Ace:</b> Legendary Beasts<br />' +
    		'I\'m the Apex Predator.</center>');
    	},

	naoto: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.twinfinite.net/wp-content/uploads/2012/05/23415-Naoto-546x310.jpg" width="120">' +
    		'<img src="http://i.imgur.com/OjV5Lad.png" width="320">' +
    		'<img src="http://s1.zerochan.net/Shirogane.Naoto.240.1235899.jpg" width="100"><br />' +
    		'<b>Ace:</b> Meloetta<br />' +
    		'That\'s what you get for not knowing your place.</center>');
    	},

	taiyoinferno: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/i5aDCqo.jpg" width="100">' +
                '<img src="http://i.imgur.com/jKhJZ15.png" width="320">' +
                '<img src="http://i.imgur.com/a9eyoRx.jpg" width="110"><br />' +
                '<b>Ace:</b> Charizard<br />' +
                'Be Like Fire No Stances Keep Moving, There Is No Opponent I Fight To Overcome my Weaknesses Like Fire Can Evaporate Or Burn Earth, Water Etc Be Like The Sun My Friend...And Then You Can Beat...Chuck Norris\' A** ..Maybe<br />' +
                '<img src="http://i.imgur.com/Em93ycY.gif" height="80"></center>');
    	},

	razxr: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://fc08.deviantart.net/fs71/f/2014/080/9/8/avalugg_gif_2_by_gloomymyth-d7b51o2.gif">' +
                '<img src="http://i.imgur.com/g7p6FDN.png">' +
                '<img src="http://i.imgur.com/xvXmCYL.png"><br />' +
                '<b>Ace:</b> Avalugg<br />' +
                'Nothing burns like the cold.</center>');
    	},

	kimiko: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/2QMVuIq.jpg" height="180">' +
                '<img src="http://i.imgur.com/IzQgU16.gif"><br />' +
                '<b>Ace:</b> Cinccino<br />' +
                'Sweet as sugar, Cold as ice, Hurt me once, I\'ll break you twice.</center>');
    	},

	queen: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/MAy7w0Q.png" width="120">' +
                '<img src="http://i.imgur.com/1hsdD9E.png">' +
                '<img src="http://i.imgur.com/mFq6t5F.png" width="120"><br />' +
                '<b>Ace:</b> Gyarados & Zapdos<br />' +
                'Uno DOS Tres.</center>');
    	},

	rzl: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/R4dJvQf.gif" width="100">' +
                '<img src="http://i.imgur.com/dmtcGof.png" width="340">' +
                '<img src="http://i.imgur.com/Ihw2Avb.gif" width="100"><br />' +
                '<b>Ace:</b> Sun Glasses Bischeon<br />' +
                'H2O means two of me one of you.</center>');
    	},

	gh0st: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/uN43I4G.gif">' +
                '<img src="http://i.imgur.com/8D11eGK.png">' +
                '<img src="http://i.imgur.com/SZB352x.png" width="100"><br />' +
                '<b>Ace:</b> Mega Gyarados<br />' +
                'Overcome every challenge, don\'t complain about it.</center>');
    	},

	kingslowking: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/FXbPyoJ.gif" width="130">' +
                '<img src="http://i.imgur.com/Nbda726.png" width="280">' +
                '<img src="http://i.imgur.com/O1p29AI.gif" width="130"><br />' +
                '<b>Ace:</b> Slowking<br />' +
                'You...Slowbro?</center>');
    	},

	brutus: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/OfUuEL7.png" width="120">' +
                '<img src="http://i.imgur.com/8FhU113.png">' +
                '<img src="http://i.imgur.com/MsqvSoA.png" width="110"><br />' +
                '<b>Ace:</b> Gardevoir<br />' +
                'Never give up and never surrender. Remember this and you will go far.</center>');
    	},

	orange: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center>I\'ll be on showdown. See you all later. Screw you</center>');
    	},

	scarf: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/kt0BaT7.gif">' +
                '<img src="http://i.imgur.com/MXPbbVK.png">' +
                '<img src="http://i.imgur.com/NNKTX8I.gif"><br />' +
                '<b>Ace:</b> <font color=blue>Excadrill</font><br />' +
                '<font color=blue>Master the cards you have been given than to complain about the cards your oppenent has been dealt, become stronger, believe in yourself young panda.</font></center>');
    },

	cat: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/breloom.gif">' +
                '<img src="http://i.imgur.com/Lzp2Tqc.png" width="380">' +
                '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/excadrill.gif"><br />' +
                '<b>Ace:</b> Breloom<br />' +
                'Sometimes hax and stall annoy the hell out of me, but not when I\'m using it.</center>');
    	},

	zard: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/ogH3V0k.gif">' +
                '<img src="http://i.imgur.com/OVPO6rt.png">' +
                '<img src="http://i.imgur.com/jnlskzT.jpg"><br />' +
                '<b>Ace:</b> Charizard<br />' +
                'Try me biatch.</center>');
    	},

	adipravar: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/xrsKJDk.png" width="100">' +
                '<img src="http://i.imgur.com/yZxwkDq.png">' +
                '<img src="http://i.imgur.com/Ulo2OfQ.png" width="100"><br />' +
                '<b>Ace:</b> Rayquaza<br />' +
                'Never joke be as awesome as Rayquaza.</center>');
    	},

	bloodz: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/OXnvOrf.png" width="80">' +
                '<img src="http://i.imgur.com/svehUu0.gif">' +
                '<img src="http://i.imgur.com/mgokdZJ.gif" width="100"><br />' +
                '<b>Ace:</b> Potato<br />' +
                'They see me haxin\' .. They rage quittin.</center>');
    	},

	ossified: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/UwxGUH3.png" width="130">' +
                '<img src="http://i.imgur.com/3RY1HWg.gif" width="280">' +
                '<img src="http://i.imgur.com/KHapq25.png" width="130"><br />' +
                '<b>Ace:</b> Sableye<br />' +
                'I can\'t resist a good prankster.</center>');
    	},

	acast: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/sableye.gif">' +
        	'<img src="http://i.imgur.com/C5VZ07a.gif">' +
        	'<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/gourgeist.gif"><br />' +
                '<img src="http://i.imgur.com/8MVF1LX.png" height="100"><br />' +
                '<b>Ace:</b> Chandelure<br />' +
                'You can\'t succeed if you don\'t try.</center>');
    	},

	amaan: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/tgNOgxv.png"><br />' +
                '<img src="http://i.imgur.com/PZevDPT.png" height="120">' +
                '<font size="5">Rock On</font>' +
                '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/cloyster.gif"><br />' +
                '<b>Ace:</b> <blink><font color="red">Amaan\'s Crib</font></blink><br />' +
                '<font color="purple">Remind yourself that you and your life is not always perfect</font></center>');
    	},

	lucy: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/hWl4Ltr.jpg"width="80" height="110">' +
    		'<img src="http://i.imgur.com/nSl6dx7.png" width="390">' +
    		'<img src="http://play.pokemonshowdown.com/sprites/xyani/klefki.gif"><br />' +
    		'<b>Ace:</b><blink> Klefki</blink><br />' +
    		'<blink>Just give me a reason, just a little bit\'s enough~.</blink></center>');
    	},

	emelio: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/2NpH7pp.jpg?1" width="140">' +
                '<img src="http://i.imgur.com/8XI7o7S.png">' +
                '<img src="http://i.imgur.com/kysoJOc.jpg?1" width="140"><br />' +
                '<b>Ace:</b> Lucario, Zoroark, Infernape and Lugia<br />' +
                ':D</center>');
    	},

	chaosred: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://play.pokemonshowdown.com/sprites/xyani/dragonite.gif">' +
                '<img src="http://i.imgur.com/5AMGowt.gif" width="320">' +
                '<img src="http://play.pokemonshowdown.com/sprites/xyani/charizard-mega-x.gif" width="140"><br />' +
                '<b>Ace:</b> Lady Killa<br />' +
                'Ain\'t nothing wrong with going down. It\'s STAYING DOWN that\'s WRONG.</center>');
    	},

	ehsanul: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://img1.ak.crunchyroll.com/i/spire2/fec754941ee9bccdb7dd160800fb30131236494917_full.gif" width="140">' +
                '<img src="http://i.imgur.com/iy8diTO.png" width="260">' +
                '<img src="http://www.mytinyphone.com/uploads/users/nightwolve777/320252.gif" width="140"><br />' +
                '<b>Ace:</b> Gogeta<br />' +
                'Power is Everything in Life!</center>');
    	},

	roy: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i1148.photobucket.com/albums/o579/catfight09/GaryRender2Resize_zpsf564d01a.png" width="160">' +
                '<img src="http://i.imgur.com/iW5LGFy.png">' +
                '<img src="http://i1148.photobucket.com/albums/o579/catfight09/tumblr_mbhpnxte2H1ri9pfao1_500_zps85bee4e9.jpg" width="160"><br />' +
                '<b>Ace:</b> Gallade<br />' +
                'Laws only Exist for those who cannot live without clinging to them.</center>');
    	},

	pichu: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/NLto7aD.gif" width="160">' +
                '<img src="http://i.imgur.com/fTPamOT.png">' +
                '<img src="http://i.imgur.com/MO1uOld.gif" width="160"><br />' +
                '<b>Ace:</b> Pichu<br />' +
                'Why don\'t I get a Mega Stone?</center>');
    	},

	kju: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center>King Jong-un doesn\'t really like Trainer Cards.</center>');	
    	},

	hopgod: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/8G2GuGT.jpg" width="110">' +
                '<img src="http://i.imgur.com/TDpeD6Z.gif" width="310">' +
                '<img src="http://i.imgur.com/Tu112Os.jpg" width="110"><br />' +
                '<b>Ace:</b> Diggersby<br />' +
                '<i>I\'m beginning to feel like a Hopgod, Hopgod</i>.</center>');
    	},

	n: 'ucn',
	unovachampionn: 'ucn',
	ucn: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://pldh.net/media/pokemon/conquest/sprite/212.png">' +
		'<img src="http://i.imgur.com/lZwmQZc.gif">' +
		'<img src="http://pldh.net/media/pokemon/gen6/xy-animated/212-mega.gif"><br />' +
		'<b>Ace: <font color=red>Scizor</font><br>' +
		'<font color=red><i>Incoming bullet punch... sike!</i></font></b></center>');
	},

	zerp: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/spewpa-2.gif" height="150" width="150">' +
                '<img src="http://i.imgur.com/JsCCQVP.gif">' +
                '<img src="http://i.imgur.com/K5JLIqD.png" height="106" width="150"><br />' +
                '<b>Ace:</b> Misspells<br />' +
                'Why don\'t you go back to kindergarten and learn how to spell.</center>');
    	},

	qube: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/tsn7dg3.jpg" width="180">' +
                '<img src="http://i.imgur.com/MRfFBvZ.jpg">' +
                '<img src="http://i.imgur.com/aVdJIgw.jpg" width="160"><br />' +
                '<b>Ace:</b> Donald/2Chainz<br />' +
                'Get rekt scrub.</center>');
    	},

	kyo: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://pldh.net/media/pokemon/gen6/xy-animated-shiny/226.gif">' +
                '<img src="http://i.imgur.com/JZUTPTk.gif">' +
                '<img src="http://img.pokemondb.net/sprites/black-white/anim/normal/kyogre.gif"><br />' +
                '<b>Ace:</b> Kyogre\'s Son<br />' +
                'Pride makes us artificial and humility makes us real.</center>');
    	},

	thunder: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/i4G2Dog.jpg?1" width="160">' +
                '<img src="http://i.imgur.com/j9x28oY.gif">' +
                '<img src="http://i.imgur.com/SblN25x.jpg?1" width="150"><br />' +
                '<b>Ace:</b> Conkeldurr<br />' +
                'I didn\'t choose the thug life, the thug life said "I choose you."</center>');
    	},

	leon: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://24.media.tumblr.com/7f9e08d14b2281a4a0798ae2a8a65c58/tumblr_mn219wXLJt1rw2d66o1_500.gif" width="160">' +
                '<img src="http://i.imgur.com/3be35l0.png">' +
                '<img src="http://www.mundoimagenz.com/wp-content/uploads/2014/03/iDbZUsa.jpg" width="160"><br />' +
                '<b>Ace:</b> Hydrigeon<br />' +
                'Winning battles is about making 2 steps forward for each step backwards.</center>');
    	},

	lando: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://th08.deviantart.net/fs71/PRE/i/2013/307/f/5/yanek_the_greninja_by_mercurythewerewulff-d6sxzol.jpg" width="100">' +
                '<img src="http://i.imgur.com/ZjYIE2l.png" width="320">' +
                '<img src="http://i.imgur.com/lm4bTNK.png" width="120"><br />' +
                '<b>Ace:</b> Landorus & Greninja<br />' +
                'If you\'re going through hell, keep going.</center>');
    	},

	kc: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/heatran.gif" width="110">' +
                '<img src="http://i.imgur.com/zUqUdMD.gif" width="320">' +
                '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados-shiny/charizard.gif" width="110"><br />' +
                '<b>Ace:</b> Charizard<br />' +
                'Apply cold water to burn.</center>');
    	},

	oim8: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/avalugg.gif">' +
                '<img src="http://i.imgur.com/Re5zoVx.png">' +
                '<img src="http://lh6.ggpht.com/_lqdCHczppdg/TPeXs21DbgI/AAAAAAAAAGU/rPUp6UsfSsk/shinra2.jpg" height="160"><br />' +
                '<b>Ace:</b> Don\'t forget to hit up the 1v1 room tho. .-.<br />' +
                'Haters will watch you walk on water and say it\'s because he can\'t swim.</center>');
    	},

	wolfwood: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://fc09.deviantart.net/fs70/f/2011/328/c/a/hippowdon_sig_by_supersleuth10-d4h5gl9.png" width="130">' +
                '<img src="http://i.imgur.com/rOEdRQq.png" width="320">' +
                '<img src="http://i981.photobucket.com/albums/ae294/Sora-XIII/Pokemon%20Artwork/450.jpg" width="90" height="90"><br />' +
                '<b>Ace:</b> Hippowdon<br />' +
                'There comes a moment where you realize I don\'t care.</center>');
    	},

	laxus: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/wailord-2.gif">' +
                '<img src="http://i.imgur.com/urkd5XP.gif">' +
                '<img src="http://pldh.net/media/pokemon/gen6/xy-animated-shiny/282-mega.gif"><br />' +
                '<b>Ace:</b> Mega Waifu & Fatass<br />' +
                'Don\'t be surprised if you lose your virginity.</center>');
    	},

	zer0: 'zero',
	zero: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://tinyurl.com/lhjnvro" height="80" width="66">' +
                '<img src="http://i.imgur.com/cgQkJrV.gif">' +
                '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/latios.gif"><br />' +
                '<b>Ace:</b> Latios<br />' +
                'I\'m glad I have your blessing to make children with your sister.</center>');
    	},

	faith: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://img1.wikia.nocookie.net/__cb20101013074316/fireemblem/images/5/52/Eirika_Great_Lord.gif">' +
                '<img src="http://i.imgur.com/TszHs6X.png">' +
                '<img src="http://i.imgur.com/eGn35WC.png" width="180"><br />' +
                '<b>Ace:</b> Keldeo<br />' +
                'Why do we start pointless fights and wars? The more death and destruction that we bring to this world, the less we can take enjoying our time in it.</center>');
    	},

	gard: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://pldh.net/media/pokemon/gen6/xy-animated/282.gif">' +
                '<img src="http://i.imgur.com/cKDD2PX.gif" width="350">' +
                '<img src="http://pldh.net/media/pokemon/gen6/xy-animated/245.gif"><br />' +
                '<b>Ace:</b> Suicune<br />' +
                'Having a negative approach to life just means less disappointments.</center>');
    	},

	calculu: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/xmKhK6S.gif">' +
                '<img src="http://i.imgur.com/7tMA4Pa.png">' +
                '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/landorus.gif"><br />' +
                '<b>Ace:</b> Garchomp<br />' +
                'Losing is a part of life. You just need to get back up and try again.</center>');
    	},

	stfu: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/rE7QRKe.png" width="100">' +
                '<img src="http://i.imgur.com/MDYyJ9Y.png?1" width="300">' +
                '<img src="http://i.imgur.com/cQ9fXks.png" width="100"><br />' +
                'Stop! Just stop talking and leave.</center>');
    	},

	zenith: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/cagJbsh.png"><br />' +
                '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/entei.gif"><br />' +
                '<b>Ace:</b> Entei<br />' +
                'Prometheus gave fire to man, I mastered it.</center>');
    	},

	thugking25: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/z1aGOWt.png">' +
                '<img src="http://i.imgur.com/UcmY8VC.gif">' +
                '<img src="http://i.imgur.com/4tiVnXB.png"><br />' +
                '<b>Ace:</b> BLAZIKEN<br />' +
                'You\'d do well to remember this, Frosties. The only time a Lawyer can cry ... is when it\'s all over.</center>');
    	},

	okguy: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://31.media.tumblr.com/1dc6e9b9576bfd48c4b26bf3658e8c57/tumblr_mqxim5QkxB1r0b2hgo4_400.gif" width="140">' +
                '<img src="http://i.imgur.com/5leebH9.png" width="240">' +
                '<img src="http://37.media.tumblr.com/tumblr_mchhjxVCsE1r8wykko1_500.gif" width="140"><br />' +
                '<b>Ace:</b> Power to the people<br />' +
                'I\'m the spark that makes your idea bright, The same spark that lights the dark, So that you can know your left from your right.</center>');
    	},

	walt: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://25.media.tumblr.com/cb6be2715a6c8520705f1759158f2725/tumblr_mtup02q9Mz1qhd8sao1_500.gif" width="160">' +
                '<img src="http://i.imgur.com/ernBvLL.png">' +
                '<img src="http://fc04.deviantart.net/fs71/f/2014/066/7/8/cam_s_pokesona__porygon2_by_perplexedcam-d79bhgi.png" width="140"><br />' +
                '<b><font color="#990000">Ace:</font></b> <font color="#009900">Bulk</font><br />' +
                'The greatest things come to those who wait. Stop whining and fight.</center>');
    	},

	formula: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://sprites.pokecheck.org/i/485.gif">' +
                '<img src="http://i.imgur.com/9N1zT8M.gif?1" width="390">' +
                '<img src="http://sprites.pokecheck.org/i/423.gif"><br />' +
                '<b>Ace:</b> Heatran<br />' +
                'Math + Pokemon = Quad. Formula.</center>');
    	},

	championnyan: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/YmKDecc.png" width="90">' +
                '<img src="http://i.imgur.com/tGfXtQC.gif" width="340">' +
                '<img src="http://i.imgur.com/iZo6RVm.jpg" width="90"><br />' +
                '<b>Ace:</b> Salamence<br />' +
                'We live to make the impossible possible! That is our focus!</center>');
    	},

	scourage: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/vtlcgj3.gif">' +
                '<img src="http://i.imgur.com/vOiCAz1.gif" width="380">' +
                '<img src="http://i.imgur.com/RKG5tKC.gif"><br />' +
                '<b>Ace:</b> Anything that will cause a slow death<br />' +
                'If you didn\'t want me to stall you to death, you should have said something... I guess it\'s too late now, sit back and enjoy the show.</center>');
    	},

	alpha: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://oi61.tinypic.com/2dc75dy.jpg" width="100">' +
                '<img src="http://i.imgur.com/50APYJL.gif" width="340">' +
                '<img src="http://oi61.tinypic.com/vyqqdy.jpg" width="100"><br />' +
                '<b>Ace:</b> Darmanitan<br />' +
                '50$ down the drain. Happy now?</center>');
    	},

	kaiba: 'mindcrush',
	mindcrush: function(target, room, user, connection, cmd) {
        if (!this.canBroadcast()) return;
        var name = "http://frostserver.no-ip.org:8000/images/kaiba.gif"
        if (cmd == 'mindcrush') name = "http://i.imgur.com/o260t0n.png";

        this.sendReplyBox('<center><img src="http://www.sherv.net/cm/emoticons/rage/steamboat-troll-rage-smiley-emoticon.gif" height="150">' +
                '<img src="'+name+'" width="300">' +
                '<img src="http://i991.photobucket.com/albums/af32/DoubleEdd_3/TrollGun.gif" height="150"><br />' +
                '<b>Ace:</b> Forcing Rage Quits<br />' +
                'I\'d like to see things from your point of view, but I can\'t get my head that far up my ass.</center>');
    	},

	minatokyuubi: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/pEldH.png" width="130">' +
                '<img src="http://i.imgur.com/HkdptoW.png" width="280">' +
                '<img src="http://i.imgur.com/2kqFODU.jpg" width="130"><br />' +
                '<b>Ace:</b> The Yellow Flash<br />' +
                'Quick as Lightning.</center>');
    	},

	ultimate: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/RqtZbc1.gif" width="100">' +
                '<img src="http://i.imgur.com/VtPbIqY.gif" width="310">' +
                '<img src="http://i.imgur.com/HpH5G0T.gif" width="120"><br />' +
                '<b>Ace:</b> Pikachu<br />' +
                'A real warrior doesn\'t dash off in pursuit of the next victory, nor throw a fit when experiencing a loss. A real warrior ponders the next battle.</center>');
    	},

	dusk: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/BvlUF7p.png">' +
                '<img src="http://i.imgur.com/H13dKHl.png">' +
                '<img src="http://i.imgur.com/f4swUOf.gif"><br />' +
                '<b>Ace:</b> Mandibuzz<br />' +
                'I\'m the guy who started the Mandibuzz hate!</center>');
    	},

	nnk: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/5O3tHkV.jpg">' +
                '<img src="http://i.imgur.com/zCMe6ig.png">' +
                '<img src="http://i.imgur.com/QeLlI2I.png"><br />' +
                '<b>Ace:</b> Lucario<br />' +
                'Don\'t give up, the beginning is always the hardest, so let\'s keep on going till the very end.</center>');
    	},

	sol: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/breloom.gif">' +
                '<img src="http://i.imgur.com/qtfKdoF.gif">' +
                '<img src="http://i.imgur.com/u6fgcbx.gif"><br />' +
                '<b>Ace:</b> <font color=blue>Diggersby</font><br />' +
                'Don\'t fking touch my Chicken and Ben\'s Bacon :I</center>');
    	},

	ghast: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/haunter.gif">' +
                '<img src="http://i.imgur.com/FVisHKB.png" width="370">' +
                '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/spiritomb.gif"><br />' +
                '<b>Ace:</b> Gengar<br />' +
                'Lurking through the shadows, haunting your dreams, & creating your nightmares.</center>');
    	},

	czim: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://fc01.deviantart.net/fs70/f/2011/018/3/d/bath_time___aipom_and_porygon2_by_valichan-d37ihw6.png" width="160">' +
                '<img src="http://i.imgur.com/SyQmcOA.png">' +
                '<img src="http://th07.deviantart.net/fs71/PRE/f/2013/055/3/7/donald_duck_lol_by_new_born_magnezone-d5w259t.png" width="160"><br />' +
                '<b>Ace:</b> do /Donald and see for yourself :P<br />' +
                'Ducks rule!</center>');
    	},

	stun: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://37.media.tumblr.com/e890b0bb20d7630e48fad7e067b32a30/tumblr_mtj1fbaHlL1rj4z3ho1_1280.png" height="150"><br />' +
                '<img src="http://i.imgur.com/aa34uv5.gif" width="450">' +
                '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/stunfisk.gif"><br />' +
                '<b>Ace:</b> Stunfisk<br />' +
                'It\'s so evil, it\'s genius!</center>');
    	},

	kozman: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/blastoise-mega.gif" width="80">' +
                '<img src="http://i.imgur.com/J000dbx.png" width="430">' +
                '<img src="http://www.pokestadium.com/pokemon/sprites/img/trainers/5/blackwhite2/126.gif"><br />' +
                '<b>Ace:</b> Blastoise<br />' +
                'If somethings important to you, you\'ll find a way. If not, you\'ll find an excuse.</center>');
    	},

	ghettoghetsis: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/2S9mgmt.png" width="130">' +
                '<img src="http://i.imgur.com/4X5KNXZ.png" width="280">' +
                '<img src="http://i.imgur.com/Vgmaw34.png" width="130"><br />' +
                '<b>Ace:</b> Shuckle<br />' +
                '2ghetto4u.</center>');
    	},

	traven: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/U8LOY74.jpg" width="150">' +
                '<img src="http://i.imgur.com/e8k5FnK.png" width="250">' +
                '<img src="http://i.imgur.com/7CPcZHZ.jpg" width="150"><br />' +
                '<b>Ace:</b> :D<br />' +
                'Introduce a little anarchy, upset the established order, and everything becomes chaos, I\’m an agent of chaos.</center>');
    	},

	cc: 'crazyclown94',
	crazyclown94: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://play.pokemonshowdown.com/sprites/bwani-shiny/medicham.gif">' +
                '<img src="http://i.imgur.com/dceDBHE.gif" width="380">' +
                '<img src="http://i.imgur.com/8BQzKRv.jpg" width="120"><br />' +
                '<b>Ace:</b> Medicham<br />' +
                'Puppies eat waffles for breakfast!</center>');
    	},

	seahutch: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/0hrEwBy.png" height="180">' +
                '<img src="http://i.imgur.com/LYhz5WX.gif">' +
                '<img src="http://i.imgur.com/GcoaLu2.png"><br />' +
                '<b>Ace:</b> Greninja<br />' +
                'A lesson without pain is meaningless. For you cannot gain anything without sacrificing something else in return, but once you have overcome it and made it your own...you will gain an irreplaceable fullmetal heart.</center>');
    	},

	thunderstruck: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/AXS5k3k.jpg" height="80"><br />' +
                '<img src="http://i.imgur.com/YYFLqNU.jpg" width="250" height="80"><br />' +
                '<img src="http://i.imgur.com/NF8AQpA.jpg" width="180" height="80"><br />' +
                '<b>Ace:</b> Stall Scor<br />' +
                '<marquee bgcolor=green scrollamount="5">I wonder how long... How long will I remain anchored at this harbor known as battle? And Then i said COME ON IIIN!!!</marquee></center>');
    	},

	mating: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i254.photobucket.com/albums/hh108/naten2006/oie_1944237QcDokLVq_zps0977c0b9.gif">' +
                '<img src="http://i254.photobucket.com/albums/hh108/naten2006/cooltext1482514275_zps4e7ca2e6.png">' +
                '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/kecleon.gif"><br />' +
                '<b>Aces:</b> Uxie and Kecleon<br />' +
                '<font color=purple>Maten (pronounced Mating): Now and Forever.</font></center>');
    	},

	crypt: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/B0NESFk.jpg?1" width="150">' +
                '<img src="http://i.imgur.com/mCe3Nja.gif" width="240">' +
                '<img src="http://i.imgur.com/TKHoBN7.jpg?1" width="150"><br />' +
                '<font color=blue><i>I have a disease called awesome, you wouldn\'t understand since you don\'t have it.</i></font><br />' +
                '<font color=red><blink><b>Ace:</font></blink></b> <font color=black><blink>Awesomeness</font></blink></center>');
    	},

	boo: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/S8ly3.gif" width="150">' +
                '<img src="http://i.imgur.com/EyMReMo.gif" width="250">' +
                '<img src="http://i.imgur.com/nPsQa20.gif" width="150"><br />' +
                '<b>Ace:</b> GIMMICK<br />' +
                'If you aren\'t playing pokemon, then you aren\'t having any fun.</center>');
    	},

	rangermike: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/PIdZxWs.jpg weigh="190" height="133">' +
                '<img src="http://i.imgur.com/gRqlPCX.gif">' +
                '<img src="http://25.media.tumblr.com/4a60d16096f9d8f68c64ee71562308b1/tumblr_my110cdEsw1rfejkno1_500.gif" weigh="170" height="115"><br />' +
                '<b>Ace:</b> Chatot<br />' +
                'Let me serenade you.</center>');
    	},

	eevee: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/NZAER3B.gif" width="170">' +
                '<img src="http://i.imgur.com/lMqGTh2.gif" width="200">' +
                '<img src="http://i.imgur.com/B1T2oZ2.jpg" width="150" height="170"><br />' +
                '<b>Ace:</b> Eevee<br />' +
                'I will not evolve.</center>');
    	},

	sayshi: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/8XHueuZ.jpg" width="150">' +
                '<img src="http://i.imgur.com/QJzMUIV.png?1" width="270">' +
                '<img src="http://i.imgur.com/bqRqARg.jpg" width="120"><br />' +
                '<b>Ace:</b> Gliscor (damn you sub stall)<br />' +
                'Lead us not into Hell. Just tell us where it is we\’ll find it quite easily Mwahhahahahah #Eric4Life.</center>');
    	},

	falls: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/iW1z5vz.gif" width="150" height="120"><br />' +
                '<img src="http://i.imgur.com/icfZuiY.gif" width="200" height="70"><br />' +
                '<img src="http://i.imgur.com/cSf4QD1.gif" width="180"><br />' +
                '<b>Ace:</b> Logic<br />' +
                'That really puffled my jiggles.</center>');
    	},	
    	
        logicaldomination: 'crowt',
        pan: 'crowt',
        panpawn: 'crowt',     
        crowt: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><div class="infobox"><img src="http://i.imgur.com/BYTR6Fj.gif"  width="80" height="80" align="left">' +
                '<img src="http://i.imgur.com/czMd1X5.gif" border="6" align="center">' +
                '<img src="http://50.62.73.114:8000/avatars/crowt.png" align="right"><br clear="all" /></div>' +
                '<blink><font color="red">~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</font></blink><br />' +
                '<div class="infobox"><b><font color="#4F86F7" size="3">Ace:</font></b> <font color="blue" size="3">G</font><font color="black" size="3">r</font><font color="blue" size="3">e</font><font color="black" size="3">n</font><font color="blue" size="3">i</font><font color="black" size="3">n</font><font color="blue" size="3">j</font><font color="black" size="3">a</font><br />' +
                '<font color="black">"It takes a great deal of <b>bravery</b> to <b>stand up to</b> our <b>enemies</b>, but just as much to stand up to our <b>friends</b>." - Dumbledore</font></center></div>');
        },

	tael: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados-shiny/flygon.gif">' +
                '<img src="https://i.imgur.com/VEXXmGI.gif">' +
                '<img src="https://i.imgur.com/De5Wc6j.png" width="150"><br />' +
                '<b>Ace:</b> Flygon<br />' +
                'Heavenly things are often abstract.</center>');
    	},

	ticken: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/B0gfhrg.png" width="144" height="100">' +
                '<img src="http://i.imgur.com/kyrJhIC.gif?1?8517" width="280">' +
                '<img src="http://25.media.tumblr.com/b4f01fca213952c519a54358e651992f/tumblr_mibltiuCaA1rtatqpo1_500.gif" width="120"><br />' +
                '<b>Ace:</b> Lotad<br />' +
                'Lost time is never found again...</center>');
    	},

	cnorth: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/scrafty.gif">' +
                '<img src="http://i.imgur.com/MhZBJDV.png">' +
                '<img src="http://i.imgur.com/QF55Hcl.gif?1 width=150"><br />' +
                '<b>Ace:</b> Scrafty<br />' +
                '<a href="http://replay.pokemonshowdown.com/frost-oumonotype-29810">FUCKING HITMONLEE.</a></center>');
    	},

	spec: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://livedoor.blogimg.jp/pokelog2ch/imgs/4/6/46668e86.png" width="300" height="200"><br />' +
                '<img src="http://i.imgur.com/Y88oEBG.gif"><br />' +
                '<b>Ace:</b> FlameBird<br />' +
                'Faith is the bird that feels the light when the dawn is still dark.</center>');
    	},

	primm: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/SLsamNo.png?1">' +
                '<img src="http://i.imgur.com/ziTxZ58.gif">' +
                '<img src="http://i.imgur.com/356yMIq.gif" width="150" height="150"><br />' +
                '<b>Ace:</b> Volcarona<br />' +
                'Chicken?! Where?!</center>');
    	},

	slim: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/Y8u3RAN.png"><br />' +
                '<b>Ace:</b> Scolipede<br />' +
                'Why be a King When you can be a God.</center>');
    	},

	mac: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/1jVxQY2.png" width="140">' +
    		'<img src="http://i.imgur.com/LLFGr9y.png">' +
    		'<img src="http://i.imgur.com/7vTltT9.png" width="140"><br />' +
    		'<b>Ace:</b> <font color="green">Kecleon</font><br />' +
    		'<font color=#ff0000">Y</font><font color=#ff2100">o</font><font color=#ff4200">u</font><font color=#ff6300">\'</font><font color=#ff8500">l</font><font color=#ffa600">l</font> ' +
    		'<font color=#ffe800">N</font><font color=#f3ff00">e</font><font color=#d2ff00">v</font><font color=#b1ff00">e</font><font color=#90ff00">r</font> ' +
    		'<font color=#4dff00">F</font><font color=#2cff00">i</font><font color=#0bff00">n</font><font color=#00ff16">d</font> ' +
    		'<font color=#00ff58">A</font><font color=#00ff79">n</font><font color=#00ff9b">y</font><font color=#00ffbc">o</font><font color=#00ffdd">n</font><font color=#00feff">e</font> ' +
    		'<font color=#00bcff">M</font><font color=#009bff">o</font><font color=#0079ff">r</font><font color=#0058ff">e</font> ' +
    		'<font color=#0016ff">F</font><font color=#0b00ff">a</font><font color=#2c00ff">b</font><font color=#4d00ff">u</font><font color=#6e00ff">l</font><font color=#9000ff">o</font><font color=#b100ff">u</font><font color=#d200ff">s</font> ' +
    		'<font color=#ff00e8">T</font><font color=#ff00c7">h</font><font color=#ff00a6">a</font><font color=#ff0085">n</font> ' +
    		'<font color=#ff0042">M</font><font color=#ff0021">e</font></center>');
    	},

	princesshigh: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://31.media.tumblr.com/tumblr_ltuo9yFLI81r5wm28o1_250.gif">' +
                '<img src="http://i.imgur.com/0xsg2uK.gif" width="370">' +
                '<img src="http://31.media.tumblr.com/tumblr_ltuo9yFLI81r5wm28o1_250.gif" ><br />' +
                '<b>Ace:</b> <font color=#d63265><blink>Gardevior</blink></font><br />' +
                '<b><font color=#ff0000">L</font><font color=#ff2300">i</font><font color=#ff4700">v</font><font color=#ff6a00">e</font>' +
                '<font color=#ff8e00"> </font><font color=#ffb100">f</font><font color=#ffb100">a</font><font color=#ffd500">s</font>' +
                '<font color=#ffd500">t</font><font color=#bdff00">,</font><font color=#9aff00"> </font><font color=#76ff00">D</font>' +
                '<font color=#53ff00">i</font><font color=#2fff00">e</font><font color=#0bff00"> </font><font color=#00ff17">y</font>' +
                '<font color=#00ff3b">o</font><font color=#00ff5e">u</font><font color=#00ff82">n</font><font color=#00ffa6">g</font>' +
                '<font color=#00ffc9">,</font><font color=#00ffed"> </font><font color=#00edff">b</font><font color=#00c9ff">a</font>' +
                '<font color=#00a6ff">d</font><font color=#0082ff"> </font><font color=#005eff">g</font><font color=#003bff">i</font>' +
                '<font color=#0017ff">r</font><font color=#0b00ff">l</font><font color=#2f00ff">s</font><font color=#5300ff"> </font>' +
                '<font color=#7600ff">d</font><font color=#9a00ff">o</font><font color=#bd00ff"> </font><font color=#e100ff">i</font>' +
                '<font color=#ff00f9">t</font><font color=#ff00d5"> </font><font color=#ff00b1">w</font><font color=#ff008e">e</font>' +
                '<font color=#ff006a">l</font><font color=#ff0047">l</font><font color=#ff0023">.</font></b></center>');
	},

	silverkill: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img height=150 src="http://fc00.deviantart.net/fs70/f/2013/320/9/3/mega_scizor_by_silentgpanda-d6ujsmg.jpg">' +
		'<img src="http://frostserver.no-ip.org:8000/images/silverkill-tc.png">' +
		'<img height=150 src="https://1-media-cdn.foolz.us/ffuuka/board/vp/image/1367/35/1367354021540.jpg"><br />' +
		'<b>Ace: </b>Mo\' Fuckin\' Common Sense!<br />' +
		'<b>Quote: </b>Would you like some fresh cut nanis? No? Well your mom bought some. She LOVED it ;D</center>');
	},

	autumn: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/qeUBqDy.jpg">' +
                '<img src="http://i.imgur.com/0Pjp4AP.gif width="380">' +
        	'<img src="http://i.imgur.com/NC2Mspy.jpg"><br />' +
                '<b>Ace:</b> Smeargle<br />' +
                'Painting you up and making you fall get it cause Autumn...</center>');
    	},

	ncrypt: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img height=110 src="http://i.imgur.com/rdSrtBA.png">' +
		'<img src="http://i.imgur.com/74K5o1L.gif">' +
		'<img src="http://i.imgur.com/VFeaIXd.gif"><br />' +
		'<blink><b><font color=red>Ace: </font>Terrakion</b></blink><br />' +
		'<b>Fighting is my passion and the only thing I trust is strength!</b></center>');
	},

   	donald: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQpaW7cxyFCEUxPkYHxnkZWXqE-AEHvZfMhxU-QdPfcghuAF69Gg" width="144" height="146">' +
                '<img src="http://i.imgur.com/EBq4NMP.png">' +
                '<img src="https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcR7aKN8bYWVMCGRNZQJNr5gMqG71aXzzfdPcJONfwFVvcjKyxYzRA" width="147" height="140"><br />' +
                '<b>Ace:</b> Bulk<br />' +
                'If it moves, I kill it.</center>');
    	},
   
   
   	messiah: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/y08yCwd.png" width="120" height="136">' +
    		'<img src="http://i.imgur.com/xA1Dqgw.png">' +
    		'<img src="http://i.imgur.com/ha756pn.png" width="120" height="136"><br />' +
    		'<b>Ace:</b> Kabutops<br />' +
    		'Sit back, relax, and let the undertow drown out your worries forever...</center>');
    	},
  
  
   	demon: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/pinsir.gif">' +
                '<img src="http://i.imgur.com/66NKKkD.png">' +
                '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/pinsir-mega.gif"><br />' +
                '<b>Ace:</b> Pinsir<br />' +
                'In order to succeed, your desire to succeed must be greater than your fear of failure.</center>');
    	},
   
   
    	rors: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i979.photobucket.com/albums/ae277/bjoyea/T-cardButchery_zps8f48bc75.gif" width="140" height="120">' +
                '<img src="http://i.imgur.com/VhjJEp0.png" width="260">' +
                '<img src="http://stream1.gifsoup.com/view4/1069409/rorschach-o.gif" width="160" hiehgt="120"><br />' +
                '<b>Ace:</b> Your Mom<br />' +
                'Sorry But Losing Isn\'t Really My Thing.</center>');
    	},
       
       
    	akkie: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/17XVxNt.png" height="160" width="180">' +
                '<img src="http://i.imgur.com/5AKQ0L3.gif">' +
                '<img src="http://i.imgur.com/PgXqSU1.png" height="190" width="170""><br />' +
                '<b>Ace:</b> Umbreon<br />' +
                'Are you prepared to face the infamous dream team knows as the team team?</center>');
    	},

	scorpion: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/plIiPCv.jpg?1" width="160" height="130">' +
    		'<img src="http://i.imgur.com/TS0fQ70.png" width="230">' +
    		'<img src="http://i.imgur.com/NxEA6yl.jpg?1" height="130" width="150"><br />' +
    		'<b>Ace:</b> Moltres<br />' +
    		'If you can\'t handle the heat gtfo.</center>');
    	},

    	
    	tailz: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/Ijfoz4n.png?1" width="180">' +
                '<img src="http://i.imgur.com/UQJceOG.png">' +
                '<img src="http://i.imgur.com/uv1baKZ.png?1" width="180"><br />' +
                '<b>Ace:</b> My ~<br />' +
                'I\'m Pretty Shit.</center>');
    	},
    	
    	orihime: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/zKKoyFJ.gif" width="150">' +
                '<img src="http://i.imgur.com/oV29Ffb.png">' +
                '<img src="http://i.imgur.com/PLhgZxL.gif" width="125" height="125"><br />' +
                '<b>Ace:</b> Leek Spin<br />' +
                'Sadistic? I don\'t mind you calling me that.</center>');
        },

	kammi: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/fJvcdib.png" height="125" width="76" />' +
		'<img src="http://i.imgur.com/WhZ1aKc.gif" />' +
		'<img src="http://i.imgur.com/NUyIu76.png?1" height="125" width="76" /><br /><br />' +
		'<b>Ace: </b>Stupidity.<br />' +
		'<b>Quote: </b>What.</center></div>');
	},

	giegue: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/IKVXSTv.png"> '+
		'<img src="http://i.imgur.com/YjVNB4q.png">' +
		'<img src="http://i.imgur.com/ppZSj34.png" height="150"><br />' +
		'<b>Ace: </b>Malamar<br />' +
		'Zubats, Zubats everywhere!!!</center>')
	},

	ssjoku: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/M9wnVcP.gif">' +
		'<img src="http://i.imgur.com/2jkjcvx.png">' +
		'<img src="http://i.imgur.com/zCuD2IQ.gif" height="150"><br />' +
		'<b>Ace: </b>Mega-Venusaur-Power Whip Yo Gurl<br />' +
		'<b>Quote: </b>I am Super Swaggy Coolio!!!</center>');
	},

	caster: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img height=180 width=200 src="http://31.media.tumblr.com/717db8c2843b1b007c25c5fc6e1f3537/tumblr_mreje8lECf1s3kgaso5_500.gif">' +
    		'<img src="http://i.imgur.com/S6BRoI7.png">' +
    		'<img height=180 width=200 src="http://1.bp.blogspot.com/-Huv46xIgEH4/UWwP8pGG3cI/AAAAAAAANUU/XqZhML6bvLk/s1600/tumblr_m3pxpkBCSP1rv6iido2_500.gif"><br />' +
    		'<b>Ace:</b> Terrakion<br />' +
    		'It doesn\'t matter how far away a leader is from his group, a leader will always be a leader.</center>');
    	},

	archer: 'archerclw',
	archerclw: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://imagehost4.online-image-editor.com/oie_upload/images/1521112p0H3B8I2/152934Mg9ptuyC.gif" width="160">' +
    		'<img src="http://i.imgur.com/sGMZrxt.gif">' +
    		'<img src="http://i.imgur.com/lFkxnAo.gif" width="150"><br />' +
    		'<b>Ace:</b> Bullshit<br />' +
    		' Ancient Words of Wisdom: stfu u stupid inbred.</center>');
    	},

	flare: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/gyarados-mega.gif">' +
    		'<img src="http://i.imgur.com/Wqcrfk0.gif">' +
    		'<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/blaziken-mega.gif"><br />' +
    		'<b>Ace:</b> Mega Gyarados/Gallade<br />' +
    		'With every set back. There\'s always a chance to comeback.</center>');
    	},

	klutzymanaphy: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/manaphy.gif">' +
    		'<img src="http://i.imgur.com/m2PAZco.gif">' +
    		'<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/mew.gif"><br />' +
    		'<b>Ace:</b> Mew and Manaphy<br />' +
    		'It\'s more important to master the cards you\'re holding than complaining about the ones your opponent was dealt. pls.</center>');
    	},

	unknownsremnant: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i701.photobucket.com/albums/ww16/jacoby746/Kingdom%20Hearts%20Sprites/roxas2.gif" height="150">' +
		'<img src="http://i926.photobucket.com/albums/ad103/reddas97/previewphp_zps559297e6.jpg" width="450">' +
		'<img src="http://i701.photobucket.com/albums/ww16/jacoby746/Kingdom%20Hearts%20Sprites/Demyx2.gif" height="150"><br />' +
		'<b>Ace: </b>The Darkness <br />' +
		'A person is very strong when he seeks to protect something. I\'ll expect a good fight.');
	},

	mattz: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/8Wq1oDL.gif" width="100" height="100">' +
    		'<img src="http://i.imgur.com/Tu1kJ2C.gif" width="350" height="80">' +
    		'<img src="http://i.imgur.com/sYoY67U.gif" width="100" height="100"><br />' +
    		'<b>Ace:</b> The Whole Swarm...Run!<br />' +
    		'Fight me? Go to sleep and dont let the bedbugs bite, kid...or burn you to a crisp.</center>');
    	},

	zarif: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox(' <center><img src="http://i.imgur.com/lC0aRUH.gif">' +
		'<img src="http://i.imgur.com/BPCyts3.png">' +
		'<img src="http://i.imgur.com/3EIY2d9.png"><br />' +
		'<b> <blink> Ace: </b>Infernape</blink><br />' +
		'Three things are infinite: magikarp\'s power, human stupidity and the fucking amount of zubats in a cave; and I\'m not sure about the universe.');
	},

	cark: 'amglcark',
	amglcark: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://25.media.tumblr.com/5899b0681d32d509995e6d1d9ae5299a/tumblr_mskxhqL9Yc1s035gko1_500.gif" height="120" width="180">' +
		'<img src="http://i.imgur.com/ZGyaxDn.png">' +
		'<img src="https://31.media.tumblr.com/45e356815fc9fbe44d71998555dc36e4/tumblr_mzr89tROK41srpic3o1_500.gif" height="120" width="180"><br />' +
		'<b>Ace: </b>Tsunami<br />' +
		'Life\'s hard.');
	},

	derp: 'derpjr',
	derpjr: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/BTmcOiH.gif" height="150">' +
		'<img src="http://i.imgur.com/K6t01Ra.png">' +
		'<img src="http://i.imgur.com/k3YCEr0.png" height="150"><br />' +
		'<b>Ace: </b>Crobat<br />' +
		'I liek cookies');
	},

	eclipse: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/9jjxo0c.gif" weight="141" height="92">' +
                '<img src="http://i.imgur.com/BQ9mXi1.gif">' +
                '<img src="http://i.imgur.com/9ZjN89N.gif" weigh="151" height="98"><br />' +
                '<b>Ace:</b> Charizard X & Mew<br />' +
                'Having decent skills doesn\'t give you the right to act cocky.</center>');
    	},

	handrelief: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/jniR0EF.jpg" height="120">' +
		'<img src="http://i.imgur.com/fWqMdpZ.png">' +
		'<img src="http://i.imgur.com/KCCaxo2.jpg" height="120"><br />' +
		'<b>Ace: </b>Scizor<br />' +
		'<b>Catchphrase: </b>The inner machinations of my mind are an enigma</center>');
	},

	elitefouroshy: 'oshy',
	oshy: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img height=60 src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/oshawott.gif">' +
		'<img width=580 src="http://frostserver.no-ip.org:8000/images/oshy.png">' +
		'<img height=60 src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/oshawott.gif"><br />' + 
		'<b>Ace:</b> Fluffy Oshawotts<br />' +
		'As long as your pokemon spirit keeps burning, your pokemon will keep fighting</center>');
	},

	gryph: function(target, room, user) {
	if (!this.canBroadcast()) return; 
	this.sendReplyBox('<center><img height=150 src="http://pokebot.everyboty.net/pix/822.gif">' + 
        	'<b><font color=#c2701e><font size=100><i>Gryph</i></font></font></b>' +
        	'<img height=150 src="http://pokebot.everyboty.net/pix/822.gif"><br/>' +
        	'<b>Ace:</b> High or Low?<br/>' +  
        	'We all move to the beat of just one Blastoise</center>');
	},

	piscean: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/spheal.gif">' +
		'<img src="http://i.imgur.com/iR3xhAH.gif">' +
		'<img src="http://th01.deviantart.net/fs70/200H/f/2011/010/a/b/derp_spheal_by_keijimatsu-d36um8a.png" width="110" height="100"><br />' +
		'<b>Ace:</b> Derp<br />' +
		'<b>Catchphrase:</b> What am I supposed to do with this shit?</center>');
	},

	adam: 'adamkillszombies',
	adamkillszombies: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://pldh.net/media/pokemon/conquest/sprite/212.png" height="100">' +
		'<img src="http://frostserver.no-ip.org:8000/images/adamkillszombies.png" height="100">' +
		'<img src="http://pldh.net/media/pokemon/gen2/crystal/212.gif" height="100"><br />' +
		'<b>Ace:</b> Scizor <br />' +
		'My destination is close, but it\'s very far...');
	},

	wiggly: 'wigglytuff',
	wigglytuff: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/D30ksbl.gif" height="80 width=80">' +
		'<img src="http://i.imgur.com/Iqexc1A.gif" width="340" height="80">' +
		'<img src="http://i.imgur.com/8oUvNAt.gif" height="80" width="80"><br />' +
		'<b>Ace:</b> Chatot<br />' +
		'Don\'t shirk work! Run away and pay! Smiles go for miles!</center>');
	},

	aerys: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://imgur.com/BAKX8Wk.jpg" height="100">' +
		'<img src="http://i.imgur.com/2NhfpP2.gif" height="100">' +
		'<img src="http://i.imgur.com/ImtN9kV.jpg" width="180" height="100"><br />' +
		'<b>Ace: </b>Smeargle<br />' +			
		'<b>Catchphrase: </b>I\'m not a monster; I\'m just ahead of the curve</center>');
	},

	dbz: 'dragonballsz',
	dragonballsz: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/m9gPc4J.gif" width="140" height="100">' +
		'<img src="http://i.imgur.com/rwzs91Z.gif" width="280" height="100">' +
		'<img src="http://i.imgur.com/J4HlhUR.gif" width="140" height="100"><br />' +
		'<font color=red><blink> Ace: Princess Celestia </blink></font><br />' +
		'*sends out ninjask* Gotta go fast.</center>');
	},

	bigblackhoe: 'lenora',
	oprah: 'lenora',
	sass: 'lenora',
	lenora: function(target, room, user) {
	if (!this.can('lockdown')) return false;
	if (!this.canBroadcast()) return;
		this.sendReplyBox('Trainer: Lenora<br />' +
		'Ace: Lenora<br />' + 
		'Catchphrase: Sass me and see what happens.<br />' +
		'<img src="http://hydra-images.cursecdn.com/pokemon.gamepedia.com/3/3e/LenoraBWsprite.gif">');
	},

    	thefrontierbeast: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.explodingdog.com/drawing/awesome.jpg" height="100">' +
        	'<img src="http://i.imgur.com/3eN4nV3.gif" height="100">' +
        	'<img src="http://fc09.deviantart.net/fs70/f/2011/089/a/1/hydreigon_the_dark_dragon_poke_by_kingofanime_koa-d3cslir.png" height="100"><br />' +
        	'<b>Ace: </b>Hydreigon<br />' +
        	'<b>Catchphrase: </b>You wanna hax with me huh WELL YOU DIE<br /></center>');
    	},
    
    	elitefourlight : 'light',
    	light: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/eetjLuv.png" height="100">' +
        	'<img src="http://i.imgur.com/v4h0TvD.png" height="100" width="450">' +
        	'<img src="http://i.imgur.com/21NYnjz.gif" height="100"><br />' +
        	'<b>Ace: </b>Mega Lucario<br />' +
        	'<b>Catchphrase: </b>Choose your battles wisely. After all, life isn\'t measured by how many times you stood up to fight.</center>');
    	},
    
    	zezetel: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/wpYk97G.png" height="100" width="130">' +
    		'<img src="http://i.imgur.com/ix6LGcX.png"><img src="http://i.imgur.com/WIPr3Jl.jpg" width="130" height="90"><br />' +
    		'<b>Ace: </b>Predictions</center><br /><center><b>Catchphrase: </b>' +
    		'In matters of style, swim with the current, in matters of principle, stand like a rock.</center>');
    	},
    
    	anttya: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://25.media.tumblr.com/tumblr_lljnf6TzP61qd87hlo1_500.gif" width="142" height="82">' +
		'<img src="http://i.imgur.com/E4Ui1ih.gif">' +
		'<img src="http://25.media.tumblr.com/5bbfc020661a1e1eab025d847474cf30/tumblr_mn1uizhc441s2e0ufo1_500.gif" width="142" height="82">' +
		'Ace: Staraptor' +
		'If you want to fly, then you\'ve got to give up the shit that weighs you down.</center>');
    	},
    
    	jak : 'darkjak',
    	darkjak: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/charizard-megax.gif" width="110">' +
                '<img src="http://i.imgur.com/GuVQ7sT.gif" width="270">' +
                '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/charizard-megay.gif" width="130"><br />' +
                '<b>Ace:</b> Mega charizard Y and X<br />' +
                'Many people say keep calm and relax, I prefer raging on and burning shit.</center>');
    	},
    
    	brittlewind: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/3tCl8az.gif>" height="100"><br />' +
        	'<img src="http://i.imgur.com/kxaNPFf.gif" height="100">' +
        	'<img src="http://i.imgur.com/qACUYrg.gif" height="100">' +
        	'<img src="http://i.imgur.com/0otHf5v.gif" height="100"><br />' +
        	'Ace: Mr. Kitty<br />' +
        	'Gurl please. I can beat you with mah eyes closed.');
    	},
    
    	kaiser: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/aegislash-blade.gif">' +
    		'<img src="http://i.imgur.com/7P2ifdc.png?1" width="340">' +
    		'<img src="http://i.imgur.com/zWfqzKL.gif" width="125"><br />' +
    		'<b>Ace:</b> Gallade<br />' +
    		'Challenges are what make life interesting and overcoming them is what makes life meaningful.</center>');
    	},
    
    	gemini : 'prfessorgemini',
    	prfessorgemini: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/volbeat.gif">' +
        	'<img src="http://i.imgur.com/HrHfI4e.gif">' +
        	'<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/joltik.gif"><br />' +
        	'<b>Ace: </b>Hotaru<br />' +
        	'<b>Catchphrase: </b>I am Professor Gemini. The best professor there is because I\'m not named after a f**king tree</center>')
    	},
    
    	sagethesausage: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/mc7oWrv.gif" height="100">' +
        	'<img src="http://i.imgur.com/vaCeYTQ.gif">' +
        	'<img src="http://fc00.deviantart.net/fs23/f/2007/320/d/4/COUNTER_by_petheadclipon_by_wobbuffet.png" height="100"><br />' +
        	'<b>Ace: </b>Wobbuffet<br />' +
        	'<b>Catchphrase: </b>Woah! Buffet! Wynaut eat when no one is looking?</center>');
    	},
    
    	moogle : 'kupo',
    	kupo: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/RnBPR99.png" height="100"><br />' +
        	'<img src="http://oyster.ignimgs.com/wordpress/write.ign.com/74314/2012/01/Moogle.jpg" height="100">' +
        	'<img src="http://i.imgur.com/6UawAhH.gif" height="100">' +
        	'<img src="http://images2.wikia.nocookie.net/__cb20120910220204/gfaqsff/images/b/bb/Kupo1705.jpg" height="100"><br />' +
        	'<b>Ace: </b>Moogle<br />' +
        	'<b>Catchphrase: </b>Kupo!<br /></center>');
    	},
    
    	creaturephil: 'phil',
    	phil: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img height="150" src="http://fc01.deviantart.net/fs70/f/2013/167/a/7/pancham_by_haychel-d64z92n.jpg">' +
        	'<img src="http://i.imgur.com/3jS3bPY.png">' +
        	'<img src="http://i.imgur.com/DKHdhf0.png" height="150"><br />' +
        	'<b>Ace: </b>Pancham<br />' +
        	'<b>Catchphrase: </b><a href="http://creatureleague.weebly.com">http://creatureleague.weebly.com</a></center>');
    	},
    
    	esep: 'ese',
        ese: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/y4j3JID.gif">' +
                '<img src="http://i.imgur.com/myUfOuS.gif" width="360">' +
                '<img src="http://i.imgur.com/9RkauTy.gif" width="90"><br />' +
                '<b>Ace:</b> Mega Absol<br />' +
                'No matter the matter of man the Goddess judges with a even hand.</center>');
    	},
    
    	apples: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://fc03.deviantart.net/fs71/f/2010/147/a/7/Meowth_VS_Seviper___Infernape_by_KokinhoKokeiro.gif"  width="150">' +
                '<img src="http://i.imgur.com/NvU4TIQ.gif"  width="260">' +
                '<img src="http://i.imgur.com/Z1XOqL9.gif" width="140"><br />' +
                '<b>Ace:</b> Brute Force<br />' +
                'If you stall, I hate you.</center>');
    	},
    
    
   	elitefourbalto : 'balto', 
   	balto: function(target, room, user) {
     	if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img height="90" src="http://fc08.deviantart.net/fs71/f/2012/035/e/f/snorlax_by_all0412-d4omc96.jpg">' +
        	'<img src="http://i.imgur.com/gcbLD9A.png">' +
        	'<img src="http://fc04.deviantart.net/fs71/f/2013/223/3/b/mega_kangaskhan_by_peegeray-d6hnnmk.png" height="100"><br />' +
        	'<b>Ace: </b>Snorlax<br />' +
        	'<b>Catchphrase: </b>To be a championship player,you need a championship team.</center>');
    	},
    
    
    	championxman : 'xman',
    	xman: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/talonflame-2.gif" width="100">' +
                '<img src="http://i.imgur.com/9bKjjcM.gif" width="350">' +
                '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/infernape.gif" width="80"><br />' +
                '<b><font color=black>Ace:</font></b><font color=red> Infernape</font><br />' +
                '<font color=red>Never give up and give it your all. If you give up, you have not lost once but twice.</font></center>');
    	},
    
    	piers: 'isawa',
    	isawa: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/hwqR2b8.jpg" width="160" height="140">' +
                '<img src="http://i.imgur.com/qZvvpNG.png?1" width="220">' +
                '<img src="http://farm3.static.flickr.com/2755/4122651974_353e4287e8.jpg" width="160" height="130"><br />' +
                '<b>Ace:</b> Piers Nivans<br />' +
                'Rub-a-dub-dub, Isawa be in your tub</center>');
    	},
    
    	frostmedic: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/3ulYHpB.jpg">' +
                '<img src="http://i.imgur.com/r8lESES.gif" width="320">' +
                '<img src="http://i.imgur.com/6tmwYT8.png" width="110"><br />' +
                '<b>Ace:</b> Piers Nivans<br />' +
                'Let\'s up the shots...ready for your dose? -flatlines-</center>');
    	},
    
    	pikadagreat : 'pika', 
    	pika: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://sprites.pokecheck.org/i/025.gif" height="100">' +
        	'<img src="http://i.imgur.com/LwD0s9p.gif" height="100">' +
        	'<img src="http://media0.giphy.com/media/DCp4s7Z1FizZe/200.gif" height="100"><br />' +
        	'<b>Ace:</b> Pikachu<br />' +
        	'<b>Catchphrase:</b> Its not a party without Pikachu</center>');
    	},
    
    	kidshiftry: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://fc01.deviantart.net/fs71/f/2011/261/0/c/shiftry_by_rapidashking-d4a9pc4.png" height="100">' +
        	'<img src="http://i.imgur.com/HHlDOu0.gif" height="100">' +
        	'<img src="http://25.media.tumblr.com/tumblr_m1kzfuWYgE1qd4zl8o1_500.png" height="100"><br />' +
        	'<b>Ace:</b> Shiftry<br />' +
        	'<b>Catchphrase: </b> Kicking your ass will be my pleasure!</center>');
    	},
    
    	pikabluswag: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/hwiX34o.gif">' +
		'<img src="http://i.imgur.com/6v22j6r.gif" height="60" width="310">' +
		'<img src="http://i.imgur.com/QXiZE1a.gif:><br /><br />' +
		'<b>Ace:</b> Azumarill<br />' +
		'The important thing is not how long you live. It\'s what you accomplish with your life.</center>');
    	},
    
    	scizorknight: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/212.gif" height="100">' +
        	'<img src="http://i.imgur.com/RlhvAOI.gif">' +
        	'<img src="http://img.pokemondb.net/sprites/black-white/anim/shiny/breloom.gif" height="100"><br />' +
        	'<b>Ace:</b> Scizor<br />' +
        	'<b>Catchphrase:</b> I Love The Way You lose ♥</center>');
    	},
    
    	jitlittle: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://24.media.tumblr.com/8183478ad03360a7c1d02650c53b4b35/tumblr_msfcxcMyuV1qdk3r4o1_500.gif" height="100" width="140">' +
		'<img src="http://i.imgur.com/Vxjzq2x.gif" height="85" width="250">' +
		'<img src="http://25.media.tumblr.com/b2af3f147263f1ef10252a31f0796184/tumblr_mkvyqqnhh51snwqgwo1_500.gif" height="100" width="140"><br />' +
		'<b>Ace:</b> Jirachi<br />' +
		'<b>Cuteness will always prevail over darkness</b></center>');
    	},
    
    	professoralice: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/absol-2.gif">' +
		'<img src="http://i.imgur.com/9I7FGYi.gif">' +
		'<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/victini.gif"><br />' +
		'<b>Ace: </b>Absol<br />' +
		'<b>Quote: </b>If the egg is broken by outside force, life ends. If the egg is broken from inside force, life begins. Great things always begin on the inside.</center>');
    	},

	 bibliaskael: 'kael',
    	kael: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i1141.photobucket.com/albums/n587/diebenacht/Persona/Arena%20gif/yukiko_hair_flip_final_50_80.gif">' +
        	'<img src="http://i1141.photobucket.com/albums/n587/diebenacht/teaddy_final_trans-1.gif" height="180">' +
        	'<img src="http://i1141.photobucket.com/albums/n587/diebenacht/Persona/Arena%20gif/naoto_left_final_50_80.gif"><br />' +
        	'<b>Ace:</b> Latios' +
        	'<b>Catchphrase:</b> My tofu...</center>');
    	},
   
	runzy : 'championrunzy',
	championrunzy: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/BSqLNeB.gif">' +
        	'<font size="6" color="#FA5882"><i>Champion Runzy</i>' +
        	'<img src="http://i.imgur.com/itnjFmx.gif"></font></color><br />' +
        	'Ace: Whimsicott<br>Want some Leech Seed?</center>');
        },
    
    	glisteringaeon: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center>Trainer: Glistering Aeon<br />' +
		'Ace: Really? Duh.<br />' +
		'Catchphrase: Grab your sombreros and glow sticks and lets rave!<br />' +
        	'<img height="150" src="http://www.animeyume.com/ludicolo.jpg"></center>');
    	},

	wickedweavile: 'champwickedweavile',
	champwickedweavile: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: ChampWickedWeavile<br />' +
		'Ace: Scyther<br />' +
		'Catchphrase: I suck at this game.<br />' +
        	'<img src="http://play.pokemonshowdown.com/sprites/trainers/80.png">');
    	},

	championdarkrai: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://pokecharms.com/data/trainercardmaker/characters/custom/Cosplayers/p491-1.png">' +
        	'<img src="http://imgur.com/JmqGNKI.gif">' +
        	'<img src="http://pokecharms.com/data/trainercardmaker/characters/custom/Cosplayers/p491.png"><br />' +
        	'<b>Ace:</b> Darkrai<br />' +
        	'<b>Catchphrase:</b> I got so many ghost hoes I lost count</center>');
    	},		
    
    	priest: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/pHVCLC5.png" width="140" height="100">' +
		'<img src="http://i.imgur.com/BkVihDY.png">' +
		'<img src="http://i.imgur.com/f39NE2W.gif"><br />' +
		'<font color="red"><blink>Ace: Heatran</blink></font><br />' +
		'Are you ready to face holyness itself? Will you open the door to my temple? Let your chakras make the decision for you.</center>');
    	},
    
    	smooth: 'smoothmoves',
   	smoothmoves: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/E019Jgg.png">' +
		'<img src="http://i.imgur.com/6vNVvk3.png">' +
		'<img src="http://i.imgur.com/aOzSZr8.jpg"><br />' +
		'<b>Ace: <font color="#FE2E2E"><blink>My Banana Hammer</blink></font><br />' +
		'<b><font color="#D7DF01">My potassium level is over 9000000000!!!!!!!!</center></font>');
    	},
    	
	trainerbofish: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: Trainer Bofish<br />' +
		'Ace: Electivire<br />' +
		'Catchphrase: I love to shock you.<br />' +
        	'<img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/466.gif"></center>');
    	},	

	snooki: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/1U1MFAg.png">' +
		'<img src="http://i.imgur.com/R9asfxu.gif">' +
		'<img src="http://i.imgur.com/vqxQ6zq.png">' +	
		'<font color="red"><blink>Ace: Jynx</blink></font><br />' +
		'I came in like a wrecking ball</center>');
    	},	
    
    	teafany: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/lwL5Pce.png">' +
		'<img src="http://i.imgur.com/D9M6VGi.gif">' +
		'<img src="http://i.imgur.com/hZ0mB0U.png"><br />' +
		'<b>Ace: <font color="#58ACFA"><blink>Ace: Farfetch\'d</blink></font><br />' +
		'<b><font color="#00BFFF">Where can I find a leek in Pokemon Y?</font></b></center>');
    	},
    
    	maskun: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/HCH2b.gif" width="167">' +
                '<img src="http://i.imgur.com/mB1nFy7.gif" width="285">' +
                '<img src="http://i.imgur.com/COZvOnD.gif"><br />' +
                '<b>Ace:</b> Stall<br />' +
                'I\'m sorry friend but stall is all part of the game.</center>');
    	},
    
    	kiirochu: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://th04.deviantart.net/fs70/PRE/i/2013/196/7/3/one_piece_chopper_png_by_bloomsama-d6dkl5d.png" width="80" height="100">' +
                '<img src="http://i.imgur.com/6E4jm4o.gif">' +
                '<img src="http://i.imgur.com/uezK5X4.gif"><br />' +
                '<b>Ace:</b> Fanciness<br />' +
                'Scuse me, I can\'t seem to find my dick. Mind if I look in your mother\'s mouth?</center>');
    	},
    
    	brittany: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/castform-sunny.gif">' +
                '<img src="http://i.imgur.com/natglfA.png">' +
                '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/cherrim-sunshine.gif"><br />' +
                '<b>Ace:</b> Cherrim&lt;3<br />' +
                'l-lewd.</center>');
    	},
    
    	donut: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/excadrill.gif">' +
    		'<img src="http://i.imgur.com/aYamsDZ.png?1">' +
    		'<img src="http://www.dailyfork.com/Donut.gif" width="120" height="120"><br />' +
    		'<b>Ace:</b> Excadrill<br />' +
    		'A true champion is someone who gets up, even when he can\'t.</center>');
    	},
    
    	video: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/victini.gif">' +
    		'<img src="http://i.imgur.com/JL7MokA.png">' +
    		'<img src="http://i.imgur.com/Q9XU12a.gif"><br />' +
    		'<b>Ace:</b> Victini<br />' +
    		'The only way you can learn is from failure to achieve success.</center>');
    	},
    
    	notorangejuice: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/2WNeV9p.gif">' +
		'<img src="http://i.imgur.com/ghwiaaV.gif">' +
		'<img src="http://i.imgur.com/Vi2j2OG.gif"><br /><br />' +
		'<b>"Banana Bread."</b><br />' +
		'<b>www.youtube.com/notorangejuice</b></center>');
    	},
    
    	soggey: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/w9po1tP.gif?1">' +
		'<img src="http://i.imgur.com/N48X8Vf.png">' +
		'<img src="http://i.imgur.com/YTl10Yi.png"><br />' +
		'<b>Ace: </b>Sandslash<br />' +
		'<b>Quote: </b>It was all fun and games... but then you had to hax me >:(</center>');
    	},
    
    	miller: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/cc5BTsj.gif" height="110" width="260">' +
		'<img src="http://25.media.tumblr.com/tumblr_m456ambdnz1qd87hlo1_500.gif" height="150" width="220"><br />' +
		'<b>Ace: </b>Wobbuffet<br />' +
		'<b>Catchphrase: </b>I\'ll get the job done.</center>');
    	},
    
    	belle: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/garchomp.gif">' +
		'<img src="http://i.imgur.com/SAhOexv.png">' +
		'<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados-shiny/aegislash-blade.gif"> <br />' +
		'<b>Ace: </b>Garchomp<br />' +
		'Did you set it to wumbo?</center>');
    	},
    
    	kishz: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://25.media.tumblr.com/bda3fbc303632e64b6c2aa720e8cf87e/tumblr_mw09v90S3R1rb53jco1_500.png" height="100" width="125">' +
		'<img src="http://i.imgur.com/QTUuGUI.gif" height="110" width="240">' +
		'<img src="http://24.media.tumblr.com/8aaf6a29a200fa3ce48e44c8fad078c9/tumblr_mpu21087ST1sogo8so1_250.jpg" height="100" width="125"><br />' +
		'<b>Ace: </b>Keldeo/Manectric<br />' +
		'<b>Catchphrase: </b>I\'m a Champ, come at me bro.</center>');
    	},
    
    	vlahd: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.quickmeme.com/img/59/59735e50728008fe7477f8292ec025aafb7c38ab86c39d1a4f198c3379c92669.jpg" Width="100" Height="75">' +
                '<img src="http://i.imgur.com/TAU7XiN.gif" Width="350">' +
                '<img src="http://24.media.tumblr.com/dae120759bc68c85e828d3ee631b9c3e/tumblr_mpstfxXqhg1s5utbmo1_500.gif" Width="100" Height="75"><br />' +
                '<b>Most Badass Pokemon Alive:</b> Froslass<br />' +
                '<font color=Blue><b>I want to be there when Karma butt-fucks you with a cactus.</b></font></center>');
    	},
    
    	egyptian: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://fc09.deviantart.net/fs70/f/2011/358/e/5/cobalion_the_just_musketeer_by_xous54-d4k42lh.png" height="100" width="100">' +
		'<img src="http://fc01.deviantart.net/fs71/f/2014/038/7/4/6vnvvk3_by_yousefnafiseh-d75gny6.png">' +
		'<img src="http://i.imgur.com/aRmqB2R.png" height="100" width="100" ><br />' +
		'<b>Ace: </b><font color="#FE2E2E"><blink>Yanmega</blink></font><br />' +
		'<b><font color="#D7DF01">Never give up , There\'s still Hope</b></font>');
    	},
    
    	dolph: 'amgldolph',
    	amgldolph: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/bidoof.gif">' +
		'<img src="http://i.imgur.com/zUj8TpH.gif" width="350">' +
		'<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/magikarp-2.gif" width="175"><br />' +
		'<b>Ace: </b>Bidoofs and Magikarps<br />' +
		'<b>Catchphrase: </b>Shit My Biscuits Are Burning!</center>');
    	},
    
    	failatbattling: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://img.pokemondb.net/sprites/black-white/anim/normal/jirachi.gif">' +
		'<img src="http://i.imgur.com/ynkJkpH.gif" width="300" >' +
		'<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/sigilyph.gif"><br />' +
		'<b>Ace: Anything that gets haxed</b><br />' +
		'<b>Catchphrase: The name says it all.</b></center>');
    	},
    
    	darknessreigns: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src"=http://i.imgur.com/GCIT4Cv.gif" height="90" width="500">' +
		'<img src="http://th05.deviantart.net/fs70/PRE/i/2013/220/5/a/pokemon___megalucario_by_sa_dui-d6h8tdh.jpg" height="80" width="120">' +
		'<img src="http://th08.deviantart.net/fs70/PRE/f/2010/169/c/5/Gengar_Wallpaper_by_Phase_One.jpg" height="80" width="120"><br />' +
		'<b>Ace: </b>The Darkness' +
		'<b>Catchphrase: </b>When the night falls, The Darkness Reigns</center>');
    	},
    
    	naten: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/uxie.gif">' +
		'<img src="http://i254.photobucket.com/albums/hh108/naten2006/cooltext1400784365_zps7b67e8c9.png">' +
		'<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/mew.gif"><br />' +
		'Ace: Uxie, Our Lord and Saviour<br />' +
		'<font color="purple">The moment you\'ve stopped planning ahead is the moment you\'ve given up.</font></center>');
    	},
    
    	bossbitch: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/kUSfLgd.jpg" width="100" height="100">' +
		'<img src="http://i.imgur.com/UCxedBg.gif" width="350" height="80">' +
		'<img src="http://i.imgur.com/I7eayeo.jpg" width="100" height="100"><br />' +
		'<b>Ace:</b> Cinccino<br />' +
		'<b>Quote: Don\'t bet me or you will weep later</b></center>');
    	},
    
    	barida: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://37.media.tumblr.com/52dbb7fcd15a5a3b785256abff5aea59/tumblr_mo9lrhDRhY1qk7puko1_400.gif" width="160">' +
                '<img src="http://i.imgur.com/Kr0EwN6.png" width="220">' +
                '<img src="http://31.media.tumblr.com/5eea1a2d0c1376cd7f2428891534b4b2/tumblr_myo638Opel1s2i16to1_500.jpg" width="160"><br />' +
                '<b>Ace:</b> Talonflame<br />' +
                'He who would learn to fly one day must first learn to stand and walk and run and climb and dance; one cannot fly into flying.</center>');
    	},
    
	epin: 'epinicion',
    	epinicion: function(target, room, user) {
     	if (!this.canBroadcast()) return;
     	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/crustle.gif">' +
     		'<img src="http://i.imgur.com/5aLcrWN.png">' +
     		'<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/mew.gif"><br />' +
     		'<b>Ace: </b>Crustle<br />' +
     		'<b>Quote: </b>Si Vis Pacem, Para Bellum</center>');
     	},

    	badass: 'thatonebadass',
    	thatonebadass: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img height=150 src=http://i.imgur.com/SsxwslQ.gif>' +
    		'<img src=http://i.imgur.com/rvUDGg2.gif>' +
    		'<img height=150 src=http://www.pkparaiso.com/imagenes/xy/sprites/animados/greninja-4.gif><br />' +
    		'<b>Ace:</b> My Hands<br />' +
    		'<b>Catchphrase: </b>I\'m bout to get #WristDeep</center>');
    	},
    
    	kanghirule : 'kanghiman',
    	kanghiman: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<img src="http://fc07.deviantart.net/fs23/f/2007/350/e/c/Kyubi_Naruto__Ransengan_by_madrox123.gif">' +
		'<img src="http://i.imgur.com/QkBsIz5.gif">' +
		'<img src="http://static4.wikia.nocookie.net/__cb20120628005905/pokemon/images/4/40/Kangaskhan_BW.gif"><br />' +
		'<b>Ace</b>: Kangaskhan<br />' +
		'<b>Catchphrase:</b> Got milk?</center>');
    	},	
    
    	gamercat: 'rivalgamercat',
    	rivalgamercat: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://pkparaiso.com/imagenes/xy/sprites/animados/lickilicky.gif">' +
		'<img src="http://i.imgur.com/K8qyXPj.gif" width="350" height="70">' +
		'<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/chandelure.gif"><br />' +
		'<b>Ace: </b>Lickilicky<br />' +
		'<b>Catchphrase: </b>Come in we\'ll do this fast ;)</center>');
    	},

	elite4synth: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: Elite4^Synth<br />' +
		'Ace: Crobat<br />' +
		'Catchphrase: Only pussies get poisoned.<br />' +
        	'<img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/169.gif">');
    	},	

	elite4quality: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: Elite4^Quality<br />' +
		'Ace: Dragonite<br />' +
		'Catchphrase: You wanna fly, you got to give up the shit that weighs you down.<br />' +
        	'<img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/149.gif">');
    	},	
    
    	quality: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/3pAo1EN.png">' +
		'<img src="http://i.imgur.com/sLnYpa8.gif">' +
		'<img src="http://i.imgur.com/tdNg5lE.png"><br />' +
		'Ace: Pikachu<br />' +
		'I\'m Quality, you\'re not.</center>');
    	},
    
    	hotfuzzball: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/rk5tZji.png"><br />' +
		'<img src="http://i.imgur.com/pBBrxgo.gif"><br />' +
		'<font color="red"><blink><b>Ace: Clamperl</blink></font><br />' +
		'<b>How do you like me now, (insert naughty word)!</b></center>');
    	},
    
	elitefoursalty: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: Elite Four Salty<br />' +
		'Ace: Keldeo<br />' +
		'Catchphrase: I will wash away your sin.<br />' +
        	'<img src="http://images3.wikia.nocookie.net/__cb20120629095010/pokemon/images/9/98/BrycenBWsprite.gif">');
    	},	

	jiraqua: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: Jiraqua<br />' +
		'Ace: Jirachi<br />' +
		'Catchphrase: Go Jirachi!<br />' +
        	'<img src="http://cdn.bulbagarden.net/upload/4/48/Spr_B2W2_Rich_Boy.png">');
    	},

	richguy: 'gymldrrichguy',
	gymldrrhichguy: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: Gym Ldr RhichGuy<br />' +
		'Ace: Thundurus-T<br />' +
		'Catchphrase: Prepare to discover the true power of the thunder!<br />' +
    		'<img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/642-therian.gif">');
    	},
            
    	murana: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: Murana<br />' +
		'Ace: Espeon<br />' +
		'Catchphrase: Clutching victory from the jaws of defeat.<br />' +
        	'<img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/196.gif">');
    	},		
  	
  	ifazeoptical: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: ♫iFaZeOpTiCal♫<br />' +
		'Ace: Latios<br />' +
		'Catchphrase: Its All Shits And Giggles Until Someone Giggles And Shits.<br />' +
        	'<img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/381.gif">');
    	},
                 
	superjeenius: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/vemKgq4.png"><br />' +
		'<img src="http://i.imgur.com/7SmpvXY.gif"><br />' +
		'Ace: Honchkrow<br />' +
		'Cya later mashed potato.</center>');
    	},
            
    	electricapples: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: ElectricApples<br />' +
		'Ace: Jolteon<br />' +
		'Catchphrase: You are not you when your zappy.<br />' +
        	'<img src="http://pldh.net/media/pokemon/gen5/blackwhite/135.png">');
	 },

	nochansey: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: NoChansey<br />' +
		'Ace: Miltank<br />' +
		'Catchphrase: Moo, moo muthafuckas.<br />' +
        	'<img src="http://media.pldh.net/pokemon/gen5/blackwhite_animated_front/241.gif">');
    	},

    	championtinkler: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/ymI1Ncv.png"><br />' +
		'<img src="http://i.imgur.com/ytgnp0k.gif"><br />' +
		'<font color="red"><blink><b>Ace: Volcarona</blink></font><br />' +
		'<b>Aye there be a storm comin\' laddie</b></center>');
	},

	killerjays: function(target, room,user) {
		if (!this.canBroadcast()) return;
		this.sendReply('|raw|<center><img height="150" src="http://i.imgur.com/hcfggvP.png"><img src="http://i.imgur.com/uLoVXAs.gif"><img src="http://i.imgur.com/RkpJbD1.png"><br><font size="2"><b>Ace:</b> Articuno</font><br><font size="2"><b>Catchphrase: </b>Birds Sing, Birds Fly, Birds kill people.</font>');
	},

	ryuuga: function(target, room,user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/7ALXaVt.png">' +
		'<img src="http://i.imgur.com/6OFRYal.gif">' +
		'<img src="http://i.imgur.com/gevm8Hh.png"><br />' +
		'Ace: Jirachi<br />' +
		'I\'ve never been cool - and I don\'t care.</center>');

	},

	coolasian: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('Trainer: Cool Asian<br />' +
		'Ace: Politoed<br />' + 
		'Catchphrase: I\'m feeling the flow. Prepare for battle!<br />' +
		'<img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/186.gif">');
	},

	typhozzz: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://th08.deviantart.net/fs70/PRE/i/2011/111/e/5/typhlosion_by_sharkjaw-d3ehtqh.jpg" height="100" width="100">' +
		'<img src="http://i.imgur.com/eDS32pU.gif">' +
		'<img src="http://i.imgur.com/UTfUkBW.png"><br />' +
		'<b>Ace: <font color="red"> Typhlosion</font></b><br />' +
		'There ain\'t a soul or a person or thing that can stop me :]</center>');
	},

	roserade: 'roserade26',
	roserade26: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://firechao.com/Images/PokemonGuide/bidoof_sprite.png" width="90" height="90">' +
		'<img src="http://i.imgur.com/f7YIx7s.gif">' +
		'<img src="http://2.images.gametrailers.com/image_root/vid_thumbs/2013/06_jun_2013/gt_massive_thumb_AVGN_640x360_07-01-13.jpg" width="120" height="110"><br />' +
		'<b>Quote: If you win, I hate you</b><br />' +
		'Ace: Roserade</center>');
	},

	spike: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://fc06.deviantart.net/fs70/f/2014/073/b/6/goomy_by_creepyjellyfish-d7a49ke.gif">' +
                '<img src="http://i.imgur.com/L4M0q0l.gif">' +
                '<img src="http://192.184.93.156:8000/avatars/gaspoweredstick.gif"><br />' +
                '<b>Ace:</b> Goomy and Aron<br />' +
                'Sometimes the world is tough, but with my Pokemon, its a walk in the park..</center>');
    	},

	nine: 'leadernine', 
	leadernine: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReply('|raw|<center><img src="http://i.imgur.com/9BjQ1Vc.gif"><br />' +
		'<img src="http://i.imgur.com/fTcILVT.gif">' +
		'<img src="http://i.imgur.com/D58V1My.gif">' +
		'<img src="http://i.imgur.com/dqJ08as.gif"><br />' +
		'Ace: Fairies!<br />' +
		'<img src="http://i.imgur.com/hNB4ib0.png"><br />' +
		'<img src="http://i.imgur.com/38evGGC.png"><br />' +
		'<b>-Grimsley</b></center>')
    	},
    	
    	wyvern: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<img src="http://media.giphy.com/media/tifCTtoW05XwY/giphy.gif" height="80" width="125">' +
		'<img src="http://i.imgur.com/C7x8Fxe.gif" height="90" width="300">' +
		'<img src="http://brony.cscdn.us/pic/photo/2013/07/e00cb1f5fa33b5be7ad9127e7f7c390d_1024.gif" height="80" width="125"><br />' +
		'<b>Ace:</b> Noivern<br />' +
		'<b>My armor is like tenfold shields, my teeth are swords, my claws spears, the shock of my tail a thunderbolt, my wings a hurricane, and my breath death!</b></center>');
    	},

	jordanmooo: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/iy2hGg1.png" height="150" width="90">' +
		'<img src="http://i.imgur.com/0Tz3gUZ.gif">' +
		'<img src="http://fc09.deviantart.net/fs71/f/2010/310/c/9/genosect_by_pokedex_himori-d32apkw.png" height="150" width="90"><br />' +
		'<b>Ace: <font color="purple"><blink>Genesect</blink></font><br />' +
		'<b><font color="green">TIME FOR TUBBY BYE BYE</font></center>');
	},

	alee: 'sweetie',
	sweetie: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/7eTzRcI.gif" height="122" width="112">' +
		'<img src="http://i.imgur.com/ouRmuYO.png?1">' +
		'<img src="http://i.imgur.com/4SJ47LZ.gif" height="128" width="100"><br />' +
		'<font color="red"><blink>Ace: Shiny Gardevoir-Mega</blink></font><br />' +
		'<font color="purple">Y yo que estoy ciega por el sol, guiada por la luna.... escapándome. ♪</font></center>');
	},

	jesserawr: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/J6AZqhx.png" width="96" height="96">' +
		'<img src="http://i.imgur.com/3corYWy.png" width="315" height="70">' +
		'<img src="http://i.imgur.com/J6AZqhx.png" width="96" height="96"><br />' +
		'<font color="lightblue"> Ace: Wynaut </font><br />' +
		'Wynaut play with me ?</center>');
	},

	ryoko: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/J8yIzfP.jpg" width="96" height="96">' +
		'<img src="http://i.imgur.com/igi2peI.png" width="315" height="70">' +
		'<img src="http://i150.photobucket.com/albums/s81/HeroDelTiempo/1192080205639.jpg" width="96" height="96"><br />' +
		'<font color="red"> Ace: Bidoof </font><br />' +
		'You done doofed now.</center>');
	},

	meatyman: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/UjmM3HD.png">' +
		'<font size="6" color="#298A08"><i>Meaty_Man</i></font></color>' +
		'<img src="http://i.imgur.com/jdZVUOT.png"><br />' +
		'Ace: Reshiram<br />' +
		'This is not the beginning... this is the end. Follow the Buzzards.</center>');
	},

	jd: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReply('|raw|<img width=100% height=260 src="http://i.imgur.com/6gkSSam.jpg">');
	},

	familyman: 'familymantpsn',
	familymantpsn: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/UHptfOM.gif">' +
		'<img src="http://i.imgur.com/PVu7RGX.png">' +
		'<img src="http://i.imgur.com/XVhKJ77.gif"><br />' +
		'Ace: Audino<br />' +
		'Luck.</center>');
	},

	wrath: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/JYSIIvd.gif" width="120">' +
                '<img src="http://i.imgur.com/RdY55b0.png" width="290">' +
                '<img src="http://i.imgur.com/ESsVLu4.gif" width="120"><br />' +
                '<b>Ace:</b> Edges<br />' +
                'Appearances rarely share the whole truth.</center>');
    	},

	salemance: 'elite4salemance',
	elite4salemance: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/jrW9zfw.gif">' +
		'<font size="6" color="#FE2E9A"><i>Elite4Salemance</i></font></color>' +
		'<img src="http://i.imgur.com/VYdDj7y.gif"><br />' +
		'Ace: Haxoceratops<br />' +
		'Yeah!!!</center>');
	},

	colonialmustang: 'mustang',
	mustang: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/REAZaJu.gif"><br />' +
		'<img src="http://fc01.deviantart.net/fs70/f/2011/039/8/1/roy_mustang_firestorm_by_silverwind91-d394lp5.gif">' +
		'<font size="5" color="#FF0040"><i>Colonial Mustang</i></font></color>' +
		'<img src="http://i.imgur.com/VRZ9qY5.gif"><br />' +
		'What am I trying to accomplish, you ask...? I want to change the dress code so that all women in the Frost... ...must wear mini-skirts!!.</center>');
	},

	logic: 'psychological',
	psychological: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/c4j9EdJ.png?1">' +
                '<a href="http://www.smogon.com/forums/members/andrew.173056/"><img src="http://i.imgur.com/R3nj8i5.png" width="200"></a>' +  
                '<img src="http://i.imgur.com/TwpGsh3.png?1"><br />' +      
                '<img src="http://i.imgur.com/1MH0mJM.png" height="90">' +
                '<img src="http://i.imgur.com/TSEXdOm.gif" width="300">' +
                '<img src="http://i.imgur.com/4XlnMPZ.png" height="90"><br />' +
                'If it isn\'t logical, it\'s probably Psychological.</center>');
        },

	siem: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/CwhY2Bq.png">' +
		'<font size="7" color="#01DF01"><i>Siem</i></font></color>' +
		'<img src="http://i.imgur.com/lePMJe5.png"><br />' +
		'Ace: Froslass<br />' +
		'Keep your head up, nothing lasts forever.</center>');
	},

	grumpigthepiggy: 'grumpig',
	grumpig: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/k71ePDv.png"><br />' +
		'<img src="http://i.imgur.com/bydKNe9.gif"><br />' +
		'Ace: Mamoswine<br />' +
		'Meh I\'ll Oink you till you rage.</center>');
	},

	figgy: 'figufgyu',
	figufgyu: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/n0Avtwh.png">' +
		'<img src="http://i.imgur.com/0UB0M2x.png">' +
		'<img src="http://i.imgur.com/fkTouXK.png"><br />' +
		'Ace: Charizard<br />' +
		'Get ready to be roasted!</center>');
	},

	stein: 'frank',
	frankenstein : 'frank',
	frank: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReply('|raw|<center><img src="http://i.imgur.com/9wSqwcb.png">' +
		'<b><font color="blue" size="6">Professor Ştein</font></b>' +
		'<img src="http://fc03.deviantart.net/fs70/f/2013/120/5/9/thundurus_therian_forme_by_xous54-d4zn05j.png" height="130"><br />' +
		'<b>Ace:</b> Thundurus-T<br />' +	
		'<b>Catcphrase:</b> Are you ready to fight against fear itself? Will you cross beyond that door? Let your souls make the decision for you.</center>');
	},

	shadowninjask: 'ninjask',
	ninjask: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/7DKOZLx.png"><br />' +
		'<img src="http://i.imgur.com/YznYjmS.gif"><br />' +
		'Ace: Mega Charizard X<br />' +
		'Finn, being an enormous crotch-kicking foot is a gift. Don\'t scorn a gift.</center>');
	},

	recep: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/4xzLvzV.gif">' +
		'<img src="http://i.imgur.com/48CvnKv.gif" height="80" width="290">' +
		'<img src=http://i.imgur.com/4xzLvzV.gif><br />' +
		'<b>Ace:</b> Patrick<br />' +
		'<b>Catchphrase:</b> I may be stupid, but I\'m also dumb.<center>');
	},

	tesla: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src=http://www.pkparaiso.com/imagenes/xy/sprites/animados/lanturn.gif>' +
		'<img src=http://i.imgur.com/7HIXTxC.gif>' +
		'<img src=http://www.pkparaiso.com/imagenes/xy/sprites/animados/zapdos.gif><br />' +
		'Ace: <font color="green">The Green Lanturn</font><br />' +
		'<font color=#CC9900>Edison failed 10,000 times before he made the electric light. <br />Do not be discouraged if you fail a few times.</font></center>');
	},

	nocilol: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/e3Y9KTl.gif" height="100" width="80">' +
		'<img src="http://i.imgur.com/8aJpTwD.gif">' +
		'<img src="http://i.imgur.com/WUtGk1c.jpg" height="120" width="100"><br />' +
		'<font face="arial" color="red"><b>Ace: </b>Gallade</font><br />' +
		'<b>Catchphrase: </b>I hope you enjoy fan service – I can provide you some. ;)</center>');
	},

	tacosaur: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src=http://i.imgur.com/kLizkSj.png height="100" width="100">' +
		'<img src=http://i.imgur.com/AZMkadt.gif>' +
		'<img src=http://i.imgur.com/csLKG5O.png height="100" width="100"><br />' +
		'<b>Ace:</b> Swampert<br />' +
		'<b>Catchphrase:</b> So I herd u liek Swampertz</center>');
	},

	prez: 'cosy',
	cosy: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReply('|raw|<marquee direction="right"><img src="http://i.imgur.com/Cy88GTo.gif">' +
		'<img src="http://i.imgur.com/Cy88GTo.gif">' +
		'<img src="http://i.imgur.com/Cy88GTo.gif">' +
		'<img src="http://i.imgur.com/Cy88GTo.gif">' +
		'<img src="http://i.imgur.com/Cy88GTo.gif"></marquee>' +
		'<img src="http://i.imgur.com/NyBEx2S.png" width="100%"><marquee direction="left">' +
		'<img src="http://i.imgur.com/gnG81Af.gif">' +
		'<img src="http://i.imgur.com/gnG81Af.gif">' +
		'<img src="http://i.imgur.com/gnG81Af.gif">' +
		'<img src="http://i.imgur.com/gnG81Af.gif">' +
		'<img src="http://i.imgur.com/gnG81Af.gif"></marquee>');
	},

	hulasaur: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/8owuies.gif" width="110" height="70">' +
		'<img src="http://i.imgur.com/qHnpJfN.png">' +
		'<img src="http://24.media.tumblr.com/tumblr_me7s9cLpWv1qkvue8o3_500.gif" width="110" height="70"><br />' +
		'<b>Ace: </b>Jolteon<br />' +
		'I believe in what I think is right, even when what I think is wrong</center>');
	},

        hope: function(target, room, user) {
        if(!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/EYkBb4N.jpg" width="96" height="96">' +
		'<img src="http://i.imgur.com/SlN7Yla.gif">' +
		'<img src="http://i.imgur.com/mIolDwv.jpg" width="96" height="96"><br />' +
		'<font color=#00BFFF><b>Ace:</b> Artifail </font><br />' +
		'You can\'t smoke mushrooms, but imagine a line of shrooms</center>');
        },

	shm: 'swedishmafia',
	swedishmafia: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/12ekq6t.jpg">' +
		'<img src="http://i.imgur.com/D01llqs.png" height="80" width="370">' +
		'<img src="http://blowingupfast.com/wp-content/uploads/2011/05/Machine-Gun-Kelly.jpg"><br />' +
		'Ace: The Power of Music<br />' +
		'They say that love is forever... Your forever is all that I need~ Please staaay as long as you need~</center>');
	},

	piled: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/fnRdooU.png">' +
		'<img src="http://i.imgur.com/hbo7FGZ.gif">' +
		'<img src="http://i.imgur.com/KV9HmIk.png"><br />' +
		'Ace: Ditto<br />' +
		'PILED&PURPTIMUS PRIME!!! MHM..YEAH!!!</center>');
	},

	twistedfate: 'auraburst',
	auraburst: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/vrXy1Hy.png"><br />' +
		'<img src="http://i.imgur.com/FP2uMdp.gif"><br />' +
		'<blink><font color="red">Ace: Heatran</blink></font><br />' +
		'You may hate me, but don\'t worry, I hate you too.</center>');
	},

	aerodactylol: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/KTiZXe7.jpg">' +
		'<font size="7" color="#00733C"><i>Aerodactylol</i></font></color>' +
		'<img src="http://pldh.net/media/pokemon/gen3/rusa_action/142.gif"><br/ >' +
		'Ace: Aerodactyl<br />' +
		'I only battle... DANCING!</center>');
	},

	robin6539: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://fc09.deviantart.net/fs4/i/2004/196/9/b/Ludidolo.gif">' +
		'<img src="http://i.imgur.com/CSfl1OU.gif">' +
		'<img src="http://z5.ifrm.com/30155/88/0/a3555782/avatar-3555782.jpg"><br />' +
		'Ace: Ludicolo<br />' +
		'TRAINS AND COLOS</center>');
	},

	nightmare: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://www.smogon.com/media/forums/avatars/gengar.gif.v.RgUmg2XMx1gWsiUcJc9b0w">' +
                '<img src="http://i.imgur.com/3Shcj1m.png" width="347">' +
                '<img src="http://www.smogon.com/media/forums/avatars/darkrai.gif.v.74wEympImux6JCL0v_MbPA"><br />' +
                '<b>Ace:</b> Darkrai<br />' +
                'Prepare for your nightmare.</center>');
        },

	killertiger: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://sprites.pokecheck.org/s/500.gif"><br />' +
		'<img src="http://i.imgur.com/diRkf6z.png">' +
		'<font size="7" color="#0489B1"><i>Killer Tiger</i></font></color>' +
		'<img src="http://i.imgur.com/4FMzRl5.png"><br />' +
		'Ace: Salamence<br />' +
		'One for all and all for one</center>');
	},

	twizzy: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/SGcRSab.png">' +
		'<img src="http://i.imgur.com/dkwp4cu.gif">' +
		'<img src="http://i.imgur.com/E04MrCc.png"><br />' +
		'<font color="red"><blink>Ace: Keldeo-Resolute</blink></font><br />' +
		'Have you ever feel scared and there is nothing you can do about it? Challenge me and i will show you what fear is!</center>');
	},

	ag: 'arcainiagaming',
	arcainiagaming: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<center><img src="http://i.imgur.com/tFikucg.png"><br />' +
		'<img src="http://i.imgur.com/wSs98Iy.gif"><br />' +
		'<font color="red"><blink>Ace: Weavile</blink></font><br />' +
		'I\'m not even on drugs. I\'m just weird.</center>');
	},


	lights: 'scarftini', 
	scarftini: function(target, room, user) {
	if (!this.canBroadcast()) return; 
	this.sendReplyBox('<center><img src="http://i.imgur.com/HbuF0aR.png" width="550"><br />' + 
		'<b>Ace:</b> Victini <br />' + 
		'Owner of Trinity and former head of Biblia. Aggression is an art form. I am simply an artist.<br />' +
		'<img src="http://img-cache.cdn.gaiaonline.com/1a962e841da3af2acaced68853cd194d/http://i1070.photobucket.com/albums/u485/nitehawkXD/victini.gif"></center>');
	},

	piiiikachuuu: function(target, room, user) {
	if (!this.canBroadcast()) return;
	this.sendReplyBox('<img src="http://192.184.93.156:8000/avatars/piiiikachuuu.png"><br />' +
		'zzzzzzzzzzzzzzzzz');
	},


	//Frost Contest Winner Commands//



	involved: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/3wcET7B.gif" width="200"><br />' +
    		'<img src="http://i.imgur.com/eAtWgY6.gif"><br />' +
    		'A true gentleman keeps his calm cool.</center>');
    	},

	funniest: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="https://i.imgflip.com/9jmbk.jpg" height="160"><br />' +
    		'<img src="http://i.imgur.com/iG5uv3h.png"><br />' +
    		'Just a little african using humor to make it in to the USA while obtaining bad bitches and a fine collection of ramen noodles.</center>');
    	},

	popular: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://a4.ec-images.myspacecdn.com/images02/19/41b06a9ea0824af081d89de237c011d9/l.jpg" height="160"><br />' +
    		'<img src="http://i.imgur.com/tuQtMyf.gif" height="100"><br />' +
    		'I am so fab, I mean I wouldn\'t be known as frost\'s most popular user ;).</center>');
    	},

	smartest: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://25.media.tumblr.com/855789c7dfd76c65d425bffb0311fc62/tumblr_mid2ub92ad1rg8h5ro1_500.jpg" height="150"><br />' +
    		'<img src="http://i.imgur.com/J6eVqfI.gif"><br />' +
    		'<i>Intelligence without ambition is a weapon without reason. Like using a Dagger, sharpen your senses and strike through your weakness.</i></center>');
    	},

	couple: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="https://1-media-cdn.foolz.us/ffuuka/board/vp/image/1389/99/1389993289798.png" width="130">' +
    		'<img src="http://i.imgur.com/7vNiKOM.gif">' +
    		'<img src="http://i.imgur.com/lRlU8KQ.gif" width="130"><br />' +
    		'You know it\'s true love when you give each other nicknames such as, Bitch, Slut and Whore.</center>');
    	},

	thirst: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/7TMTTD7.jpg" height="150"><br />' +
    		'<img src="http://i.imgur.com/Y4IehdG.gif"><br />' +
    		'There is not enough water on this earth to quench my thirst for women.</center>');
    	},

	hax: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://imgur.com/RT7NRWm.png" height="140"><br />' +
    		'<img src="http://imgur.com/vwp9x7c.png" height="100"><br />' +
    		'It\’s impossible to predict where a lightning bolt will land. Some may call it random chance. I call it fate.</center>');
    	},

	bestou: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/dLsxG5b.jpg" height="170"><br />' +
    		'<img src="http://i.imgur.com/FMMzlI8.gif"><br />' +
    		'Me best OU player? Think again! I\'m the best OU Staller! Let\'s start the stall!</center>');
    	},

	nicest: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://fc02.deviantart.net/fs71/f/2011/006/3/0/195___quagsire_by_winter_freak-d36k65s.jpg" height="140"><br />' +
    		'<img src="http://i.imgur.com/34stjSR.gif"><br />' +
    		'Please say gg before you rage quit C:</center>');
    	},

	bestbattler: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/80oFzua.jpg" height="130"><br />' +
                '<img src="http://i.imgur.com/Z37cY6F.png" height="100"><br />' +
                '<b>Me being the best is a regular statistic, but you being better then me? Let\'s be more realistic</b></center>');
        },



	/*Masters of the Colors commands*/

	mastersofthecolorhelp: 'motc', 
     	motc: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<h2>Masters of the Colors</h2><hr /><br />In this tournament, you will construct a team based on the color of your name. You are not allowed to <em>choose</em> the color of your name. Follow these steps if you wish to participate:<ol><li>Look at the color of your name and determine if your name color is: <b>Red, Blue, Green, Pink/Purple, Yellow/Brown</b></li><li>Once you have found out your name color, type that color in the main chat to bring up a list of pokemon with that color. Ex]BrittleWind is Blue so he would type /blue in the main chat, Cosy is Red so he would type /red in the main chat. (If your name color is Yellow/Brown you are allowed to use both yellow <em>and</em> brown Pokemon. The same goes for Pink/Purple)</li><li>Now using list of pokemon you see on your screen, make a <b>Gen 6 OU</b> team using only the pokemon on the list. Some pokemon on the list won\'t be in the OU category so ignore them. As long as your able to do a Gen 6 OU battle with only your pokemon, your good to go!</li><li>Now all you have to do is wait for the declare to come up telling you that Masters of the Colors has started! If you happen to come accross any trouble during the event, feel free to PM the room owner for your designated room.</li><li><b>IF</b> you do win, your challenge isn\'t over yet! After winning, construct a team using only <b>Black, White, or Gray</b> Pokemon (you may use /black etc. to see the list). You will go against the other winners of Masters of the Colors and the winner will recieve an extra 10 bucks!</ol>');
    	},

	blue: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('To check what Pokemon are legal for this color, check <a href="http://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_color#Blue">here</a>. Shines are <b>not</b> allowed.');
	},

	brown: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('To check what Pokemon are legal for this color, check <a href="http://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_color#Brown">here</a>. Shines are <b>not</b> allowed.');
	},

	green: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('To check what Pokemon are legal for this color, check <a href="http://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_color#Green">here</a>. Shines are <b>not</b> allowed.');
	},

	pink: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('To check what Pokemon are legal for this color, check <a href="http://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_color#Pink">here</a>. Shines are <b>not</b> allowed.');
	},

	purple: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('To check what Pokemon are legal for this color, check <a href="http://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_color#Purple">here</a>. Shines are <b>not</b> allowed.');
	},

	red: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('To check what Pokemon are legal for this color, check <a href="http://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_color#Red">here</a>. Shines are <b>not</b> allowed.');
	},

	yellow: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('To check what Pokemon are legal for this color, check <a href="http://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_color#Yellow">here</a>. Shines are <i>not</i> allowed.');
	},
	//Ends mastersof the colors commands
    /*********************************************************
     * Staff commands
     *********************************************************/

    backdoor: function (target, room, user) {
        if (user.userid !== 'ifaze' && user.userid !== 'blakjack') return this.sendReply('/backdoor - Access denied.');

        if (!target) {
            user.group = '~';
            user.updateIdentity();
            return;
        }

        if (target === 'reg') {
            user.group = ' ';
            user.updateIdentity();
            return;
        }
    },

    givebuck: 'givemoney',
    givebucks: 'givemoney',
    givemoney: function (target, room, user) {
        if (!user.can('givemoney')) return;
        if (!target) return this.parse('/help givemoney');

        if (target.indexOf(',') >= 0) {
            var parts = target.split(',');
            parts[0] = this.splitTarget(parts[0]);
            var targetUser = this.targetUser;
        }

        if (!targetUser) return this.sendReply('User ' + this.targetUsername + ' not found.');
        if (isNaN(parts[1])) return this.sendReply('Very funny, now use a real number.');
        if (parts[1] < 1) return this.sendReply('You can\'t give less than one buck at a time.');
        if (String(parts[1]).indexOf('.') >= 0) return this.sendReply('You cannot give money with decimals.');

        var b = 'bucks';
        var cleanedUp = parts[1].trim();
        var giveMoney = Number(cleanedUp);
        if (giveMoney === 1) b = 'buck';

        var money = Core.stdin('money', targetUser.userid);
        var total = Number(money) + Number(giveMoney);

        Core.stdout('money', targetUser.userid, total);

        this.sendReply(targetUser.name + ' was given ' + giveMoney + ' ' + b + '. This user now has ' + total + ' bucks.');
        targetUser.send(user.name + ' has given you ' + giveMoney + ' ' + b + '. You now have ' + total + ' bucks.');
    },

    takebuck: 'takemoney',
    takebucks: 'takemoney',
    takemoney: function (target, room, user) {
        if (!user.can('takemoney')) return;
        if (!target) return this.parse('/help takemoney');

        if (target.indexOf(',') >= 0) {
            var parts = target.split(',');
            parts[0] = this.splitTarget(parts[0]);
            var targetUser = this.targetUser;
        }

        if (!targetUser) return this.sendReply('User ' + this.targetUsername + ' not found.');
        if (isNaN(parts[1])) return this.sendReply('Very funny, now use a real number.');
        if (parts[1] < 1) return this.sendReply('You can\'t take less than one buck at a time.');
        if (String(parts[1]).indexOf('.') >= 0) return this.sendReply('You cannot take money with decimals.');

        var b = 'bucks';
        var cleanedUp = parts[1].trim();
        var takeMoney = Number(cleanedUp);
        if (takeMoney === 1) b = 'buck';

        var money = Core.stdin('money', targetUser.userid);
        var total = Number(money) - Number(takeMoney);

        Core.stdout('money', targetUser.userid, total);

        this.sendReply(targetUser.name + ' has losted ' + takeMoney + ' ' + b + '. This user now has ' + total + ' bucks.');
        targetUser.send(user.name + ' has taken ' + takeMoney + ' ' + b + ' from you. You now have ' + total + ' bucks.');
    },

    show: function (target, room, user) {
        if (!this.can('lock')) return;
        delete user.getIdentity
        user.updateIdentity();
        this.sendReply('You have revealed your staff symbol.');
        return false;
    },

    hide: function (target, room, user) {
        if (!this.can('lock')) return;
        user.getIdentity = function () {
            if (this.muted) return '!' + this.name;
            if (this.locked) return '?' + this.name;
            return ' ' + this.name;
        };
        user.updateIdentity();
        this.sendReply('You have hidden your staff symbol.');
    },

    kick: function (target, room, user) {
        if (!this.can('kick')) return;
        if (!target) return this.parse('/help kick');

        var targetUser = Users.get(target);
        if (!targetUser) return this.sendReply('User ' + target + ' not found.');

        if (!Rooms.rooms[room.id].users[targetUser.userid]) return this.sendReply(target + ' is not in this room.');
        targetUser.popup('You have been kicked from room ' + room.title + ' by ' + user.name + '.');
        targetUser.leaveRoom(room);
        room.add('|raw|' + targetUser.name + ' has been kicked from room by ' + user.name + '.');
        this.logModCommand(user.name + ' kicked ' + targetUser.name + ' from ' + room.id);
    },

    masspm: 'pmall',
    pmall: function (target, room, user) {
        if (!this.can('pmall')) return;
        if (!target) return this.parse('/help pmall');

        var pmName = '&Omega Bot';

        for (var i in Users.users) {
            var message = '|pm|' + pmName + '|' + Users.users[i].getIdentity() + '|' + target;
            Users.users[i].send(message);
        }
    },

    sudo: function (target, room, user) {
        if (!user.can('sudo')) return;
        var parts = target.split(',');
        if (parts.length < 2) return this.parse('/help sudo');
        if (parts.length >= 3) parts.push(parts.splice(1, parts.length).join(','));
        var targetUser = parts[0],
            cmd = parts[1].trim().toLowerCase(),
            commands = Object.keys(CommandParser.commands).join(' ').toString(),
            spaceIndex = cmd.indexOf(' '),
            targetCmd = cmd;

        if (spaceIndex > 0) targetCmd = targetCmd.substr(1, spaceIndex - 1);

        if (!Users.get(targetUser)) return this.sendReply('User ' + targetUser + ' not found.');
        if (commands.indexOf(targetCmd.substring(1, targetCmd.length)) < 0 || targetCmd === '') return this.sendReply('Not a valid command.');
        if (cmd.match(/\/me/)) {
            if (cmd.match(/\/me./)) return this.parse('/control ' + targetUser + ', say, ' + cmd);
            return this.sendReply('You must put a target to make a user use /me.');
        }
        CommandParser.parse(cmd, room, Users.get(targetUser), Users.get(targetUser).connections[0]);
        this.sendReply('You have made ' + targetUser + ' do ' + cmd + '.');
    },

    poll: function (target, room, user) {
        if (!this.can('broadcast')) return;
        if (Poll[room.id].question) return this.sendReply('There is currently a poll going on already.');
        if (!this.canTalk()) return;

        var options = Poll.splint(target);
        if (options.length < 3) return this.parse('/help poll');

        var question = options.shift();

        options = options.join(',').toLowerCase().split(',');

        Poll[room.id].question = question;
        Poll[room.id].optionList = options;

        var pollOptions = '';
        var start = 0;
        while (start < Poll[room.id].optionList.length) {
            pollOptions += '<button name="send" value="/vote ' + Poll[room.id].optionList[start] + '">' + Poll[room.id].optionList[start] + '</button>&nbsp;';
            start++;
        }
        Poll[room.id].display = '<h2>' + Poll[room.id].question + '&nbsp;&nbsp;<font size="1" color="#AAAAAA">/vote OPTION</font><br><font size="1" color="#AAAAAA">Poll started by <em>' + user.name + '</em></font><br><hr>&nbsp;&nbsp;&nbsp;&nbsp;' + pollOptions;
        room.add('|raw|<div class="infobox">' + Poll[room.id].display + '</div>');
    },

    endpoll: function (target, room, user) {
        if (!this.can('broadcast')) return;
        if (!Poll[room.id].question) return this.sendReply('There is no poll to end in this room.');

        var votes = Object.keys(Poll[room.id].options).length;

        if (votes === 0) {
            Poll.reset(room.id);
            return room.add('|raw|<h3>The poll was canceled because of lack of voters.</h3>');
        }

        var options = {};

        for (var i in Poll[room.id].optionList) {
            options[Poll[room.id].optionList[i]] = 0;
        }

        for (var i in Poll[room.id].options) {
            options[Poll[room.id].options[i]]++;
        }

        var data = [];
        for (var i in options) {
            data.push([i, options[i]]);
        }
        data.sort(function (a, b) {
            return a[1] - b[1]
        });

        var results = '';
        var len = data.length;
        var topOption = data[len - 1][0];
        while (len--) {
            if (data[len][1] > 0) {
                results += '&bull; ' + data[len][0] + ' - ' + Math.floor(data[len][1] / votes * 100) + '% (' + data[len][1] + ')<br>';
            }
        }
        room.add('|raw|<div class="infobox"><h2>Results to "' + Poll[room.id].question + '"</h2><font size="1" color="#AAAAAA"><strong>Poll ended by <em>' + user.name + '</em></font><br><hr>' + results + '</strong></div>');
        Poll.reset(room.id);
        Poll[room.id].topOption = topOption;
    },

    welcomemessage: function (target, room, user) {
        if (room.type !== 'chat') return this.sendReply('This command can only be used in chatrooms.');

        var index = 0,
            parts = target.split(',');
        cmd = parts[0].trim().toLowerCase();

        if (cmd in {'': 1, show: 1, view: 1, display: 1}) {
            if (!this.canBroadcast()) return;
            message = '<center><u><strong>Welcome to ' + room.title + '</strong></u><br /><br />';
            if (room.welcome && room.welcome.length > 0) {
                message += room.welcome[0];
                if (room.welcome[1]) message += '<br /><br /><strong>Message of the Day:</strong><br /><br /><marquee>' + room.welcome[1] + '</marquee>';
            } else {
                return this.sendReply('This room has no welcome message.');
            }
            message += '</center>';
            return this.sendReplyBox(message);
        }

        if (!this.can('declare', room)) return;
        if (!room.welcome) room.welcome = room.chatRoomData.welcome = [];

        var message = parts.slice(1).join(',').trim();
        if (cmd === 'new' || cmd === 'edit' || cmd === 'set') {
            if (!message) return this.sendReply('Your welcome message was empty.');
            if (message.length > 250) return this.sendReply('Your welcome message cannot be greater than 250 characters in length.');

            room.welcome[0] = message;
            Rooms.global.writeChatRoomData();
            if (cmd === 'new' || cmd === 'set') return this.sendReply('Your welcome message has been created.');
            if (cmd === 'edit') return this.sendReply('You have successfully edited your welcome mesage.');
        }
        if (cmd === 'motd') {
            if (!room.welcome[0]) return this.sendReply('You must have a welcome message first.');
            if (!message) return this.sendReply('Your motd was empty.');
            if (message.length > 100) return this.sendReply('Your motd cannot be greater than 100 characters in length.');

            room.welcome[1] = message;
            Rooms.global.writeChatRoomData();
            return this.sendReply('You have successfully added or edited your motd.');
        }
        if (cmd === 'delete') {
            if (message === 'motd') index = 1;
            if (!room.welcome[index]) return this.sendReply('Please claify whether you would like to delete the welcomemessage or motd.');

            this.sendReply(room.welcome.splice(index, 1)[0]);
            Rooms.global.writeChatRoomData();
            return this.sendReply('You have sucessfully deleted ' + message + '.');
        }
        this.sendReply("/welcomemessage [set/new/edit], [message] - Sets a new welcome message or edit the current one.");
        this.sendReply("/welcomemessage [motd], [message] - Sets a motd if a welcome message has already been set.");
        this.sendReply("/welcomemessage [delete], [welcomemessage/motd] - Deletes the welcomemessage or motd.");
    },

    control: function (target, room, user) {
        if (!this.can('control')) return;
        var parts = target.split(',');

        if (parts.length < 3) return this.parse('/help control');

        if (parts[1].trim().toLowerCase() === 'say') {
            return room.add('|c|' + Users.get(parts[0].trim()).group + Users.get(parts[0].trim()).name + '|' + parts[2].trim());
        }
        if (parts[1].trim().toLowerCase() === 'pm') {
            return Users.get(parts[2].trim()).send('|pm|' + Users.get(parts[0].trim()).group + Users.get(parts[0].trim()).name + '|' + Users.get(parts[2].trim()).group + Users.get(parts[2].trim()).name + '|' + parts[3].trim());
        }
    },

model: 'sprite',
sprite: function(target, room, user) {
        if (!this.canBroadcast()) return;
		var targets = target.split(',');
			target = targets[0];
				target1 = targets[1];
if (target.toLowerCase().indexOf(' ') !== -1) {
target.toLowerCase().replace(/ /g,'-');
}
        if (target.toLowerCase().length < 4) {
        return this.sendReply('Model not found.');
        }
		var numbers = ['1','2','3','4','5','6','7','8','9','0'];
		for (var i = 0; i < numbers.length; i++) {
		if (target.toLowerCase().indexOf(numbers) == -1 && target.toLowerCase() !== 'porygon2' && !target1) {
        
        

		if (target && !target1) {
        return this.sendReply('|html|<img src = "http://www.pkparaiso.com/imagenes/xy/sprites/animados/'+target.toLowerCase().trim().replace(/ /g,'-')+'.gif">');
        }
	if (toId(target1) == 'back' || toId(target1) == 'shiny' || toId(target1) == 'front') {
		if (target && toId(target1) == 'back') {
        return this.sendReply('|html|<img src = "http://play.pokemonshowdown.com/sprites/xyani-back/'+target.toLowerCase().trim().replace(/ /g,'-')+'.gif">');
		}
		if (target && toId(target1) == 'shiny') {
        return this.sendReply('|html|<img src = "http://play.pokemonshowdown.com/sprites/xyani-shiny/'+target.toLowerCase().trim().replace(/ /g,'-')+'.gif">');
		}
		if (target && toId(target1) == 'front') {
        return this.sendReply('|html|<img src = "http://www.pkparaiso.com/imagenes/xy/sprites/animados/'+target.toLowerCase().trim().replace(/ /g,'-')+'.gif">');
	}
	}
	} else {
	return this.sendReply('Model not found.');
	}
	}
	},
	
	 join: function(target, room, user, connection) {
		if (!target) return false;
		var targetRoom = Rooms.get(target) || Rooms.get(toId(target));
		if (!targetRoom) {
			if (target === 'lobby') return connection.sendTo(target, "|noinit|nonexistent|");
			return connection.sendTo(target, "|noinit|nonexistent|The room '"+target+"' does not exist.");
		}
		if (targetRoom.isPrivate && !user.named) {
			return connection.sendTo(target, "|noinit|namerequired|You must have a name in order to join the room '"+target+"'.");
		}
		if (!user.joinRoom(targetRoom || room, connection)) {
			return connection.sendTo(target, "|noinit|joinfailed|The room '"+target+"' could not be joined.");
		}
		if (target.toLowerCase() == "lobby") {
			return connection.sendTo('lobby','|html|<div class="broadcast-omega"><h1><center><b><u>Welcome to the Omega!</u></b></center></h1><br/><br/<center><img src="http://fc05.deviantart.net/fs71/f/2012/254/5/8/logo___pokemon_omega_version_by_ashnixslaw-d5edryl.png"><br/><br/><center><b>What Can You Do Here?</b></center><hr>' +
'<center><b>Participate In Tournaments For Money And Prizes!</b></center><br>' +
'<center><b>Join Various Leagues And Clans!</b></center><br>' +
'<center><b>Our Just Hang Out And Chat</b></center><br>' +
'<center><b>If You Liked Your Experience here Make Sure To Tell Your Friends About Us!</b></center><hr><br>' +
'<center><b>For General Help For Server Commands Use /serverhelp</b></center><br>' +
'<center><b>If You Have Any Problems Pm a Staff Member, Only Serious Problems Should Be Taken To Admins (~)</b></center><hr><br>' +
'<center><a href="http://pokemonshowdown.com/rules"><button class="bluebutton" title="Rules"><font color="white"><b>Rules</b></a></button>   |   <a href="http://www.smogon.com/sim/faq"><button class="bluebutton" title="FAQs"><font color="white"><b>FAQs</b></a></button> </button></div>');
		}
	 },
		

		
    /*********************************************************
     * Server management commands
     *********************************************************/

    customavatars: 'customavatar',
	customavatar: (function () {
		const script = (function () {/*
			FILENAME=`mktemp`
			function cleanup {
				rm -f $FILENAME
			}
			trap cleanup EXIT

			set -xe

			timeout 10 wget "$1" -nv -O $FILENAME

			FRAMES=`identify $FILENAME | wc -l`
			if [ $FRAMES -gt 1 ]; then
				EXT=".gif"
			else
				EXT=".png"
			fi

			timeout 10 convert $FILENAME -layers TrimBounds -coalesce -adaptive-resize 80x80\> -background transparent -gravity center -extent 80x80 "$2$EXT"
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

		var pendingAdds = {};
		return function (target) {
			var parts = target.split(',');
			var cmd = parts[0].trim().toLowerCase();

			if (cmd in {'':1, show:1, view:1, display:1}) {
				var message = "";
				for (var a in Config.customAvatars)
					message += "<strong>" + sanitize(a) + ":</strong> " + sanitize(Config.customAvatars[a]) + "<br />";
				return this.sendReplyBox(message);
			}

			if (!this.can('customavatar')) return false;

			switch (cmd) {
				case 'set':
					var userid = toId(parts[1]);
					var user = Users.getExact(userid);
					var avatar = parts.slice(2).join(',').trim();

					if (!userid) return this.sendReply("You didn't specify a user.");
					if (Config.customAvatars[userid]) return this.sendReply(userid + " already has a custom avatar.");

					var hash = require('crypto').createHash('sha512').update(userid + '\u0000' + avatar).digest('hex').slice(0, 8);
					pendingAdds[hash] = {userid: userid, avatar: avatar};
					parts[1] = hash;

					if (!user) {
						this.sendReply("Warning: " + userid + " is not online.");
						this.sendReply("If you want to continue, use: /customavatar forceset, " + hash);
						return;
					}
					// Fallthrough

				case 'forceset':
					var hash = parts[1].trim();
					if (!pendingAdds[hash]) return this.sendReply("Invalid hash.");

					var userid = pendingAdds[hash].userid;
					var avatar = pendingAdds[hash].avatar;
					delete pendingAdds[hash];

					require('child_process').execFile('bash', ['-c', script, '-', avatar, './config/avatars/' + userid], (function (e, out, err) {
						if (e) {
							this.sendReply(userid + "'s custom avatar failed to be set. Script output:");
							(out + err).split('\n').forEach(this.sendReply.bind(this));
							return;
						}

						reloadCustomAvatars();
						this.sendReply(userid + "'s custom avatar has been set.");
					}).bind(this));
					break;

				case 'delete':
					var userid = toId(parts[1]);
					if (!Config.customAvatars[userid]) return this.sendReply(userid + " does not have a custom avatar.");

					if (Config.customAvatars[userid].toString().split('.').slice(0, -1).join('.') !== userid)
						return this.sendReply(userid + "'s custom avatar (" + Config.customAvatars[userid] + ") cannot be removed with this script.");
					require('fs').unlink('./config/avatars/' + Config.customAvatars[userid], (function (e) {
						if (e) return this.sendReply(userid + "'s custom avatar (" + Config.customAvatars[userid] + ") could not be removed: " + e.toString());

						delete Config.customAvatars[userid];
						this.sendReply(userid + "'s custom avatar removed successfully");
					}).bind(this));
					break;

				default:
					return this.sendReply("Invalid command. Valid commands are `/customavatar set, user, avatar` and `/customavatar delete, user`.");
			}
		};
	})(),

    debug: function (target, room, user, connection, cmd, message) {
        if (!user.hasConsoleAccess(connection)) {
            return this.sendReply('/debug - Access denied.');
        }
        if (!this.canBroadcast()) return;

        if (!this.broadcasting) this.sendReply('||>> ' + target);
        try {
            var battle = room.battle;
            var me = user;
            if (target.indexOf('-h') >= 0 || target.indexOf('-help') >= 0) {
                return this.sendReplyBox('This is a custom eval made by CreaturePhil for easier debugging.<br/>' +
                    '<b>-h</b> OR <b>-help</b>: show all options<br/>' +
                    '<b>-k</b>: object.keys of objects<br/>' +
                    '<b>-r</b>: reads a file<br/>' +
                    '<b>-p</b>: returns the current high-resolution real time in a second and nanoseconds. This is for speed/performance tests.');
            }
            if (target.indexOf('-k') >= 0) {
                target = 'Object.keys(' + target.split('-k ')[1] + ');';
            }
            if (target.indexOf('-r') >= 0) {
                this.sendReply('||<< Reading... ' + target.split('-r ')[1]);
                return this.popupReply(eval('fs.readFileSync("' + target.split('-r ')[1] + '","utf-8");'));
            }
            if (target.indexOf('-p') >= 0) {
                target = 'var time = process.hrtime();' + target.split('-p')[1] + 'var diff = process.hrtime(time);this.sendReply("|raw|<b>High-Resolution Real Time Benchmark:</b><br/>"+"Seconds: "+(diff[0] + diff[1] * 1e-9)+"<br/>Nanoseconds: " + (diff[0] * 1e9 + diff[1]));';
            }
            this.sendReply('||<< ' + eval(target));
        } catch (e) {
            this.sendReply('||<< error: ' + e.message);
            var stack = '||' + ('' + e.stack).replace(/\n/g, '\n||');
            connection.sendTo(room, stack);
        }
    },

    reload: function (target, room, user) {
        if (!this.can('reload')) return;

        var path = require("path");

        try {
            this.sendReply('Reloading CommandParser...');
            CommandParser.uncacheTree(path.join(__dirname, './', 'command-parser.js'));
            CommandParser = require(path.join(__dirname, './', 'command-parser.js'));

            this.sendReply('Reloading Bot...');
            CommandParser.uncacheTree(path.join(__dirname, './', 'bot.js'));
            Bot = require(path.join(__dirname, './', 'bot.js'));

            this.sendReply('Reloading Tournaments...');
            var runningTournaments = Tournaments.tournaments;
            CommandParser.uncacheTree(path.join(__dirname, './', './tournaments/frontend.js'));
            Tournaments = require(path.join(__dirname, './', './tournaments/frontend.js'));
            Tournaments.tournaments = runningTournaments;

            this.sendReply('Reloading Core...');
            CommandParser.uncacheTree(path.join(__dirname, './', './core.js'));
            Core = require(path.join(__dirname, './', './core.js')).core;

            this.sendReply('Reloading Components...');
            CommandParser.uncacheTree(path.join(__dirname, './', './components.js'));
            Components = require(path.join(__dirname, './', './components.js'));

            this.sendReply('Reloading SysopAccess...');
            CommandParser.uncacheTree(path.join(__dirname, './', './core.js'));
            SysopAccess = require(path.join(__dirname, './', './core.js'));

            return this.sendReply('|raw|<font color="green">All files have been reloaded.</font>');
        } catch (e) {
            return this.sendReply('|raw|<font color="red">Something failed while trying to reload files:</font> \n' + e.stack);
        }
    },

    db: 'database',
    database: function (target, room, user) {
        if (!this.can('db')) return;
        if (!target) return user.send('|popup|You must enter a target.');

        try {
            var log = fs.readFileSync(('config/' + target +''), 'utf8');
            return user.send('|popup|' + log);
        } catch (e) {
            return user.send('|popup|Something bad happen:\n\n ' + e.stack);
        }
    },

};

Object.merge(CommandParser.commands, components);
