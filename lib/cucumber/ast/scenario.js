var Scenario = function(keyword, name, description, uri, line) {
  var Cucumber = require('../../cucumber');

  var background;
  var steps = Cucumber.Type.Collection();
  var tags  = [];

  var self = {
    setBackground: function setBackground(newBackground) {
      background = newBackground;
    },

    getKeyword: function getKeyword() {
      return keyword;
    },

    getName: function getName() {
      return name;
    },

    getDescription: function getDescription() {
      return description;
    },

    getUri: function getUri() {
      return uri;
    },

    getLine: function getLine() {
      return line;
    },

    getBackground: function getBackground() {
      return background;
    },

    addStep: function addStep(step) {
      var lastStep = self.getLastStep();
      step.setPreviousStep(lastStep);
      steps.add(step);
    },

    getLastStep: function getLastStep() {
      return steps.getLast();
    },

    addTags: function setTags(newTags) {
      tags = tags.concat(newTags);
    },

    getTags: function getTags() {
      return tags;
    },

	acceptVisitor: function acceptVisitor(visitor, callback) {
		// Create an angular describe block for the current scenario
		describeStart(self.getKeyword() + ': ' + self.getName(), function(endDescribeCallback) {
		  // Visit each of the background steps
		  self.instructVisitorToVisitBackgroundSteps(visitor, function() {
			// Visit each of the scenario steps
			self.instructVisitorToVisitScenarioSteps(visitor, function() {
				// Close the describe block
				endDescribeCallback();
				// Tell cucumber we've finished - we'll let angular deal with any errors in the step.
				callback();				
			});
		  });		
		}, 
		self.getDescription());		
    },

    instructVisitorToVisitBackgroundSteps: function instructVisitorToVisitBackgroundSteps(visitor, callback) {
      var background = self.getBackground();
      if (typeof(background) != 'undefined') {
        var steps = background.getSteps();
        self.instructVisitorToVisitSteps(visitor, steps, callback);
      } else {
        callback();
      }
    },

    instructVisitorToVisitScenarioSteps: function instructVisitorToVisitScenarioSteps(visitor, callback) {
      self.instructVisitorToVisitSteps(visitor, steps, callback);
    },

    instructVisitorToVisitSteps: function instructVisitorToVisitSteps(visitor, steps, callback) {
      steps.forEach(function(step, iterate) {
        visitor.visitStep(step, iterate);
      }, callback);
    }
  };
  return self;
};
module.exports = Scenario;
