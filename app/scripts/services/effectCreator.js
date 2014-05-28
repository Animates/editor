'use strict';

angular.module('animatesApp')
	.factory('effectCreator', function effectCreator(localAnimationStateService, $window, animationService) {
		var Model = $window.model,
			applyEffectCreationOperation = function applyEffectCreationOperation (mediaObjectId, effect){
				animationService.getInstance().applyOperation('Effect', 'Create', {
					mediaObjectId: mediaObjectId,
					effect: effect
				}, {
					sender: 'effectCreator'
				});
			},
			applyEffectUpdateOperation = function applyEffectUpdateOperation (mediaObjectId, effectId, options){
				animationService.getInstance().applyOperation('Effect', 'Update', {
					mediaObjectId: mediaObjectId,
					effectId: effectId,
					options: options
				}, {
					sender: 'effectCreator'
				});
			};

		return {
			addMoveEffectIfRequired : function addMoveEffectIfRequired(model, fabricObject, canvasPosition, mediaTimeline){
				var posXStart = model.getProperty('position.x'),
					posYStart = model.getProperty('position.y'),
					posXEnd = fabricObject.left - canvasPosition.left,
					posYEnd = fabricObject.top - canvasPosition.top,
					currentEffects = null,
					path = null,
					moveEffect = null;

				if (posXStart !== posXEnd || posYStart !== posYEnd) {
					path = new Model.Path({
						startPosition: { x: posXStart, y: posYStart },
						endPosition: { x: posXEnd, y: posYEnd }
					});

					moveEffect = new Model.MoveEffect({
						path : path,
						startTick : mediaTimeline.getStartTick(),
						endTick : localAnimationStateService.getCurrentTick()
					});

					var effectsToSplit = [];
					// Check if an existant effect must be splitted
					currentEffects = mediaTimeline.getEffectsForTick(localAnimationStateService.getCurrentTick());
					if (currentEffects.length > 0) {
						for (var i = 0; i < currentEffects.length; i++) {
							if (moveEffect.HasConflictWithProperties(currentEffects[i])) {
								effectsToSplit.push(currentEffects[i]);
							}
						}
					}

					var mediaObjectId = mediaTimeline.getMediaObjectId();

					var addNewEffect = true;

					var effectToSplit, effectToSplitOptions, effectPath, newEffectPath, effectToSplitPath;

					// "Split" : Modify the found effect and insert the new one
					for (var j = 0; j < effectsToSplit.length; j++) {
						effectToSplit = effectsToSplit[j];

						effectToSplitOptions = null;

						if(effectToSplit.getOption('endTick') === moveEffect.getOption('endTick')) {
							effectPath = effectToSplit.getOption('path');
							newEffectPath = moveEffect.getOption('path');

							effectPath.endPosition = newEffectPath.endPosition;
							effectToSplitOptions = {
								path: effectPath
							};

							addNewEffect = false;
						} else if (effectToSplit.getOption('startTick') === moveEffect.getOption('endTick')) {
							effectPath = effectToSplit.getOption('path');
							newEffectPath = moveEffect.getOption('path');

							effectPath.startPosition = newEffectPath.endPosition;
							effectToSplitOptions = {
								path: effectPath
							};

							addNewEffect = false;
						} else {
							effectToSplitPath = effectToSplit.getOption('path');
							moveEffect.getOption('path').startPosition = effectToSplitPath.startPosition;

							effectToSplitPath.startPosition = { x: posXEnd, y : posYEnd };

							effectToSplitOptions = {
								startTick : localAnimationStateService.getCurrentTick(),
								path: effectToSplitPath
							};
						}

						applyEffectUpdateOperation(mediaObjectId, effectToSplit.getGuid(), effectToSplitOptions);
					}

					if (addNewEffect){
						moveEffect.setOption('startTick', mediaTimeline.getStartTickFor(moveEffect, moveEffect.getOption('endTick')));
						applyEffectCreationOperation(mediaObjectId, moveEffect);
					}
				}
			}
		};
	});
