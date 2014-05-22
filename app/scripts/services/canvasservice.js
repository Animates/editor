'use strict';

angular.module('animatesApp')
	.service('canvasService', function canvasService(shapeSync, $window, $rootScope, canvasConfig, animationService, shapeCreator, timelineService) {
		var fabric = $window.fabric,
			_self = this,
			canvasPosition = {
				left: canvasConfig.canvasMinPosition.left,
				top: canvasConfig.canvasMinPosition.top
			},
			selectedShape = null,
			canvasInstance,
			viewportInstance,
			applyShapeUpdateOperation = function (mediaObjectId, updatedProperties){
				animationService.getInstance().applyOperation('Shape', 'Update', {
					mediaObjectId :  mediaObjectId,
					properties: updatedProperties
				}, {
					sender: 'canvasService'
				});
			},
			updateCanvasPosition = function updateCanvasPosition(height, width){
				var top = (height - canvasInstance.model.height) / 2,
					left = (width - canvasInstance.model.width) / 2;

				canvasPosition.top = (top < canvasConfig.canvasMinPosition.top) ? canvasConfig.canvasMinPosition.top : top;
				canvasPosition.left = (left < canvasConfig.canvasMinPosition.left) ? canvasConfig.canvasMinPosition.left : left;

				if (!viewportInstance){
					viewportInstance = new fabric.Rect(canvasConfig.viewportInitialConfig);
					canvasInstance.add(viewportInstance);
				}

				viewportInstance.set({
					left: canvasPosition.left,
					top: canvasPosition.top,
					width: canvasInstance.model.width,
					height: canvasInstance.model.height
				});
			},
			updateAllObjects = function updateAllObjects(viewport, oldViewport){
				var diffTop = viewport.top - oldViewport.top,
					diffLeft = viewport.left - oldViewport.left,
					allObjects = canvasInstance.getObjects(),
					object;

				for (var i = 0; i < allObjects.length; i++) {
					object = allObjects[i];
					if (object !== viewportInstance) {
						object.set({
							left: diffLeft + object.left,
							top: diffTop + object.top
						});
						//TODO review what to do with the model
					}
				}
			},
			renderAll = function renderAll(){
				canvasInstance.renderAll();
			},
			updateMediaObjectInCanvas = function updateMediaObjectInCanvas(mediaObjectId){
				var allObjects = canvasInstance.getObjects(),
					founded = false,
					newMediaFrame = timelineService.getMediaFrame(mediaObjectId),
					object;

				for (var i = 0; i < allObjects.length; i++) {
					object = allObjects[i];
					if (object.model && object.model.getMediaObjectGuid() === mediaObjectId) {
						founded = true;

						if (newMediaFrame) {
							object.model = newMediaFrame;
							shapeSync.syncFromModel(object, _self.getCanvasPosition());
						} else {
							_self.remove(object);
						}
					}
				}

				if (!founded && newMediaFrame){
					var shape = shapeCreator.createShapeFromFrame(newMediaFrame, _self.getCanvasPosition());
					if (shape){
						_self.add(shape);
					}
				}
			},
			animationUpdateEventHandler = function animationUpdateEventHandler(target, operation, params, context) {
				var allObjects, object, i;

				if (context.sender !== 'canvasService') {
					if (target === 'Shape') {
						switch (operation){
							case 'Create':
								var shape = shapeCreator.createShapeFromMediaObject(params.mediaObject, _self.getCanvasPosition());
								if (shape){
									_self.add(shape);
								}
								renderAll();

								break;
							case 'Update':
								updateMediaObjectInCanvas(params.mediaObjectId);
								renderAll();

								break;
							case 'Remove':
								allObjects = canvasInstance.getObjects();

								for (i = 0; i < allObjects.length; i++) {
									object = allObjects[i];
									if (object.model && object.model.getMediaObjectGuid() === params.mediaObjectId) {
										_self.remove(object);
									}
								}
								renderAll();

								break;
							default:
								break;
						}
					} else if (target === 'Effect') {
						updateMediaObjectInCanvas(params.mediaObjectId);
						renderAll();
					}
				} else if (params.mediaObjectId){
					allObjects = canvasInstance.getObjects();

					for (i = 0; i < allObjects.length; i++) {
						object = allObjects[i];
						if (object.model && object.model.getMediaObjectGuid() === params.mediaObjectId) {
							object.model = timelineService.getMediaFrame(params.mediaObjectId);
						}
					}
					renderAll();
				}
			},
			animationLoadEventHandler = function animationLoadEventHandler() {
				var shape, i,
					animation = animationService.getInstance(),
					mediaFrames = animation.timeline.getElements(timelineService.getCurrentTick());

				_self.clear();
				for (i = mediaFrames.length - 1; i >= 0; i--) {
					shape = shapeCreator.createShapeFromFrame(mediaFrames[i], _self.getCanvasPosition());
					if (shape){
						_self.add(shape);
					}
				}

				renderAll();
			};

		this.createCanvas = function createCanvas(id) {
			var canvas = new fabric.Canvas(id, canvasConfig.canvasInitialConfig);
			canvas.model = animationService.getInstance().canvas;
			
			// TODO: Update Properties
			
			animationService.getInstance().addUpdateObserver('CanvasService', animationUpdateEventHandler);
			animationService.getInstance().addLoadCompleteObserver('CanvasService', animationLoadEventHandler);

			canvas.on('object:modified', function(event) {
				var target = event.target;
				if (target) {
					if (target.isType('group')){
						$rootScope.$broadcast('shapeChange', target);
					} else {
						var updatedProperties = shapeSync.syncFromFabric(target, _self.getCanvasPosition());
						if (updatedProperties){
							applyShapeUpdateOperation(target.model.getMediaObjectGuid(), updatedProperties);
						}
					}
				}
			});

			canvas.on('selection:cleared', function (){
				if (event.target && selectedShape) {
					if (selectedShape.isType('group')){
						var allObjects = canvas.getObjects(),
							object;

						for (var i = 0; i < allObjects.length; i++) {
							object = allObjects[i];
							if (object !== viewportInstance) {
								var updatedProperties = shapeSync.syncFromFabric(object, _self.getCanvasPosition());
								if (updatedProperties){
									applyShapeUpdateOperation(object.getMediaObjectGuid(), updatedProperties);
								}
							}
						}
					}
					selectedShape = null;
					$rootScope.$broadcast('selectedShapeChange', null);
				}
			});

			canvas.on('selection:created', function(event) {
				selectedShape = event.target;
				$rootScope.$broadcast('selectedShapeChange', selectedShape);
			});

			canvas.on('object:selected', function(event) {
				if (event.target)
				{
					selectedShape = event.target;
					$rootScope.$broadcast('selectedShapeChange', selectedShape);
				} else {
					$rootScope.$broadcast('selectedShapeChange', null);
				}
			});

			canvas.on('after:render', function(){
				canvas.calcOffset();
			});

			canvasInstance = canvas;
		};
		
		this.getInstance = function getInstance(){
			return canvasInstance;
		};

		this.updateSize = function updateSize(height, width){
			var getNewValue = function getNewValue(newValue, originalValue, minMargin){
				var minValue = originalValue + (minMargin * 2);
				return (minValue > newValue) ? minValue : newValue;
			};

			canvasInstance.setHeight(getNewValue(height, canvasInstance.model.height, canvasConfig.canvasMinPosition.top));
			canvasInstance.setWidth(getNewValue(width, canvasInstance.model.width, canvasConfig.canvasMinPosition.left));

			var oldCanvasPosition = {
				left : canvasPosition.left,
				top : canvasPosition.top
			};
			
			updateCanvasPosition(height, width);
			updateAllObjects(canvasPosition, oldCanvasPosition);

			canvasInstance.forEachObject(function (obj){
				obj.setCoords();
			});
			renderAll();
		};

		this.add = function add(element){
			canvasInstance.add(element);
		};
		
		this.remove = function remove(element){
			canvasInstance.remove(element);
		};

		this.clear = function clear(){
			canvasInstance.clear();
			if (viewportInstance)
			{
				canvasInstance.add(viewportInstance);
			}
		};

		this.getSelectedShape = function getSelectedShape(){
			return selectedShape;
		};

		this.getCanvasPosition = function getCanvasPosition(){
			return {
				left : canvasPosition.left,
				top : canvasPosition.top
			};
		};
	});
