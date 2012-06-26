var Feature = function(keyword, name, description, line) {
  var Cucumber = require('../../cucumber');

  var background;
  var scenarios = Cucumber.Type.Collection();
  var tags      = [];

  var self = {
    getKeyword: function getKeyword() {
      return keyword;
    },

    getName: function getName() {
      return name;
    },

    getDescription: function getDescription() {
      return description;
    },

    getLine: function getLine() {
      return line;
    },

    addBackground: function addBackground(newBackground) {
      background = newBackground;
    },

    getBackground: function getBackground() {
      return background;
    },

    hasBackground: function hasBackground() {
      return (typeof(background) != 'undefined');
    },

    addScenario: function addScenario(scenario) {
      var background = self.getBackground();
      scenario.setBackground(background);
      scenarios.add(scenario);
    },

    getLastScenario: function getLastScenario() {
      return scenarios.getLast();
    },

    addTags: function setTags(newTags) {
      tags = tags.concat(newTags);
    },

    getTags: function getTags() {
      return tags;
    },

    acceptVisitor: function acceptVisitor(visitor, callback) {		
		// Create an angular describe block
		describeStart(self.getKeyword() + ': ' + self.getName(),function(endDescribeCallback) {
		  // Call each cucumber background and all scenarios
		  self.instructVisitorToVisitBackground(visitor, function() {
			self.instructVisitorToVisitScenarios(visitor, function() {
				// When background and scenarios have completed, close the describe block
				endDescribeCallback();				
				// Tell cucumber we've finished with the feature - we'll let angular deal with any errors.
				callback();				
			});
		  });		
		}, 
		self.getDescription());
    },

    instructVisitorToVisitBackground: function instructVisitorToVisitBackground(visitor, callback) {
      if (self.hasBackground()) {
        var background = self.getBackground();
        visitor.visitBackground(background, callback);
      } else {
        callback();
      }
    },

    instructVisitorToVisitScenarios: function instructVisitorToVisitScenarios(visitor, callback) {
      scenarios.forEach(function(scenario, iterate) {
        visitor.visitScenario(scenario, iterate);
      }, callback);
    }
  };
  return self;
};
module.exports = Feature;
