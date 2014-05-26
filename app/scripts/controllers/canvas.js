'use strict';

angular.module('animatesApp')
	.controller('CanvasCtrl', function CanvasCtrl($scope, canvasService, timelineService, shapeCreator, animationService) {

		function onAnimationLoad() {
			$scope.$watch(function () {
				return timelineService.getCurrentTick();
			},
			function () {
				var frames = timelineService.getMediaFrames();
				canvasService.clear();
				angular.forEach(frames, function (frame) {
					canvasService.add(shapeCreator.createShapeFromFrame(frame, canvasService.getCanvasPosition()));
				});
			});
		}

		animationService.getInstance().addLoadCompleteObserver('CanvasCtrl', onAnimationLoad);
		
		//TODO review: http://stackoverflow.com/questions/14703517/angular-js-set-element-height-on-page-load
		//
		//TODO http://stackoverflow.com/questions/18291838/integrating-fabricjs-and-angularjs
	});