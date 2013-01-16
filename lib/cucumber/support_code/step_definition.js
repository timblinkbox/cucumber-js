var StepDefinition = function (pattern, code) {
  var Cucumber = require('../../cucumber');

  var self = {
    getPatternRegexp: function getPatternRegexp() {
      var regexp;
      if (pattern.replace) {
        var regexpString = pattern
          .replace(StepDefinition.UNSAFE_STRING_CHARACTERS_REGEXP, StepDefinition.PREVIOUS_REGEXP_MATCH)
          .replace(StepDefinition.QUOTED_DOLLAR_PARAMETER_REGEXP, StepDefinition.QUOTED_DOLLAR_PARAMETER_SUBSTITUTION)
          .replace(StepDefinition.DOLLAR_PARAMETER_REGEXP, StepDefinition.DOLLAR_PARAMETER_SUBSTITUTION);
        regexpString =
          StepDefinition.STRING_PATTERN_REGEXP_PREFIX +
          regexpString +
          StepDefinition.STRING_PATTERN_REGEXP_SUFFIX;
        regexp = RegExp(regexpString);
      }
      else
        regexp = pattern;
      return regexp;
    },

    matchesStepName: function matchesStepName(stepName) {
      var regexp = self.getPatternRegexp();
      return regexp.test(stepName);
    },

    invoke: function invoke(step, world, callback) {
      var cleanUp = function cleanUp() {
        Cucumber.Util.Exception.unregisterUncaughtExceptionHandler(handleException);
      };

      var codeCallback = function (error) {
        if (error) {
          codeCallback.fail(error);
        } else {
          var successfulStepResult = Cucumber.Runtime.SuccessfulStepResult({step: step});
          cleanUp();
          callback(successfulStepResult);
        }
      };

      codeCallback.pending = function pending(reason) {
        var pendingStepResult = Cucumber.Runtime.PendingStepResult({step: step, pendingReason: reason});
        cleanUp();
        callback(pendingStepResult);
      };

      codeCallback.fail = function fail(failureReason) {
        var failureException = failureReason || new Error(StepDefinition.UNKNOWN_STEP_FAILURE_MESSAGE);
        var failedStepResult = Cucumber.Runtime.FailedStepResult({step: step, failureException: failureException});
        cleanUp();
        callback(failedStepResult);
      };

	  // Previous version of the code had codeCallback as a parameter, but we'll exclude this and call it ourselves.
      var parameters      = self.buildInvocationParameters(step, null);
      var handleException = self.buildExceptionHandlerToCodeCallback(codeCallback);
      Cucumber.Util.Exception.registerUncaughtExceptionHandler(handleException);

      try {
        // Create an angular callback.  Angular just executes the function, so we wrap it here so we can include any parameters.
		var angularCallback =  function() { code.apply(this, parameters); };
		
		// Create an Angular scenario runner 'it' block		
		it(step.getKeyword() + ': ' + step.getName(), angularCallback);
		
		// Make the callback immediately as angular will actually run the tests, so we just tell Cucumber everything worked fine and let it continue
		codeCallback();
      } catch (exception) {
        handleException(exception);
      }
    },

    buildInvocationParameters: function buildInvocationParameters(step, callback) {
      var stepName      = step.getName();
      var patternRegexp = self.getPatternRegexp();
      var parameters    = patternRegexp.exec(stepName);
      parameters.shift();
      if (step.hasAttachment()) {
        var attachmentContents = step.getAttachmentContents();
        parameters.push(attachmentContents);
      }
	  
	  // If a callback exists, then include it, won't be required for angular integration.
      if (!!callback) {
		parameters.push(callback);	  
	  }
	  
      return parameters;
    },

    buildExceptionHandlerToCodeCallback: function buildExceptionHandlerToCodeCallback(codeCallback) {
      var exceptionHandler = function handleScenarioException(exception) {
        if (exception)
          Cucumber.Debug.warn(exception.stack || exception, 'exception inside feature', 3);
        codeCallback.fail(exception);
      };
      return exceptionHandler;
    }
  };


  // Check to see if 'stepStart' function has been defined in the global scope.
  if(typeof stepStart === 'function'){
    var originalCode = code;
    var originalInvoke = self.invoke;
    self.invoke = function invoke(step, world, callback) {
      code = function()
      {
        var parameters = Array.prototype.slice.call(arguments);
        var codeCallback = parameters.pop();

        // Create an angular callback.  Angular just executes the function, so we wrap it here so we can include any parameters.
        var stepCallback =  function() { originalCode.apply(world, parameters); };

        // Create an Angular scenario runner 'it' block
        stepStart(step.getKeyword() + ': ' + step.getName(), stepCallback);

        // Make the callback immediately as angular will actually run the tests, so we just tell Cucumber everything worked fine and let it continue
        codeCallback();
      };

      originalInvoke.call(self, step, world, callback);
    }
  }

  return self;
};

StepDefinition.DOLLAR_PARAMETER_REGEXP              = /\$[a-zA-Z_-]+/;
StepDefinition.DOLLAR_PARAMETER_SUBSTITUTION        = '(.*)';
StepDefinition.PREVIOUS_REGEXP_MATCH                = "\\$&";
StepDefinition.QUOTED_DOLLAR_PARAMETER_REGEXP       = /"\$[a-zA-Z_-]+"/;
StepDefinition.QUOTED_DOLLAR_PARAMETER_SUBSTITUTION = '"([^"]*)"';
StepDefinition.STRING_PATTERN_REGEXP_PREFIX         = '^';
StepDefinition.STRING_PATTERN_REGEXP_SUFFIX         = '$';
StepDefinition.UNSAFE_STRING_CHARACTERS_REGEXP      = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\|]/g;
StepDefinition.UNKNOWN_STEP_FAILURE_MESSAGE         = "Step failure";

module.exports = StepDefinition;
