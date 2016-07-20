//KIMBOO SDK

/**
* Checks that what is of type Array.
**/
function isArray(what) {
	return Object.prototype.toString.call(what) === '[object Array]';
}

/**
* Checks if a String is null or empty-
**/
function isNullOrEmpty(someString) {
	return someString == null || someString.length == 0 || someString == "";
}

/**
* This class identifies the current logged user. The plugins need to know the current user
* In order to show or hide that information may be secret to the current logged user.
**/
function KimbooUser(jsonResponse) {
	this.isAdmin = function() { 
		/**
		* Returns true if the current user role is ADMIN.
		**/
		return (this.user.role == "ADMIN"); //TODO Security hole
	};
	this.isManager = function() {
		/**
		* Returns true if the current user role is MANAGER.
		**/
		return (this.user.role == "MANAGER"); //TODO Security hole
	};
	this.isEmployee = function() {
		/**
		* Returns true if the current user role is EMPLOYEE.
		**/
		return (this.user.role == "EMPLOYEE"); //TODO Security hole
	};
	this.hasRole = function(someRole) {
		/**
		* Returns true if the current user role is someRole.
		**/
		return (this.user.role == someRole);
	};
	this.user = jsonResponse.user;
	this.business = jsonResponse.business;
	this.apps = jsonResponse.apps;
}			

function KimbooTemplateEngine (html, options) {
	/**
	* Formats a HTML template with options which is a jsonObject.
	**/
	//Cleaning
	html = html.replace(/&lt;/g, '<');
	html = html.replace(/&gt;/g, '>');
	html = html.replace(/\n/g, '');
	//Check if conditionals
	//TODO This shouldn't exist we should process all conditionals with a single regex. Also too slow.
	var ifRegEx = /<%if\s*(\(.*\))\s*{%>(.*)<%}%>/gm;
	if (ifRegEx.test(html)) {
		ifRegEx.lastIndex = 0;
		var ifCondition = ifRegEx.exec(html)[1];
		ifRegEx.lastIndex = 0;
		var ifResultBody = ifRegEx.exec(html)[2];
		html = html.replace(ifRegEx, eval(ifCondition) ? (ifResultBody) : (""));
	}
	//Replace all the values
	var keys = Object.keys(options);
	for (var index = 0; index < keys.length; index++) {
		var key = keys[index];
		var regEx = new RegExp(/<%/.source + key + /%>/.source, 'g');
		html = html.replace(regEx, options[key] );
	}
	return html;
}

function KimbooSDK (pluginDevelopmentId) {
	this.serverHost = "http://private-2c058-kimboo.apiary-mock.com";
	this.pluginDevelopmentId = pluginDevelopmentId;
	this.currentUser = null;
	this.searchValue = "";
	this.containerNodeId = "";
	this.templateNodeId = "";
	this.searchField = "";
	this.finishedCallback = function(jsonResponse) { /*Dummy callback*/ return this; } ;
	this.format = KimbooTemplateEngine;
	this.store = function(searchValue) {
		/**
		* Stores the plugin data searchValue in the server.
		**/
		this.searchValue = searchValue;
		this.requestType = "POST";
		return this;
	};
	this.delete = function(searchValue) {
		/**
		* Delete the plugin data from searchField that matches searchValue.
		**/
		this.searchValue = searchValue;
		this.requestType = "DELETE";
		return this;
	};
	this.update = function(searchValue) {
		/**
		*  Delete the plugin data from searchField that matches searchValue.
		**/
		this.searchValue = searchValue;
		this.requestType = "PUT";
		return this;
	};
	this.search = function(searchValue) {
		/**
		* Retrieves the plugin data that matches the searchField and searchValue.
		**/
		this.searchValue = searchValue;
		this.requestType = "GET";
		return this;
	};
	this.field = function(searchField) {
		/**
		* Specifies by which field we want to filter the response.
		**/
		this.searchField = searchField;
		if (isNullOrEmpty(this.searchValue)) 
			throw "Before calling this method you must call one of the following methods: "
				+ " `search(aSearchValue)`\n"
				+ " `store(aSearchValue)`\n"
				+ " `update(aSearchValue)`\n"
				+ " `delete(aSearchValue)`\n";
		return this;
	};
	this.finished = function(onFinishedCallback) {
		/**
		* Specfies a callback that is gonna be triggered when the request to the server finishes.
		**/
		this.finishedCallback = onFinishedCallback;
		if (isNullOrEmpty(this.searchValue)) 
			throw "Before calling this method you must call one of the following methods: "
				+ " `search(aSearchValue)`\n"
				+ " `store(aSearchValue)`\n"
				+ " `update(aSearchValue)`\n"
				+ " `delete(aSearchValue)`\n";
		if (isNullOrEmpty(this.searchField)) 
			throw "Before calling this method you must call one of the following methods: "
				+ " `field(aSearchField)`\n";
		return this;
	};
	this.template = function(templateNodeId) {
		/**
		* Specifies a template to be used
		**/
		this.templateNodeId = templateNodeId;
		if (isNullOrEmpty(this.searchValue)) 
			throw "Before calling this method you must call one of the following methods: "
				+ " `search(aSearchValue)`\n"
				+ " `store(aSearchValue)`\n"
				+ " `update(aSearchValue)`\n"
				+ " `delete(aSearchValue)`\n";
		if (isNullOrEmpty(this.searchField)) 
			throw "Before calling this method you must call one of the following methods: "
				+ " `field(aSearchField)`\n";
		return this;
	};
	this.buildUrl = function() {
		/**
		* PRIVATE - Generates the server target url.
		**/
		var queryObj = { search_field : this.searchField, search_value : this.searchValue};
		return this.serverHost + "/plugin/" + this.pluginDevelopmentId + "/data?" +  $.param(queryObj);
	};
	this.render = function(containerNodeId) {
		/**
		* With the server-side json response triggered by the `search(aSearchValue)`, `store(aSearchValue)`,
		* `update(aSearchValue)` or `delete(aSearchValue)` methods and a template specified 
		* with the `template(aTemplateDomNodeId)` method we render the template.
		* If a container DOM node id was specified with the `within(someContainerDomNodeId)` method we take the 
		* template rendered with the server-side json data, and we add it inside that node.
		**/
		
		this.containerNodeId = containerNodeId
		
		if (isNullOrEmpty(this.searchValue)) 
			throw "Before calling this method you must call one of the following methods: "
				+ "`search(aSearchValue)`\n"
				+ "`store(aSearchValue)`\n"
				+ "`update(aSearchValue)`\n"
				+ "`delete(aSearchValue)`\n";
		if (isNullOrEmpty(this.searchField)) 
			throw "Before calling this method you must call one of the following methods: "
				+ "`field(aSearchField)`\n";
		if (isNullOrEmpty(this.templateNodeId)) 
			throw "Before calling this method you must call one of the following methods: "
				+ "`template(aTemplateDomNodeId)`\n";
				
		var that = this;
		$.get(this.buildUrl(), function(jsonResponse) {
			if (isArray(jsonResponse)) {
				for (var index = 0; index < jsonResponse.length; index++) {
					var jsonObject = jsonResponse[index];
					var htmlItem = that.format($(that.templateNodeId).parent().html(), jsonObject);
					$(that.containerNodeId).append(htmlItem);
				}
			} else {
				var jsonObject = jsonResponse;
				var htmlItem = that.format($(that.templateNodeId).parent().html(), jsonObject);
				$(that.containerNodeId).append(htmlItem);
			}
		});
	};
	this.execute = function() {
		/**
		* Sends a request to the server-side.
		**/
		var that = this;
		$.ajax(
			{
				type : this.requestType,
				url : this.buildUrl(),
				data : this.jsonPayload,
				success: this.finishedCallback
			});
	};
	//Current user intialization
	var that = this;
	$.get(this.serverHost + "/me", function(jsonResponse) {
		that.currentUser = new KimbooUser(jsonResponse);
	});
}
//END OF KIMBOO SDK