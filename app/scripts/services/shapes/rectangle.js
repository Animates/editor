'use strict';

angular.module('animatesEditor')
	.run(function rectangle(shapeCreator, shapeSync, toolbarShapeService, shapeSyncHelper, shapeHelper) {
		var typeId = 'Rectangle',
			objectNumber = 1;

		function createShape() {
			return new shapeSyncHelper.Fabric.Rect();
		}

		shapeCreator.registerShape(typeId, createShape);

		function syncFromModel(viewObject, canvasPosition) {
			var model = shapeHelper.getMediaFrameFromView(viewObject);

			shapeSyncHelper.syncVisualMediaObjectFromModel(viewObject, canvasPosition);

			shapeSyncHelper.syncViewProperty(model.getProperty('height'), viewObject, 'height');
			shapeSyncHelper.syncViewProperty(model.getProperty('width'), viewObject, 'width');
		};

		function syncFromView(viewObject, canvasPosition) {
			var diff = shapeSyncHelper.syncVisualMediaObjectFromView(viewObject, canvasPosition),
				mediaObject = shapeHelper.getMediaFrameFromView(viewObject);

			shapeSyncHelper.syncModelProperty(viewObject.currentHeight || viewObject.height, mediaObject, 'height', diff, true);
			shapeSyncHelper.syncModelProperty(viewObject.currentWidth || viewObject.width, mediaObject, 'width', diff, true);

			return diff;
		};

		shapeSync.registerShape(typeId, syncFromModel, syncFromView);

		function getButtonClass() {
			return 'fa fa-square-o';
		};

		function createMediaObject() {
			var options = {
				fill : '#f2ac57',
				height: 100,
				width: 100,
				name: typeId + ' ' + objectNumber++
			};

			return new shapeSyncHelper.Model.Rectangle(options);
		};

		toolbarShapeService.registerItem(typeId, getButtonClass, createMediaObject)
	});
