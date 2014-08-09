'use strict';

angular.module('animatesApp')
	.controller('PropertiesPanelCtrl', function PropertiesPanelCtrl($scope, $rootScope, canvasService, animationService, propertyUpdateManagerService, localAnimationStateService, shapeHelper) {
		$scope.properties = null;
		$scope.groupProperties = null;
		$scope.mediaObjectId = null;

		var animationUpdateEventHandler = function animationUpdateEventHandler (target, operation, params) {
			var selectedShapes = localAnimationStateService.getSelectedShape(),
				mediaObjectId = params.mediaObjectId || params.mediaObject.getGuid();

			if (selectedShapes !== null) {
				if (shapeHelper.getGuidFromView(selectedShapes) === mediaObjectId) {
					var mediaFrame = shapeHelper.getMediaFrameFromView(selectedShapes);

					$scope.properties = mediaFrame ? mediaFrame.getPropertiesSchema() : null;
					if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
						$scope.$apply();
					}
				}
			}
		};

		var animationLoadEventHandler = function animationLoadEventHandler () {
			$scope.properties = null;
			$scope.properiesName = null;
			$scope.groupProperties = null;
			$scope.mediaObjectId = null;
		};

		var selectedShapeChangeEventHandler = function selectedShapeChangeEventHandler (canvasShape) {
			if (canvasShape === null) {
				$scope.properties = null;
				$scope.groupProperties = null;
				$scope.mediaObjectId = null;
			} else if (!canvasShape.isType('group')) {
				var mediaFrame = shapeHelper.getMediaFrameFromView(canvasShape);

				if (mediaFrame) {
					$scope.properties = mediaFrame.getPropertiesSchema();
					$scope.mediaObjectId = shapeHelper.getGuidFromView(canvasShape);
				}

				$scope.groupProperties = null;
			} else {
				$scope.groupProperties = createGroupProperties(canvasShape);
				$scope.properties = null;
				$scope.mediaObjectId = null;
			}

			if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
				$scope.$apply();
			}
		};

		var selectedEffectChangeEventHandler = function selectedEffectChangeEventHandler(effect) {
			$scope.properties = null;
			$scope.groupProperties = null;
			$scope.mediaObjectId = null;

			if (effect === null) {
			} else {
			}

			if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
				$scope.$apply();
			}
		};

		animationService.getInstance().addUpdateObserver('PropertiesPanelCtrl', animationUpdateEventHandler);
		animationService.getInstance().addLoadCompleteObserver('PropertiesPanelCtrl', animationLoadEventHandler);
		localAnimationStateService.addSelectedShapeObserver('PropertiesPanelCtrl', selectedShapeChangeEventHandler);
		localAnimationStateService.addSelectedEffectObserver('PropertiesPanelCtrl', selectedEffectChangeEventHandler);

		$scope.empty = function () {
			if (!$scope.isGroup()) {
				return $scope.properties === null;
			} else {
				return $scope.groupProperties === null;
			}
		};

		$scope.isGroup = function () {
			return $scope.groupProperties !== null;
		};

		$scope.onUpdate = function (key, newValue) {
			var values = {};

			values[key] = newValue;
			propertyUpdateManagerService.syncProperties($scope.mediaObjectId, values, 'PropertiesPanelCtrl');
		};

		var createGroupProperties = function createGroupProperties(fabricGroup) {
			var canvasPosition = canvasService.getCanvasPosition();
			return {
				'# of items in group': fabricGroup.size(),
				'Group angle': fabricGroup.getAngle(),
				'Group x position': fabricGroup.left - canvasPosition.left,
				'Group y position': fabricGroup.top - canvasPosition.top,
			};
		};
	});
