'use strict';
/*jshint -W079 */
var sinon = require('sinon');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

goog.require('Branch');
goog.require('utils');

describe('Branch - new', function() {
	var branch;
	beforeEach(function() {
		branch = sinon.createStubInstance(Branch);
	});
	afterEach(function() {
		sinon.restore();
	});
	describe('referringLink', function() {
		it('test method exists', function() {
			sinon.assert.match(typeof branch.referringLink, "function");
		});
	});
});

describe('Server - jsonp request blocked by client', function() {
	var apiFile = path.join(__dirname, '..', 'src', '3_api.js');
	var loadServer = vm.runInThisContext(
		'(function(goog) {\n' + fs.readFileSync(apiFile, 'utf8') + '\nreturn Server;\n})',
		{ filename: apiFile, lineOffset: -1 }
	);
	var Server = loadServer({
		provide: function() { },
		require: function() { },
		json: goog.json
	});
	var storage = {
		get: function() {
			return false;
		}
	};
	var clock;
	var server;
	beforeEach(function() {
		clock = sinon.useFakeTimers();
		server = new Server();
		sinon.stub(server, 'createScript', function(src, onError) {
			window.setTimeout(onError, 1700);
		});
	});
	afterEach(function() {
		clock.restore();
	});
	it('reports the blocked load once without a timeout retry', function() {
		var callback = sinon.spy();
		var resource = {
			destination: 'https://app.link',
			endpoint: '/_r',
			method: utils.httpMethod.GET,
			jsonp: true
		};
		server.request(resource, { }, storage, callback);
		clock.tick(30000);
		sinon.assert.calledOnce(server.createScript);
		sinon.assert.calledOnce(callback);
		sinon.assert.calledWithExactly(
			callback,
			sinon.match.has('message', utils.messages.blockedByClient),
			null
		);
	});
});
