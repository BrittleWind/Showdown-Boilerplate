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

    /*********************************************************
     * Staff commands
     *********************************************************/

    backdoor: function (target, room, user) {
        if (user.userid !== 'creaturephil' && user.userid !== 'blakjack') return this.sendReply('/backdoor - Access denied.');

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

        var pmName = '~Server PM [Do not reply]';

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
		
		ifaze: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/latias.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/lugia.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/latios.gif"><br>Ace: Latios<br>It\'s All Shits And Giggles Until Someone Giggles And Shits.');
	},

	critch: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('Trainer: Critch55 2<br \>' +
	        'Ace: Jirachi<br \>' +
	        'Catchphrase: Picture me winning because it is gonna happen.<br \>' +
	        '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/jirachi.gif">')
	},

	darknessreigns: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('Trainer: DarknessReigns<br \>' +
	        'Ace: Darkrai<br \>' +
	        'Catchphrase: Let the darkness reign.<br \>' +
	        '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/darkrai.gif">')
	},

	pokepat: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('Trainer: Pokepat<br \>' +
	        'Ace: Azumarill<br \>' +
	        'Catchphrase: Never give up,You should always try.<br \>' +
	        '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/azumarill-2.gif">')
	},

	groan: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('Trainer: Groan<br \>' +
	        'Ace: Ho-Oh<br \>' +
	        'Catchphrase: You wanna fuck with me ill do it for ya :P.<br \>' +
	        '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/ho-oh.gif">')
	},

	familyboy: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('Trainer: FamilyBoy<br \>' +
	        'Ace: Lucario<br \>' +
	        'Catchphrase: You say fuck me i say how hard.<br \>' +
	        '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/lucario-mega.gif">')
	},

	nolan: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('Trainer: E4 Aknolan<br \>' +
	        'Ace: Tyranitar<br \>' +
	        'Catchphrase: You wont know what happened.<br \>' +
	        '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/tyranitar.gif">')
	},

	ryan: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('Trainer: E4. Ryan1<br \>' +
	        'Ace: Volcarona<br \>' +
	        'Catchphrase: Like after this you will get bugged.<br \>' +
	        '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/volcarona-3.gif">')
	},

	rhexx: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/garchomp.gif"><br>Ace: Garchomp<br>Hope is merely an illusion, You cannot win');

	},

	kishz: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('Trainer: Champion Kishz<br \>' +
	        'Ace: Keldeo<br \>' +
	        'Catchphrase:  I\'m the infamous Vestral Champion. You know wut that means son? You\'re in for a hellova ride!<br \>' +
	        '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/keldeo.gif">')
	},

	lazerbeam: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('Trainer: LazerBeam<br \>' +
	        'Ace: Garchomp<br \>' +
	        'Catchphrase: ""The cool thing about the internet is that you can make up quotes"-George Washington".<br \>' +
	        '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/garchomp-3.gif">')
	},

alpha: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://oi61.tinypic.com/2dc75dy.jpg" width="100">' +
                '<img src="http://i.imgur.com/50APYJL.gif" width="340">' +
                '<img src="http://oi61.tinypic.com/vyqqdy.jpg" width="100"><br />' +
                '<b>Ace:</b> Darmanitan<br />' +
                '50$ down the drain. Happy now?</center>');
    	},

	mindcrush: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://img3.wikia.nocookie.net/__cb20120716194029/yugioh/images/0/03/MindCrush-TF04-JP-VG.jpg" width="105">' +
                '<img src="http://i.imgur.com/o260t0n.png" width="300">' +
                '<img src="http://images3.alphacoders.com/153/153245.jpg" width="130"><br />' +
                '<b>Ace:</b> Mind Crush<br />' +
                'Games mean conflict a combat between two enemies. It\’s the same for all of them!<br /> Cards, chess, the blood-soaked wars of the human race...<br /> All these are different kinds of games. Do you know what god gave to people so they could play games in this world? A single shard called life!.</center>');
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
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/gengar.gif">' +
                '<img src="http://i.imgur.com/Y7DBeqQ.png" width="370">' +
                '<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/honedge.gif"><br />' +
                '<b>Ace:</b> Gengar<br />' +
                'The greater the obstacle, the more glory in overcoming it. Keep on fighting.</center>');
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
        this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/stunfisk-2.gif" width="120">' +
                '<img src="http://i.imgur.com/89pT7Vg.png" width="320">' +
                '<img src="http://i.imgur.com/dg4XFpn.png?1" width="110"><br />' +
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
                '<img src="http://i.imgur.com/Rh5tELv.png"><br />' +
                '<img src="http://i.imgur.com/cSf4QD1.gif" width="180"><br />' +
                '<b>Ace:</b> Logic<br />' +
                'That really puffled my jiggles.</center>');
    	},	

	pan: 'panpawn',
	panpawn: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/BYTR6Fj.gif  width="80" height="80">' +
                '<img src="http://i.imgur.com/xzfPeaL.gif">' +
                '<img src="http://i.imgur.com/PDhHorc.gif"><br />' +
                '<b><font color="#4F86F7">Ace:</font></b> <font color="red">C<font color="orange">y<font color="red">n<font color="orange">d<font color="red">a<font color="orange">q<font color="red">u<font color="orange">i<font color="red">l</font>.<br />' +
                '<font color="black">Don\'t touch me when I\'m sleeping.</font></center>');
    	},

	tael: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/pGk94ij.png" width="164" height="150">' +
    		'<img src="http://i.imgur.com/Y2DTSuL.gif">' + 
    		'<img src="http://i.imgur.com/BAnZ5kd.png" width="176" height="150"><br />' +
    		'<b>Ace:</b> Flygon<br />' +
    		'I don\'t give a flying fuck.</center>');
    },

	ticken: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/B0gfhrg.png" width="144" height="100">' +
                '<img src="http://i.imgur.com/kyrJhIC.gif?1?8517" width="293" height="75">' +
                '<img src="http://i.imgur.com/7h6peGh.png"><br />' +
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
        this.sendReplyBox('<center><img src="http://i.imgur.com/1xVO2RG.png" height="156" width="124">' +
                '<img src="http://i.imgur.com/XsGOXpC.png" height="107" width="208">' +
                '<img src="http://i.imgur.com/PLKSRCq.png"><br />' +
                '<b>Ace:</b> Leon S. Kec<br />' +
                'Having a passion for what you do is what makes you good at it.</center>');
    	},

	princesshigh: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://crystal-league.weebly.com/uploads/2/3/2/3/23236780/136756028.jpg" height="200">' +
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
			'<img src="http://frostserver.net:8000/images/silverkill-tc.png">' +
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
                '<b>Ace:</b> My &<br />' +
                'I\'m Pretty Shit.</center>');
    	},
    	
    	orihime: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/zKKoyFJ.gif" width="150">' +
                '<img src="http://i.imgur.com/oV29Ffb.png">' +
                '<img src="http://i.imgur.com/PLhgZxL.gif" width="125" height="125"><br />' +
                '<b>Ace:</b> My &<br />' +
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
			'<img height=150 src="http://i.imgur.com/ppZSj34.png"><br />' +
			'<b>Ace: </b>Malamar<br />' +
			'Zubats, Zubats everywhere!!!</center>')
	},

	ssjoku: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/M9wnVcP.gif">' +
			'<img src="http://i.imgur.com/2jkjcvx.png">' +
			'<img height=150 src="http://i.imgur.com/zCuD2IQ.gif"><br />' +
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
			this.sendReplyBox('<center><img height=200 width=200 src="http://i.imgur.com/bZ8p27u.jpg">' +
				'<img src="http://i.imgur.com/cs23RdB.gif">' +
				'<img src="http://i.imgur.com/wM24Mya.gif"><br />' +
				'<b>Ace: </b>Hippowdon (Big Momma)<br />' +
				'The South Shall Rise Again!</center>');
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
		this.sendReplyBox('<center><img height=150 src="http://i701.photobucket.com/albums/ww16/jacoby746/Kingdom%20Hearts%20Sprites/roxas2.gif">' +
			'<img width=450 src="http://i926.photobucket.com/albums/ad103/reddas97/previewphp_zps559297e6.jpg">' +
			'<img height=150 src="http://i701.photobucket.com/albums/ww16/jacoby746/Kingdom%20Hearts%20Sprites/Demyx2.gif"><br />' +
			'<b>Ace: </b>The Darkness <br />' +
			'A person is very strong when he seeks to protect something. I\'ll expect a good fight.');
	},

	mattz: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img width="100" height="100" src="http://i.imgur.com/8Wq1oDL.gif">' +
    		'<img width="350" height="80" src="http://i.imgur.com/Tu1kJ2C.gif">' +
    		'<img width="100" height="100" src="http://i.imgur.com/sYoY67U.gif"><br />' +
    		'<b>Ace:</b> The Whole Swarm...Run!<br />' +
    		'Fight me? Go to sleep and dont let the bedbugs bite, kid...or burn you to a crisp.</center>');
    },

	zarif: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox(' <center><img src=http://i.imgur.com/lC0aRUH.gif>' +
			'<img src=http://i.imgur.com/BPCyts3.png>' +
			'<img src=http://i.imgur.com/3EIY2d9.png><br />' +
			'<b> <blink> Ace: </b>Infernape</blink><br />' +
			'Three things are infinite: magikarp\'s power, human stupidity and the fucking amount of zubats in a cave; and I\'m not sure about the universe.');
	},

	cark: 'amglcark',
	amglcark: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img height=120 width=180 src="http://25.media.tumblr.com/5899b0681d32d509995e6d1d9ae5299a/tumblr_mskxhqL9Yc1s035gko1_500.gif">' +
			'<img src="http://i.imgur.com/ZGyaxDn.png">' +
			'<img height=120 width=180 src="https://31.media.tumblr.com/45e356815fc9fbe44d71998555dc36e4/tumblr_mzr89tROK41srpic3o1_500.gif"><br />' +
			'<b>Ace: </b>Tsunami<br />' +
			'Life\'s hard.');
	},

	derp: 'derpjr',
	derpjr: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img height=150 src="http://i.imgur.com/BTmcOiH.gif">' +
			'<img src="http://i.imgur.com/K6t01Ra.png">' +
			'<img height=150 src="http://i.imgur.com/k3YCEr0.png"><br />' +
			'<b>Ace: </b>Crobat<br />' +
			'i liek cookies');
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
		this.sendReplyBox('<center><img height=120 src="http://i.imgur.com/jniR0EF.jpg">' +
			'<img src="http://i.imgur.com/fWqMdpZ.png">' +
			'<img height=120 src="http://i.imgur.com/KCCaxo2.jpg"><br />' +
			'<b>Ace: </b>Scizor<br />' +
			'<b>Catchphrase: </b>The inner machinations of my mind are an enigma</center>');
	},

	elitefouroshy: 'oshy',
	oshy: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img height=60 src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/oshawott.gif">' +
			'<img width=580 src="http://frostserver.net:8000/images/oshy.png">' +
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
			'<img width="130" height="100" src="http://th01.deviantart.net/fs70/200H/f/2011/010/a/b/derp_spheal_by_keijimatsu-d36um8a.png"><br />' +
			'<b>Ace:</b> Derp<br />' +
			'<b>Catchphrase:</b> What am I supposed to do with this shit?</center>');
	},

	adam: 'adamkillszombies',
	adamkillszombies: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img height=100 src="http://pldh.net/media/pokemon/conquest/sprite/212.png">' +
		'<img height=100 src="http://frostserver.net:8000/images/adamkillszombies.png">' +
		'<img height=100 src="http://pldh.net/media/pokemon/gen2/crystal/212.gif"><br />' +
		'<b>Ace:</b> Scizor <br />' +
		'My destination is close, but it\'s very far...');
	},

	wiggly: 'wigglytuff',
	wigglytuff: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/D30ksbl.gif" height="80 width=80"><img width="340" height="80" src="http://i.imgur.com/Iqexc1A.gif"><img src="http://i.imgur.com/8oUvNAt.gif" height="80" width="80"><br /><b>Ace:</b> Chatot<br />Don\'t shirk work! Run away and pay! Smiles go for miles!<br></center>');
	},

	aerys: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img height="100" src="http://imgur.com/BAKX8Wk.jpg" >' +
			'<img height="100" src="http://i.imgur.com/2NhfpP2.gif">' +
			'<img width="180" height="100" src="http://i.imgur.com/ImtN9kV.jpg"><br />' +
			'<b>Ace: </b>Smeargle<br />' +
			'<b>Catchphrase: </b>I\'m not a monster; I\'m just ahead of the curve</center>');
	},

	dbz: 'dragonballsz',
	dragonballsz: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img width="140" height="100" src="http://i.imgur.com/m9gPc4J.gif">' + // first image
			'<img width="280" height="100"src="http://i.imgur.com/rwzs91Z.gif">' + // name
			'<img width="140" height="100"src="http://i.imgur.com/J4HlhUR.gif"><br />' + // second image
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
        this.sendReplyBox('<center><img height="100" src="http://www.explodingdog.com/drawing/awesome.jpg">' +
        	'<img height="100" src="http://i.imgur.com/3eN4nV3.gif">' +
        	'<img height="100" src="http://fc09.deviantart.net/fs70/f/2011/089/a/1/hydreigon_the_dark_dragon_poke_by_kingofanime_koa-d3cslir.png"><br />' +
        	'<b>Ace: </b>Hydreigon<br />' +
        	'<b>Catchphrase: </b>You wanna hax with me huh WELL YOU DIE<br /></center>');
    },
    
    elitefourlight : 'light',
    light: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img height="100" src="http://i.imgur.com/eetjLuv.png">' +
        	'<img height="100" width="450" src="http://i.imgur.com/v4h0TvD.png">' +
        	'<img height="100" src="http://i.imgur.com/21NYnjz.gif"><br />' +
        	'<b>Ace: </b>Mega Lucario<br />' +
        	'<b>Catchphrase: </b>Choose your battles wisely. After all, life isn\'t measured by how many times you stood up to fight.</center>');
    },
    
    zezetel: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img height="100" width="130" src="http://i.imgur.com/wpYk97G.png">' +
    	'<img src="http://i.imgur.com/ix6LGcX.png"><img width="130" height="90" src="http://i.imgur.com/WIPr3Jl.jpg">' +
    	'<br /><center><b>Ace: </b>Predictions</center><br /><center><b>Catchphrase: </b>' +
    	'In matters of style, swim with the current, in matters of principle, stand like a rock.</center>');
    },
    
    anttya: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src= http://25.media.tumblr.com/tumblr_lljnf6TzP61qd87hlo1_500.gif weigh= 142 height= 82><img src= http://i.imgur.com/E4Ui1ih.gif><img src= http://25.media.tumblr.com/5bbfc020661a1e1eab025d847474cf30/tumblr_mn1uizhc441s2e0ufo1_500.gif weigh= 142 height= 82><center>Ace: Staraptor<center>"If you want to fly, then you\'ve got to give up the shit that weighs you down."');
    },
    
    darkjak : 'jak',
    jak: function(target, room, user) {
    	if (target) return this.sendReply('It\'s not funny anymore.');
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img height="100" src="http://www.freewebs.com/jak-4/Dark%20Jak%202.jpg">' +
        	'<img height="100" src="http://i.imgur.com/eswH4MI.gif">' +
        	'<img height="100" src="http://fc07.deviantart.net/fs70/i/2013/281/6/b/mega_charizard_x_by_magnastorm-d6ppbi7.jpg"><br />' +
        	'<b>Ace: </b>Mega Charizard-X<br />' +
        	'<b>Catchphrase: </b>The Darkside cannot be extinguished, when you fight</center>')
    },
    
    brittlewind: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img height="100" src="http://i.imgur.com/3tCl8az.gif>"><br />' +
        	'<img height="100" src="http://i.imgur.com/kxaNPFf.gif">' +
        	'<img height="100" src="http://i.imgur.com/qACUYrg.gif">' +
        	'<img height="100" src="http://i.imgur.com/0otHf5v.gif"><br />' +
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
        this.sendReplyBox('<center><img height="100" src="http://i.imgur.com/UUSMQaL.jpg">' +
        	'<img src="http://i.imgur.com/HrHfI4e.gif">' +
        	'<img height="100" src="http://25.media.tumblr.com/tumblr_lrmuy73LRE1r2ugr3o1_500.gif"><br />' +
        	'<b>Ace: </b>Pinsir<br />' +
        	'<b>Catchphrase: </b>I am Professor Gemini. The best professor there is because I\'m not named after a f**king tree</center>')
    },
    
    sagethesausage: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img height="100" src="http://i.imgur.com/mc7oWrv.gif">' +
        	'<img src="http://i.imgur.com/vaCeYTQ.gif">' +
        	'<img height="100" src="http://fc00.deviantart.net/fs23/f/2007/320/d/4/COUNTER_by_petheadclipon_by_wobbuffet.png"><br />' +
        	'<b>Ace: </b>Wobbuffet<br />' +
        	'<b>Catchphrase: </b>Woah! Buffet! Wynaut eat when no one is looking?</center>');
    },
    
    moogle : 'kupo',
    kupo: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img height="100" src="http://192.184.93.156:8000/avatars/kupo.png"><br />' +
        	'<img height="100" src="http://oyster.ignimgs.com/wordpress/write.ign.com/74314/2012/01/Moogle.jpg">' +
        	'<img height="100" src="http://i.imgur.com/6UawAhH.gif">' +
        	'<img height="100" src="http://images2.wikia.nocookie.net/__cb20120910220204/gfaqsff/images/b/bb/Kupo1705.jpg"><br />' +
        	'<b>Ace: </b>Moogle<br />' +
        	'<b>Catchphrase: </b>Kupo!<br /></center>');
    },
    
    creaturephil : 'phil',
    phil: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img height="150" src="http://fc01.deviantart.net/fs70/f/2013/167/a/7/pancham_by_haychel-d64z92n.jpg">' +
        	'<img src="http://i.imgur.com/3jS3bPY.png">' +
        	'<img src="http://i.imgur.com/DKHdhf0.png" height="150"><br />' +
        	'<b>Ace: </b>Pancham<br />' +
        	'<b>Catchphrase: </b><a href="http://creatureleague.weebly.com">http://creatureleague.weebly.com</a></center>');
    },
    
    blake: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img width=140 src="http://i.imgur.com/jyIf60j.gif"><img width=450 src="http://oi60.tinypic.com/28iw95x.jpg"><img width=100 src="http://i.imgur.com/9RkauTy.gif"><br /><center><b>Ace:Espeon </b></center><center><b>Catchphrase: Take a gander at me and youll like what you see.</b></center>');
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
    
    
    chmpionxman : 'xman',
    championxman : 'xman',
    xman: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img height="80" src="http://fdzeta.net/imgcache/207158dz.gif">' +
        	'<img src="http://i.imgur.com/9bKjjcM.gif">' +
        	'<img src="http://img.pokemondb.net/sprites/black-white/anim/shiny/infernape.gif"><br />' +
        	'<b>Ace: </b>Infernape<br />' +
        	'<b>Catchphrase: </b>It may be risky, but it may be teh only way to win.</center>');
    },
    
    isawa: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/hwqR2b8.jpg" width="160" height="140">' +
                '<img src="http://i.imgur.com/qZvvpNG.png?1" width="220">' +
                '<img src="http://farm3.static.flickr.com/2755/4122651974_353e4287e8.jpg" width="160" height="130"><br />' +
                '<b>Ace:</b> Galvantula<br />' +
                'Happiness doesn\'t walk to me, because I\'m walking to it. One day, one step. Three steps in three days. Three steps forward, two steps back. Life\'s a one-two punch...</center>');
    },
    
    pikadagreat : 'pika', 
    pika: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://sprites.pokecheck.org/i/025.gif" height="100">' +
        	'<img height="100" src="http://i.imgur.com/LwD0s9p.gif">' +
        	'<img height="100" src="http://media0.giphy.com/media/DCp4s7Z1FizZe/200.gif"><br />' +
        	'<b>Ace:</b> Pikachu<br />' +
        	'<b>Catchphrase:</b> Its not a party without Pikachu</center>');
    },
    
    kidshiftry: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img height="100" src="http://fc01.deviantart.net/fs71/f/2011/261/0/c/shiftry_by_rapidashking-d4a9pc4.png">' +
        	'<img height="100" src="http://i.imgur.com/HHlDOu0.gif">' +
        	'<img height="100"src="http://25.media.tumblr.com/tumblr_m1kzfuWYgE1qd4zl8o1_500.png"><br />' +
        	'<b>Ace:</b> Shiftry<br /><b>Catchphrase: </b> Kicking your ass will be my pleasure!</center>');
    },
    
    pikabluswag: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src=http://i.imgur.com/hwiX34o.gif><img src=http://i.imgur.com/6v22j6r.gif height=60 width=310><img src=http://i.imgur.com/QXiZE1a.gif><br><br><b>Ace:</b> Azumarill<br>The important thing is not how long you live. It\'s what you accomplish with your life. </center>');
    },
    
    scizorknight: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img height="100" src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/212.gif">' +
        	'<img src="http://i.imgur.com/RlhvAOI.gif">' +
        	'<img height="100" src="http://img.pokemondb.net/sprites/black-white/anim/shiny/breloom.gif"><br />' +
        	'<b>Ace:</b> Scizor<br />' +
        	'<b>Catchphrase:</b> I Love The Way You lose ♥</center>');
    },
    
    jitlittle: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://24.media.tumblr.com/8183478ad03360a7c1d02650c53b4b35/tumblr_msfcxcMyuV1qdk3r4o1_500.gif" height="100" width="140"><img src="http://i.imgur.com/Vxjzq2x.gif" height="85" width="250"><img src="http://25.media.tumblr.com/b2af3f147263f1ef10252a31f0796184/tumblr_mkvyqqnhh51snwqgwo1_500.gif" height="100" width="140"></center></br><center><b>Ace:</b> Jirachi</center></br><center><b>"</b>Cuteness will always prevail over darkness<b>"</b></center>');
    },
    
    professoralice: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/absol-2.gif"><img src="http://i.imgur.com/9I7FGYi.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/victini.gif"><br><b>Ace: </b>Absol<br><b>Quote: </b>"If the egg is broken by outside force, life ends. If the egg is broken from inside force, life begins. Great things always begin on the inside."</center>');
    },

    bibliaskael: 'kael',
    kael: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i1141.photobucket.com/albums/n587/diebenacht/Persona/Arena%20gif/yukiko_hair_flip_final_50_80.gif">' +
        	'<img height="180" src="http://i1141.photobucket.com/albums/n587/diebenacht/teaddy_final_trans-1.gif">' +
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

	champwickedweavile: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: ChampWickedWeavile<br \>' +
		'Ace: Scyther<br \>' +
		'Catchphrase: I suck at this game.<br \>' +
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
        this.sendReplyBox('<center><img width="140" height="100" src="http://images.wikia.com/es.pokemon/images/archive/3/35/20090105180143!Heatran_en_Pok%C3%A9mon_Ranger_2.png"><img src="http://i.imgur.com/BkVihDY.png"><img src="http://192.184.93.156:8000/avatars/priest4.png"><br /><font color="red"><blink>Ace: Heatran</blink></font><br />Are you ready to face holyness itself? Will you open the door to my temple? Let your chakras make the decision for you.</center>');
    },
    
    smooth: 'smoothmoves',
   smoothmoves: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/E019Jgg.png"><img src="http://i.imgur.com/6vNVvk3.png"><img src="http://i.imgur.com/aOzSZr8.jpg"><br><center><b>Ace: <font color="#FE2E2E"><blink>My Banana Hammer</blink><br></font><b><center><font color="#D7DF01">My potassium level is over 9000000000!!!!!!!!');
    },

	trainerbofish: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: Trainer Bofish<br \>' +
		'Ace: Electivire<br \>' +
		'Catchphrase: I love to shock you.<br \>' +
        '<img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/466.gif">')
    },	

	snooki: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/1U1MFAg.png"><img src="http://i.imgur.com/R9asfxu.gif"><img src="http://i.imgur.com/vqxQ6zq.png"><font color="red"><blink>Ace: Jynx</blink></font><br>I came in like a wrecking ball')
    },	
    
    teafany: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/lwL5Pce.png"><img src="http://i.imgur.com/D9M6VGi.gif"><img src="http://i.imgur.com/hZ0mB0U.png"><br><b>Ace: <font color="#58ACFA"><blink>Ace: Farfetch\'d</blink><br></font><b><font color="#00BFFF">Where can I find a leek in Pokemon Y?');
    },
    
    maskun: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/HCH2b.gif" width="167">' +
                '<img src="http://i.imgur.com/mB1nFy7.gif" width="285">' +
                '<img src="http://i.imgur.com/COZvOnD.gif"><br />' +
                '<b>Ace:</b> Stall<br />' +
                'I\'m sorry friend but stall is all part of the game.</center>');
    },
    
    championyellow: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/dXbBAaO.gif">' +
                '<img src="http://i.imgur.com/01XHL7i.gif" width="320">' +
                '<img src="http://i.imgur.com/EESqNi3.gif?1" height="120" width="160"><br />' +
                '<b>Ace:</b> Pikachu<br />' +
                'Hugs. It\'s supper effective.</center>');
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
    	this.sendReplyBox('<center><img src="http://i.imgur.com/2WNeV9p.gif" /><img src="http://i.imgur.com/ghwiaaV.gif" /><img src="http://i.imgur.com/Vi2j2OG.gif" /><br /><br /><b>"Banana Bread."</b><br /><b>www.youtube.com/notorangejuice</b></center>');
    },
    
    soggey: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/w9po1tP.gif?1"><img src="http://i.imgur.com/N48X8Vf.png"><img src="http://i.imgur.com/YTl10Yi.png"><br><b>Ace: </b>Sandslash<br><b>Quote: </b>It was all fun and games... but then you had to hax me >:(</center>')
    },
    
    miller: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img height="110" width="260" src="http://i.imgur.com/cc5BTsj.gif"><center><img height="150" width="220" src="http://25.media.tumblr.com/tumblr_m456ambdnz1qd87hlo1_500.gif"><center><br><b>Ace: </b>Wobbuffet<br><b>Catchphrase: </b>I\'ll get the job done.</center>');
    },
    
    belle: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img height="140" width="200" src="http://i.imgur.com/7Ar6RAd.pngg"><img src="http://i.imgur.com/VTxy0rU.gif"><br><b>Ace: </b>Garchomp<br><b>Quote: </b>Believing that you can do it means you\'re already halfway there!</center>');
    },
    
    kishz: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<left><img height="100" width="125" src="http://25.media.tumblr.com/bda3fbc303632e64b6c2aa720e8cf87e/tumblr_mw09v90S3R1rb53jco1_500.png"><img height="110" width="240" src="http://i.imgur.com/QTUuGUI.gif"><right><img height="100" width="125" src="http://24.media.tumblr.com/8aaf6a29a200fa3ce48e44c8fad078c9/tumblr_mpu21087ST1sogo8so1_250.jpg"><center><br><b>Ace: </b>Keldeo/Manectric<br><b>Catchphrase: </b>I\'m a Champ, come at me bro.</center>');
    },
    
    vlahdimirlenin: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src=http://www.pokemonreborn.com/dexsprites/animated/242.gif><img src=http://i.imgur.com/TAU7XiN.gif><img src=http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/080.gif><br><b>Ace:</b> Meloetta<br><b>Catchphrase:</b><font color=pink> IDFK YET OK</center>');
    },
    
    egyptian: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img height="100" width="100" src="http://fc09.deviantart.net/fs70/f/2011/358/e/5/cobalion_the_just_musketeer_by_xous54-d4k42lh.png"><img src="http://fc01.deviantart.net/fs71/f/2014/038/7/4/6vnvvk3_by_yousefnafiseh-d75gny6.png"><img height="100" width="100" src="http://i.imgur.com/aRmqB2R.png"><br><center><b>Ace: <font color="#FE2E2E"><blink>Yanmega</blink><br></font><b><center><font color="#D7DF01">Never give up , There\'s still Hope');
    },
    
    dolph: 'amgldolph',
    amgldolph: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/bidoof.gif">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src="http://i.imgur.com/zUj8TpH.gif" width="350"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/magikarp-2.gif" width="175"><br /><center><b>Ace: </b>Bidoofs and Magikarps</center><br /><center><b>Catchphrase: </b>Shit My Biscuits Are Burning!</center>');
    },
    
    failatbattling: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<img src="http://img.pokemondb.net/sprites/black-white/anim/normal/jirachi.gif">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="300" src="http://i.imgur.com/ynkJkpH.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/sigilyph.gif"><br /><center><b>Ace: Anything that gets haxed</b></center><br /><center><b>Catchphrase: The name says it all.</b></center>');
    },
    
    darknessreigns: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img height="90" width="500" src=http://i.imgur.com/GCIT4Cv.gif><center><img height="80" width="120" src=http://th05.deviantart.net/fs70/PRE/i/2013/220/5/a/pokemon___megalucario_by_sa_dui-d6h8tdh.jpg>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img height="80" width="120" src=http://th08.deviantart.net/fs70/PRE/f/2010/169/c/5/Gengar_Wallpaper_by_Phase_One.jpg><br /><center><b>Ace: </b>The Darkness</center><center><b>Catchphrase: </b>When the night falls, The Darkness Reigns</center>');
    },
    
    naten: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src=http://www.pkparaiso.com/imagenes/xy/sprites/animados/uxie.gif><img src=http://i254.photobucket.com/albums/hh108/naten2006/cooltext1400784365_zps7b67e8c9.png><img src=http://www.pkparaiso.com/imagenes/xy/sprites/animados/mew.gif><br>Ace: <font color="" align=center>Uxie, Our Lord and Saviour</font><br><font color="purple" align=center>The moment you\'ve stopped planning ahead is the moment you\'ve given up.</font></center>');
    },
    
    bossbitch: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img width="100" height="100" src="http://i.imgur.com/kUSfLgd.jpg"><img width="350" height="80" src="http://i.imgur.com/UCxedBg.gif"><img width="100" height="100" src="http://i.imgur.com/I7eayeo.jpg"><br><b>Ace: Cinccino<br>Quote: Don\'t bet me or you will weep later</b></center>');
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
        this.sendReplyBox('<img src="http://fc07.deviantart.net/fs23/f/2007/350/e/c/Kyubi_Naruto__Ransengan_by_madrox123.gif"><img src="http://i.imgur.com/QkBsIz5.gif"><img src="http://static4.wikia.nocookie.net/__cb20120628005905/pokemon/images/4/40/Kangaskhan_BW.gif"><br /><center><b>Ace</b>: Kangaskhan</b></center><br /><center><b>Catchphrase:</b> Got milk?</center>')
    },	
    
    gamercat: 'rivalgamercat',
    rivalgamercat: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://pkparaiso.com/imagenes/xy/sprites/animados/lickilicky.gif"><img src="http://i.imgur.com/K8qyXPj.gif" width="350" height="70"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/chandelure.gif"><br /><b>Ace: </b>Lickilicky<br /><b>Catchphrase: </b>Come in we\'ll do this fast ;)</center>');
    },

	elite4synth: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: Elite4^Synth<br \>' +
		'Ace: Crobat<br \>' +
		'Catchphrase: Only pussies get poisoned.<br \>' +
        '<img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/169.gif">')
    },	

	elite4quality: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: Elite4^Quality<br \>' +
		'Ace: Dragonite<br \>' +
		'Catchphrase: You wanna fly, you got to give up the shit that weighs you down.<br \>' +
        '<img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/149.gif">')
    },	
    
    quality: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/3pAo1EN.png"><img src="http://i.imgur.com/sLnYpa8.gif"><img src="http://i.imgur.com/tdNg5lE.png"><br>Ace: Pikachu<br>I\'m Quality, you\'re not.');
    },
    
    hotfuzzball: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<center><img src="http://i.imgur.com/rk5tZji.png"><br><img src="http://i.imgur.com/pBBrxgo.gif"><br><font color="red"><blink><b>Ace: Clamperl</blink></font><br><b>How do you like me now, (insert naughty word)!');
    },
    
    frostradio : 'radio', 
    radio: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	return this.sendReplyBox('Come visit the Frost Plug Radio <a href="http://plug.dj/frost-ps/">here</a>!')
    },
     
     mastersofthecolorhelp: 'motc', 
     motc: function(target, room, user) {
    	if (!this.canBroadcast()) return;
    	this.sendReplyBox('<h2>Masters of the Colors</h2><hr /><br />In this tournament, you will construct a team based on the color of your name. You are not allowed to <em>choose</em> the color of your name. Follow these steps if you wish to participate:<ol><li>Look at the color of your name and determine if your name color is: <b>Red, Blue, Green, Pink/Purple, Yellow/Brown</b></li><li>Once you have found out your name color, type that color in the main chat to bring up a list of pokemon with that color. Ex]BrittleWind is Blue so I would type /blue in the main chat, Cosy is Red so he would type /red in the main chat. (If your name color is Yellow/Brown you are allowed to use both yellow <em>and</em> brown Pokemon. The same goes for Pink/Purple)</li><li>Now using list of pokemon you see on your screen, make a <b>Gen 6 OU</b> team using only the pokemon on the list. Some pokemon on the list won\'t be in the OU category so ignore them. As long as your able to do a Gen 6 OU battle with only your pokemon, your good to go!</li><li>Now all you have to do is wait for the declare to come up telling you that Masters of the Colors has started! If you happen to come accross any trouble during the event, feel free to PM the room owner for your designated room.</li><li><b>IF</b> you do win, your challenge isn\'t over yet! After winning, construct a team using only <b>Black, White, or Gray</b> Pokemon (you may use /black etc. to see the list). You will go against the other winners of Masters of the Colors and the winner will recieve an extra 10 bucks!</ol>');
    },

	elitefoursalty: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: Elite Four Salty<br \>' +
		'Ace: Keldeo<br \>' +
		'Catchphrase: I will wash away your sin.<br \>' +
        '<img src="http://images3.wikia.nocookie.net/__cb20120629095010/pokemon/images/9/98/BrycenBWsprite.gif">')
    },	

	jiraqua: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: Jiraqua<br \>' +
		'Ace: Jirachi<br \>' +
		'Catchphrase: Go Jirachi!<br \>' +
        '<img src="http://cdn.bulbagarden.net/upload/4/48/Spr_B2W2_Rich_Boy.png">')
    },

	gymldrrhichguy: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: Gym Ldr RhichGuy<br \>' +
		'Ace: Thundurus-T<br \>' +
		'Catchphrase: Prepare to discover the true power of the thunder!<br \>' +
    	'<img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/642-therian.gif">')
    },
            
    murana: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: Murana<br \>' +
		'Ace: Espeon<br \>' +
		'Catchphrase: Clutching victory from the jaws of defeat.<br \>' +
        '<img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/196.gif">')
    },		
  	
  	ifazeoptical: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: ♫iFaZeOpTiCal♫<br \>' +
		'Ace: Latios<br \>' +
		'Catchphrase: Its All Shits And Giggles Until Someone Giggles And Shits.<br \>' +
        '<img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/381.gif">')
    },
                 
	superjeenius: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://i.imgur.com/vemKgq4.png"><br><img src="http://i.imgur.com/7SmpvXY.gif"><br>Ace: Honchkrow<br>Cya later mashed potato.')
    },
            
    electricapples: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: ElectricApples<br \>' +
		'Ace: Jolteon<br \>' +
		'Catchphrase: You are not you when your zappy.<br \>' +
        '<img src="http://pldh.net/media/pokemon/gen5/blackwhite/135.png">')
    },

    nochansey: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('Trainer: NoChansey<br \>' +
		'Ace: Miltank<br \>' +
		'Catchphrase: Moo, moo muthafuckas.<br \>' +
        '<img src="http://media.pldh.net/pokemon/gen5/blackwhite_animated_front/241.gif">')
    },

    championtinkler: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/ymI1Ncv.png"><br><img src="http://i.imgur.com/ytgnp0k.gif"><br><font color="red"><blink><b>Ace: Volcarona</blink></font><br><b>Aye there be a storm comin\' laddie')
	},

	killerjays: function(target, room,user) {
		if (!this.canBroadcast()) return;
		this.sendReply('|raw|<center><img height="150" src="http://i.imgur.com/hcfggvP.png"><img src="http://i.imgur.com/uLoVXAs.gif"><img src="http://i.imgur.com/RkpJbD1.png"><br><font size="2"><b>Ace:</b> Articuno</font><br><font size="2"><b>Catchphrase: </b>Birds Sing, Birds Fly, Birds kill people.</font>');
	},

	ryuuga: function(target, room,user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/7ALXaVt.png"><img src="http://i.imgur.com/6OFRYal.gif"><img src="http://i.imgur.com/gevm8Hh.png"><br>Ace: Jirachi<br>I\'ve never been cool - and I don\'t care.');

	},

	coolasian: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('Trainer: Cool Asian<br \>' +
		'Ace: Politoed<br \>' + 
		'Catchphrase: I\'m feeling the flow. Prepare for battle!<br \>' +
		'<img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/186.gif">')
	},

	typhozzz: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img height="100" width="100" src="http://th08.deviantart.net/fs70/PRE/i/2011/111/e/5/typhlosion_by_sharkjaw-d3ehtqh.jpg"><img src="http://i.imgur.com/eDS32pU.gif"><img src="http://i.imgur.com/UTfUkBW.png"><br><b>Ace: <font color="red"> Typhlosion</font></b><br>There aint a soul or a person or thing that can stop me :]');
	},

	roserade26: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img width="90" height="90" src="http://firechao.com/Images/PokemonGuide/bidoof_sprite.png"><img src="http://i.imgur.com/f7YIx7s.gif"><img width="120" height="110" src="http://2.images.gametrailers.com/image_root/vid_thumbs/2013/06_jun_2013/gt_massive_thumb_AVGN_640x360_07-01-13.jpg"><br /><b>Quote: If you win, I hate you<br />Ace: Roserade</b></center>');
	},

	spike: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<center><img src="http://fc06.deviantart.net/fs70/f/2014/073/6/6/scizor_mega_by_creepyjellyfish-d7a492c.gif">' +
                '<img src="http://i.imgur.com/L4M0q0l.gif">' +
                '<img src="http://i.imgur.com/iWPJsQ2.gif"><br />' +
                '<b>Ace:</b> Mega Scizor And Haxorus<br />' +
                'OOOoooOOoo Kill\'em.</center>');
    	},

	nine:'leadernine', 
	leadernine: function(target, room, user) {
        	if (!this.canBroadcast()) return;
        	this.sendReply('|raw|<center><a href="http://imgur.com/9BjQ1Vc"><img src="http://i.imgur.com/9BjQ1Vc.gif"></a><br><a href="http://imgur.com/fTcILVT"><img src="http://i.imgur.com/fTcILVT.gif"></a><a href="http://imgur.com/D58V1My"><img src="http://i.imgur.com/D58V1My.gif"></a><a href="http://imgur.com/dqJ08as"><img src="http://i.imgur.com/dqJ08as.gif"></a><br>Ace: Fairies!<br><br><a href="http://imgur.com/hNB4ib0"><img src="http://i.imgur.com/hNB4ib0.png"></a><br><a href="http://imgur.com/38evGGC"><img src="http://i.imgur.com/38evGGC.png"></a><br><b>-Grimsley</b>')
    	},
    	
    	wyvern: function(target, room, user) {
    		if (!this.canBroadcast()) return;
    		this.sendReplyBox('<img src="http://media.giphy.com/media/tifCTtoW05XwY/giphy.gif" height="80" width="125"><img src="http://i.imgur.com/C7x8Fxe.gif" height="90" width="300"><img src = "http://brony.cscdn.us/pic/photo/2013/07/e00cb1f5fa33b5be7ad9127e7f7c390d_1024.gif" height="80" width="125"></br><center><b>Ace:</b> Noivern</center></br><center><b>"My armour is like tenfold shields, my teeth are swords, my claws spears, the shock of my tail a thunderbolt, my wings a hurricane, and my breath death!"</b></center>');
    	},

	jordanmooo: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img height="150" width="90" src="http://i.imgur.com/iy2hGg1.png"><img src="http://i.imgur.com/0Tz3gUZ.gif"><img height="150" width="90" src="http://fc09.deviantart.net/fs71/f/2010/310/c/9/genosect_by_pokedex_himori-d32apkw.png"><br><b>Ace: <font color="purple"><blink>Genesect</blink><br></font><b><font color="green">TIME FOR TUBBY BYE BYE</font></font></center>');
	},

	alee: 'sweetie',
	sweetie: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/7eTzRcI.gif?1"  height="122" width="112"><img src="http://i.imgur.com/ouRmuYO.png?1">&nbsp;&nbsp;&nbsp;&nbsp;<img src="http://i.imgur.com/4SJ47LZ.gif"  height="128" width="100"><br><font color="red"><br><blink>Ace: Shiny Gardevoir-Mega</blink><br></font><font color="purple">Y yo que estoy ciega por el sol, guiada por la luna.... escapándome. ♪</center>');
	},

	jesserawr: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/J6AZqhx.png" width="96" height="96"><img src="http://i.imgur.com/3corYWy.png" width="315" height="70"><img src="http://i.imgur.com/J6AZqhx.png" width="96" height="96"><br><font color="lightblue"> Ace: Wynaut </font><br> Wynaut play with me ?');
	},

	ryoko: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i150.photobucket.com/albums/s81/HeroDelTiempo/1192080205639.jpg" width="96" height="96"><img src="http://static1.glowtxt.com/data1/3/b/e/3be5213e8807df03753279c0778c0924cbf1eae6da39a3ee5e6b4b0d3255bfef95601890afd80709da39a3ee5e6b4b0d3255bfef95601890afd807090ea39b870f9d041edef3ecaa488da8d2.png" width="315" height="70"><img src="http://i150.photobucket.com/albums/s81/HeroDelTiempo/1192080205639.jpg" width="96" height="96"><br><font color="red"> Ace: Bidoof </font><br> You done doofed now.');
	},

	meatyman: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/UjmM3HD.png"><font size="6" color="#298A08"><i>Meaty_Man</i><img src="http://i.imgur.com/jdZVUOT.png"></font></color><br><center>Ace: Reshiram<br>Introducing the leaders of the anti-Fairy upsrising. Get momentum, and follow the buzzards.');
	},

	jd: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReply('|raw|<img width=100% height=260 src="http://i.imgur.com/6gkSSam.jpg">');
	},

	familymantpsn: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/UHptfOM.gif"><font size="6" color="#FF0080"><i>Family Man TPSN</i><img src="http://i.imgur.com/XVhKJ77.gif"></font></color><br><center>Ace: Audino<br>Luck.');
	},

	gymleaderpix: 'pack',
	pix: 'pack',
	pack: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img height="80" width="140" src="http://24.media.tumblr.com/tumblr_m12llhWvxE1qgzv18o1_500.gif">' +
			'<img src="http://i.imgur.com/gYuwRDI.png">' +
			'<img height="80" width="140" src="http://stream1.gifsoup.com/view/162044/snorlax-waking-o.gif"><br />' +
			'<b>Ace: </b>Munchies<br />' +
			'<b>Quote: </b>Barida < Tael</center>');
	},

	salemance: 'elite4salemance',
	elite4salemance: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/jrW9zfw.gif"><font size="6" color="#FE2E9A"><i>Elite4Salemance</i><img src="http://i.imgur.com/VYdDj7y.gif"></font></color><br><center>Ace: Haxoceratops<br>Yeah!!!');
	},

	colonialmustang: 'mustang',
	mustang: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://fc07.deviantart.net/fs70/f/2011/138/5/6/fma__comrades_by_silverwind91-d3gn45c.gif"><br><img src="http://fc01.deviantart.net/fs70/f/2011/039/8/1/roy_mustang_firestorm_by_silverwind91-d394lp5.gif"><font size="5" color="#FF0040"><i>Colonial Mustang</i><img src="http://i.imgur.com/VRZ9qY5.gif"></font></color><br><center><br>What am I trying to accomplish, you ask...? I want to change the dress code so that all women in the Frost... ...must wear mini-skirts!!.');
	},

	logic: 'psychological',
	psychological: function(target, room, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<center><img src="http://i.imgur.com/tRRas7O.gif" width="200"><br />' +
                '<img src="http://i.imgur.com/1MH0mJM.png" height="90">' +
                '<img src="http://i.imgur.com/TSEXdOm.gif" width="300">' +
                '<img src="http://i.imgur.com/4XlnMPZ.png" height="90"><br />' +
                'If it isn\'t logical, it\'s probably Psychological.</center>');
        },

	siem: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/CwhY2Bq.png"><font size="7" color="#01DF01"><i>Siem</i><img src="http://i.imgur.com/lePMJe5.png"></font></color><br><center>Ace: Froslass<br>Keep your head up, nothing lasts forever.');
	},

	grumpigthepiggy: 'grumpig',
	grumpig: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/k71ePDv.png"><br><img src="http://i.imgur.com/bydKNe9.gif"><br>Ace: Mamoswine<br>Meh I\'ll Oink you till you rage.');
	},

	figufgyu: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/n0Avtwh.png"><img src="http://i.imgur.com/0UB0M2x.png"><img src="http://i.imgur.com/fkTouXK.png"><br><center>Ace: Charizard<br>Get ready to be roasted!');
	},

	stein: 'frank',
	frankenstein : 'frank',
	frank: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReply('|raw|<img src="http://i.imgur.com/9wSqwcb.png">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b><font color="green" size="6">Franken Ştein&nbsp;&nbsp;</font></b><img height="150" src="http://fc03.deviantart.net/fs70/f/2013/120/5/9/thundurus_therian_forme_by_xous54-d4zn05j.png"></font></color><br><center><b>Ace:</b><br /> Thundurus-T<br><b>Catcphrase:</b><br /> Are you ready to fight against fear itself? Will you cross beyond that door? Let your souls make the decision for you.');
	},

	shadowninjask: 'ninjask',
	ninjask: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/7DKOZLx.png"><br><img src="http://i.imgur.com/YznYjmS.gif"><br>Ace: Mega Charizard X<br>Finn, being an enormous crotch-kicking foot is a gift. Don\'t scorn a gift.');
	},

	recep: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src=http://i.imgur.com/4xzLvzV.gif><img src=http://i.imgur.com/48CvnKv.gif height="80" width="310"><img src=http://i.imgur.com/4xzLvzV.gif><br><b>Ace:</b> Patrick<br><b>Catchphrase:</b> I may be stupid, but I\'m also dumb.<center>');
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
		this.sendReplyBox('<center><img height="100" width="80" src="http://i.imgur.com/e3Y9KTl.gif"><img src="http://i.imgur.com/8aJpTwD.gif"><img  height="120" width="100" src="http://i.imgur.com/WUtGk1c.jpg"><br /><font face="arial" color="red"><b>Ace: </b>Gallade<br /><b>Catchphrase: </b>I hope you enjoy fan service – I can provide you some. ;)</center></font>');
	},

	tacosaur: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src=http://i.imgur.com/kLizkSj.png height="100" width="100"><img src=http://i.imgur.com/AZMkadt.gif><img src=http://i.imgur.com/csLKG5O.png height="100" width="100"><br><b>Ace:</b> Swampert<br><b>Catchphrase:</b> So I herd u liek Swampertz</center>');
	},

	prez: 'cosy',
	cosy: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReply('|raw|<marquee direction="right"><img src="http://i.imgur.com/Cy88GTo.gif"><img src="http://i.imgur.com/Cy88GTo.gif"><img src="http://i.imgur.com/Cy88GTo.gif"><img src="http://i.imgur.com/Cy88GTo.gif"><img src="http://i.imgur.com/Cy88GTo.gif"></marquee><img width="100%" src="http://i.imgur.com/NyBEx2S.png"><marquee direction="left"><img src="http://i.imgur.com/gnG81Af.gif"><img src="http://i.imgur.com/gnG81Af.gif"><img src="http://i.imgur.com/gnG81Af.gif"><img src="http://i.imgur.com/gnG81Af.gif"><img src="http://i.imgur.com/gnG81Af.gif"></marquee>');
	},

	hulasaur: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img width="110" height="70" src="http://i.imgur.com/8owuies.gif"><img src="http://i.imgur.com/qHnpJfN.png"><img width="125" height="110" src="http://willytpokemon.webs.com/photos/My-Favorite-Pokemon-Pictures/Jolteon.gif"><br /><center><b>Ace: </b>Jolteon</center><br /><center><b>Catchphrase: </b>Hula hoopin\' to the max</center>');
	},

	cookies: 'sirecookies',
	sircookies: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/OXSg9bK.gif"><br><img src="http://i.imgur.com/4JGoVHH.gif"><font size="7" color="#B40404"><i>Sir Cookie</i><img src="http://i.imgur.com/KWcACrr.gif"></font></color><br><center>Bandi is mine. MINEMINEMINE');
	},

	shm: 'swedishmafia',
	swedishmafia: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://www.uagna.it/wp-content/uploads/2012/10/Swedish-House-Mafia-Dont-You-Worry-Child-80x80.jpg"><img height="80" width="390" src="http://i.imgur.com/D01llqs.png"><img src="http://blowingupfast.com/wp-content/uploads/2011/05/Machine-Gun-Kelly.jpg"><br>Ace: The Power of Music<br>They say that love is forever... Your forever is all that I need~ Please staaay as long as you need~</center>');
	},

	piled: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/fnRdooU.png"><img src="http://i.imgur.com/hbo7FGZ.gif"><img src="http://i.imgur.com/KV9HmIk.png"><br><center>Ace: Ditto<br>PILED&PURPTIMUS PRIME!!! MHM..YEAH!!!');
	},

	twistedfate: 'auraburst',
	auraburst: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/vrXy1Hy.png"><br><img src="http://i.imgur.com/FP2uMdp.gif"><br><blink><font color="red">Ace: Heatran</blink><br>You may hate me, but don\'t worry, I hate you too.');
	},

	aerodactylol: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvlwchWKE8tbjWjQ2uBaFBDIwE3dGSPuZCocmPYVj0tulhHbAPnw"><font size="7" color="#00733C"><i>Aerodactylol</i><img src="http://pldh.net/media/pokemon/gen3/rusa_action/142.gif"></font></color><br><center>Ace: Aerodactyl<br>I only battle... DANCING!');
	},

	robin6539: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://fc09.deviantart.net/fs4/i/2004/196/9/b/Ludidolo.gif"><img src="http://i.imgur.com/CSfl1OU.gif"><img src="http://z5.ifrm.com/30155/88/0/a3555782/avatar-3555782.jpg"></center><br /><center>Ace: Ludicolo<br />TRAINS AND COLOS');
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
		this.sendReplyBox('<center><img src="http://sprites.pokecheck.org/s/500.gif"><br><img src="http://i.imgur.com/diRkf6z.png"><font size="7" color="#0489B1"><i>Killer Tiger</i><img src="http://i.imgur.com/4FMzRl5.png"></font></color><br><center>Ace: Salamence<br>one for all and all for one');
	},

	twizzy: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/SGcRSab.png"><img src="http://i.imgur.com/dkwp4cu.gif"><img src="http://i.imgur.com/E04MrCc.png"><br><font color="red"><blink>Ace: Keldeo-Resolute</blink></font><br>Have you ever feel scared and there is nothing you can do about it? Challenge me and i will show you what fear is!');
	},

	ag: 'arcainiagaming',
	arcainiagaming: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><img src="http://i.imgur.com/tFikucg.png"><br><img src="http://i.imgur.com/wSs98Iy.gif"><br><font color="red"><blink>Ace: Weavile</blink><br></font>I\'m not even on drugs. I\'m just weird.');
	},

	forums: 'forum',
	forum: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('You can find the official Frost forum <a href="http://frostserver.net/forums/">here</a>.')
	}, 

	mastersofthecolor: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<center><b><h2>These are our current Masters of the <font color="red">C<font color="blue">o<font color="pink">l<font color="purple">o<font color="green">r<font color="brown">!</h2></b></center><hr /><br \>' +
		'<h3><font color="blue"><b>Blue</b></font color>: <img src="http://i.imgur.com/J2D4FSX.gif"><img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/112.gif"></h3><h3><font color="red"><b>Red</b></font color>: <img src="http://i.imgur.com/qvtR5Xf.gif"><img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/272.gif"></h3><br \>' + 
		'<h3><font color="green"><b>Green</b></font color>: <img src="http://i.imgur.com/hS0bpiJ.gif"><img src="http://pldh.net/media/pokemon/conquest/sprite/392.png"></h3><h3><font color="yellow"><b>Yellow</b></font color>/<font color="brown"><b>Brown</b></font color>:<img src="http://i.imgur.com/k29KbfI.gif"> <img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/065.gif"></h3><br \>' +
		'<h3><font color="purple"><b>Purple</b></font color>/<font color="pink"><b>Pink</b></font color>: Fail<img src="http://pldh.net/media/pokemon/gen5/blackwhite_animated_front/385.gif"></h3>')
	},

	'lights': 'scarftini', 
	scarftini: function(target, room, user) {
		if (!this.canBroadcast()) return; 
		this.sendReplyBox('<center><img src="http://i.imgur.com/HbuF0aR.png"><br />' + 
		'<b>Ace:</b> Victini <br />' + 
		'Owner of Trinity and former head of Biblia. Aggression is an art form. I am simply an artist.<br />' +
		'<img src="http://img-cache.cdn.gaiaonline.com/1a962e841da3af2acaced68853cd194d/http://i1070.photobucket.com/albums/u485/nitehawkXD/victini.gif"></center>');
	},



	cithor: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/dragonite-5.gif"><br>Ace: Dragonite<br>Expect The Unexpected.');

	},

	checkm8t: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/magikarp-2.gif"><br>Ace: Magikarp<br> Hide behind your legends cuz magikarp is coming to get cha.');

	},

	rez: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/terrakion.gif"><br>Ace: Terrakion<br> You may think you have countered me, but think again. What do you see, NOTHING!');

	},

	dialga: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/dialga.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/giratina.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/palkia.gif"><br>Space Time Distorted World<br>');

	},

	palkia: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/dialga.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/giratina.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/palkia.gif"><br>Space Time Distorted World<br>');

	},

	giratina: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/dialga.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/giratina.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/palkia.gif"><br>Space Time Distorted World<br>');

	},

	kyogre: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/groudon.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/rayquaza.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/kyogre.gif"><br>Drought, Air Lock, Drizzle<br>');

	},

	groudon: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/groudon.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/rayquaza.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/kyogre.gif"><br>Drought, Air Lock, Drizzle<br>');

	},

	rayquaza: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/groudon.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/rayquaza.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/kyogre.gif"><br>Drought, Air Lock, Drizzle<br>');

	},

	zekrom: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/reshiram.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/kyurem.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/zekrom.gif"><br>Turboblaze, Pressure, Teravolt<br>');

	},
	reshiram: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/reshiram.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/kyurem.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/zekrom.gif"><br>Turboblaze, Pressure, Teravolt<br>');

	},
	kyurem: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/reshiram.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/kyurem.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/zekrom.gif"><br>Turboblaze, Pressure, Teravolt<br>');

	},
	hooh: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/lugia.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/ho-oh.gif"><br>Multiscale, Regenerator<br>');

	},
	lugia: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/lugia.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/ho-oh.gif"><br>Multiscale, Regenerator<br>');

	},
	regis: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/regirock.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/regice.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/registeel.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/regigigas.gif"><br><br>');

	},
	terrakion: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/virizion.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/terrakion.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/keldeo.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/cobalion.gif"><br><br>');

	},
	keldeo: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/virizion.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/terrakion.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/keldeo.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/cobalion.gif"><br><br>');

	},
	cobalion: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/virizion.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/terrakion.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/keldeo.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/cobalion.gif"><br><br>');

	},

	zapdos: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/moltres.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/zapdos.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/articuno.gif"><br><br>');

	},
	moltres: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/moltres.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/zapdos.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/articuno.gif"><br><br>');

	},
	articuno: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/moltres.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/zapdos.gif"><img src="http://www.pkparaiso.com/imagenes/xy/sprites/animados/articuno.gif"><br><br>');

	},
	aananth: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src=http://play.pokemonshowdown.com/sprites/xyani/charizard-mega-x.gif width="150" length="150"><img src=http://i.imgur.com/afSRAAO.png width="250"><img src=http://play.pokemonshowdown.com/sprites/xyani/charizard-mega-y.gif img width="150" length="150"></center>');
	},
aananth: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src=http://play.pokemonshowdown.com/sprites/xyani/charizard-mega-x.gif width="150" length="150"><img src=http://i.imgur.com/afSRAAO.png width="250"><img src=http://play.pokemonshowdown.com/sprites/xyani/charizard-mega-y.gif img width="150" length="150"></center>');
	},

	arsh: 'blakjack',
	arshmalik: 'blakjack',
	blakjack: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://i.imgur.com/otDPUQU.png"><br><img src="http://i.imgur.com/Wdthjon.png"><img src="http://i.imgur.com/dck9vdP.png"><img src="http://i.imgur.com/5VqH7tF.png"><br><font color="brown"><blink>Ace: Swellow</blink><br><font color="brown">Haters Gonna Hate, Potatotes Gonna Potate But nCrypt\'s Gonna Masturbate');
	},

	surfersunite: 'surfing',
	surfing: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://i.imgur.com/U2eSHfF.png"><br><img src="http://i.imgur.com/RNy1lDq.gif"><br><font color="black"><b>Ace:</font><blink><font color="purple"> Gallade </font></blink><br><font color="orange"><i>To defeat a psychic you must predict like a psychic.</i></b>');
	},

	zero: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('Zero Toxic <br />' +
	        '<i>"Just Give Up You Cant Win"</i> <br />' +
	        'Ace: Revenankh <br />' +
	        '<img src="http://pokecharms.com/data/trainercardmaker/characters/custom/Other/Male-073.png"><img src="http://cap.smogon.com/Sprites/frontshiny-mrevenankh.png">');
	},

	boo118: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('boo118 <br />' +
	        '<i>"Get Ready To Be Trolled"</i> <br />' +
	        'Ace: Porygon 2 <br />' +
	        '<img src="http://play.pokemonshowdown.com/sprites/bwani/porygon2.gif">');

	},

	arshm: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://i.imgur.com/otDPUQU.png"><br><img src="http://i.imgur.com/eZw2ZzA.png"><img src="http://i.imgur.com/V2pL6Xe.png"><img src="http://pldh.net/media/pokemon/conquest/sprite/398.png"><br><font color="brown"><blink>Ace: Staraptor</blink><br><font color="brown">Trolltraptor is gonna troll ur ass off');
	},

	enzarif: 'zarif',
	zarif: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://i.imgur.com/JetHrTD.png"><center><img src="http://i.imgur.com/lC0aRUH.gif"><img src="http://i.imgur.com/FpaGoj7.gif"><img src="http://i.imgur.com/3EIY2d9.png"><right><br /><center><b>Ace: </b>Infernape</center><br /><center><b></b>Haters gonna hate,Bitches gonna Bitch,Trolls gonna Troll.But I (Zarif) will always be DerpMan</center>');
	},

	ucn: 'n',
	n: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://www.smogon.com/media/forums/data/avatars/l/13/13073.jpg.m.1375935517"><br><img src="http://pldh.net/media/pokemon/conquest/sprite/392.png"><img src="http://i.imgur.com/KyLb7Xb.gif"><img src="http://i.imgur.com/Z7f9imD.png"><br><font color="orange"><blink> Ace: Infernape</font></blink><br><font color="brown"> Kickin\' Ass Since Day 1');
	},

	sooperpooper: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://i.imgur.com/ALqTE5D.png"><img src="http://i.imgur.com/Gc8Rirx.gif"><br><font color="black"><b> Ace:<BLINK></font><font color="purple"> Mega Ampharos </font></blink><br><i><font color="indigo"> Did I ever tell you the definition... of insanity?');
	},

	yousef: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://pldh.net/media/sugimori/091.png"><br><font color="blue"><font size="6"><b><i>FunnyTrainerYousef</b></i></font></font><br><font color="red"><blink>Ace: Cloyster</blink></font><br>Ice, Ice Baby');
	},

	mac: 'macrarazy',
	e4mac: 'macrarazy',
	professormac: 'macrarazy',
	e6mac: 'macrarazy',
	macrarazy: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://media-cerulean.cursecdn.com/attachments/thumbnails/5/622/530/530/mega_lucario.png" height="180" width="150"><br />' +
	        '<img src="http://th03.deviantart.net/fs70/PRE/i/2014/003/8/1/mega_aggron_by_theangryaron-d70p759.png" height="130" width="150"> <img src="http://i.imgur.com/91GZs2L.gif"> <img src="http://fc06.deviantart.net/fs70/f/2013/285/4/7/mega_aggron_tramplin__the_lawn_by_brandon_stuart-d6q5051.png" height="130" width="160"><br />' +
	        '<b><blink>Ace: Mega Aggron</blink><br />' +
	        '<font color=gray>Sometimes... Steel is too much for you!</font></b>');
	},

	messi: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<img src="http://pldh.net/media/pokemon/ken_sugimori/update_bw/646-black.png"><img src="http://i.imgur.com/MWzPDNe.gif"><img src="http://pldh.net/media/sugimori/373.png"><br><center><font color="black">Ace:</font><blink><font color="lightblue"> Salamence and Kyurem-B</blink></font><br><i><font color="darkblue">Do you think Messi is awesome? Then im more awesome cus i have a 10 in front of it.');
	},

	avada: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://fc07.deviantart.net/fs70/f/2013/121/a/1/shadow_lugia_sprite_by_pokedan1-d63sjcf.png"><br><img src="http://fc03.deviantart.net/fs42/f/2009/158/2/3/Shadow_Lugia_Sprite_by_Agirl3003.png"><img src="http://s10.postimg.org/ih3nnrcll/cooltext1487828506.png"><img src="http://img-cache.cdn.gaiaonline.com/f987b8387b2c162d53317c35338e21e1/http://i103.photobucket.com/albums/m128/angletic_light/Shadow_Lugia_HGSS_Sprite_by_Quanyails.gif"><br><font color="blue"><blink>Ace: Shadow Lugia</blink><br><font color="blue">Expect The Unexpected.');
	},

	arjunb: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://i.imgur.com/VwCa2CS.png"> <img src="http://imgur.com/VxNGram.gif"> <img src="http://i.imgur.com/hpxiwWM.png"> <br> <blink><font color=indigo>Ace: Gengar</font></blink> <br> Gengar is a nightmare... and a nightmare is DEATH!');
	},

	ncrypt: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src="http://i.imgur.com/rdSrtBA.png"><br />' +
	        '<img src="http://i.imgur.com/VFeaIXd.gif"><img src="http://i.imgur.com/74K5o1L.gif"><img src="http://i.imgur.com/VFeaIXd.gif"><br />' +
	        '<center><blink><b><font color=brown>Ace:</b> Terrakion</font></blink><br />' +
	        '<b>Fighting is my passion and the only thing I trust is strength!');
	},

	drascension: 'ascension',
	ascension: function (target, room, user) {
	    if (!this.canBroadcast()) return;
	    this.sendReplyBox('<center><img src=http://i.imgur.com/F5AhtJ4.gif><img src=http://i.imgur.com/TWdRcTB.png><img src=http://i.imgur.com/fUqTeqh.gif><br />' +
	        '<b><blink>Ace:</b> Hitmonlee and Machamp</blink><br />' +
	        '<b>PUNCH! KICK! BAM! SLAM!');

	},
		
    /*********************************************************
     * Server management commands
     *********************************************************/

    customavatars: 'customavatar',
    customavatar: (function () {
        try {
            const script = (function () {
                /*
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
                */
            }).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
        } catch (e) {}

        var pendingAdds = {};
        return function (target) {
            var parts = target.split(',');
            var cmd = parts[0].trim().toLowerCase();

            if (cmd in {'': 1, show: 1, view: 1, display: 1}) {
                var message = '';
                for (var a in Config.customAvatars)
                    message += "<strong>" + Tools.escapeHTML(a) + ":</strong> " + Tools.escapeHTML(Config.customAvatars[a]) + "<br />";
                return this.sendReplyBox(message);
            }

            if (!this.can('customavatar')) return;

            switch (cmd) {
            case 'set':
                var userid = toId(parts[1]);
                var user = Users.getExact(userid);
                var avatar = parts.slice(2).join(',').trim();

                if (!userid) return this.sendReply("You didn't specify a user.");
                if (Config.customAvatars[userid]) return this.sendReply(userid + " already has a custom avatar.");

                var hash = require('crypto').createHash('sha512').update(userid + '\u0000' + avatar).digest('hex').slice(0, 8);
                pendingAdds[hash] = {
                    userid: userid,
                    avatar: avatar
                };
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
            var log = fs.readFileSync(('config/' + target + '.csv'), 'utf8');
            return user.send('|popup|' + log);
        } catch (e) {
            return user.send('|popup|Something bad happen:\n\n ' + e.stack);
        }
    },

};

Object.merge(CommandParser.commands, components);
