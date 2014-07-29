var getTemplate = require('../../Utils/getTemplate').getTemplate;
var SystemMessage = require('../../Shared/Types/SystemMessage').SystemMessage;
var when = require('when');
var nodefn = require('when/node');
var uuid = require('node-uuid');


function loginPost(deps, params) {
	var data = {
		login: params.req.body.login,
		password: params.req.body.password
	};
	var usersCollection = deps.mongo.collections.users;
	var promisedFind = nodefn.call(usersCollection.find({
		$and: [
			{ login: data.login },
			{ password: data.password }
		]
	}).toArray);

	return promisedFind.then(function (result) {
		if (result.length === 0) {
			return when.reject(new SystemMessage('Login or password is invalid.'));
		}
		var sessionID = uuid.v4();
		var expirationTime = 60 * 60 * 24; // one hour
		deps.redis.client.setex('sessionID:' + sessionID, expirationTime, result[0]._id);
		params.res.cookie('sessionID', sessionID, { expires: new Date(Date.now + (expirationTime * 1000)) });
		return when.resolve(new SystemMessage('You are log in now.'));
	}).then(function (resolveMessage) {
		return resolveMessage;
	}).catch(function (rejectMessage) {
		return rejectMessage;
	}).then(function (message) {
		params.res.send(getTemplate('jade', __dirname + '/../Templates/login.jade', { content: message.content }));
		return when.resolve(true);
	});
}

module.exports.loginPost = loginPost;