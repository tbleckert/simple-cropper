(function (root, factory) {
	
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.SimpleCropper = factory();
	}
	
}(this, function () {
	
	var SimpleCropper = (function () {
		
		var module = function (element, options) {
			this.settings = options;
			this.element  = document.getElementById(element);
			
			if (!this.element) {
				throw new Error('Element could not be found');
			}
			
			this.cropperWrapper = this.element.querySelector(options.cropper);
			
			if (options.preview) {
				this.preview = this.element.querySelector(options.preview);
			}
			
			this.ready   = false;
			
			this.init();
		};
		
		module.prototype = {
			
			init: function () {
				var image     = this.element.querySelector('img'),
				    tempImage, src;
				
				if (!image) {
					throw new Error('No image found');
				}
				
				this.image = image;
				
				src = image.src;
				tempImage = new Image();
				
				tempImage.onload = this.setImageSize.bind(this, tempImage, this.build);
				tempImage.src = src;
				
				if (tempImage.complete) {
					this.setImageSize(tempImage, this.build);
				}
			},
			
			setImageSize: function (image, callback) {
				this.fullImage = image;
				
				this.realSize = {
					w: image.width,
					h: image.height
				};
				
				this.visibleSize = {
					w: this.image.offsetWidth,
					h: this.image.offsetHeight
				};
				
				if (this.realSize.w < this.settings.size.w || this.realSize.h < this.settings.size.h) {
					throw new Error('The cropping area can\'t be bigger than the image.');
				}
				
				var wRatio = this.settings.size.w / image.width,
				    hRatio = this.settings.size.h / image.height;
				
				this.cropper = {
					w: this.visibleSize.w * wRatio,
					h: this.visibleSize.h * hRatio,
					x: this.settings.position.x,
					y: this.settings.position.y,
					z: this.settings.zoom
				};
				
				callback.call(this);
			},
			
			build: function () {
				this.buildPreview();
				this.buildCropper();
				
				/** Ready */
				this.ready = true;
				this.settings.onReady.call(this.element);
			},
			
			buildPreview: function () {
				if (!this.preview) {
					return false;
				}
				
				var canvas  = document.createElement('canvas'),
				    context = canvas.getContext('2d'),
				    previewW = this.visibleSize.w,
				    previewH = this.visibleSize.h,
				    wRatio   = (previewW > this.settings.size.w) ? this.settings.size.w / previewW : previewW / this.settings.size.w,
				    hRatio   = (previewH > this.settings.size.h) ? this.settings.size.h / previewH : previewH / this.settings.size.h,
				    sw       = this.settings.size.w / this.cropper.z,
				    sh       = this.settings.size.h / this.cropper.z,
				    dw       = this.settings.size.w * wRatio,
				    dh       = this.settings.size.h * hRatio,
				    centerX  = (previewW / 2) - (dw / 2),
				    centerY  = (previewH / 2) - (dh / 2),
				    ratio;
				    
				canvas.width  = previewW;
				canvas.height = previewH;
				
				if (this.settings.size.w > this.settings.size.h) {
					ratio = this.settings.size.h / this.settings.size.w;
					sw    = Math.min(this.realSize.w - this.cropper.x, sw);
					sh    = Math.min((this.realSize.w - this.cropper.x) * ratio, sh);
				}
				    
				context.drawImage(this.fullImage, this.cropper.x / previewW * this.realSize.w, this.cropper.y / previewH * this.realSize.h, sw, sh, centerX, centerY, dw, dh);
				
				/** Empty preview */
				while (this.preview.hasChildNodes()) {
				    this.preview.removeChild(this.preview.lastChild);
				}
				
				this.preview.appendChild(canvas);
				
				window.onresize = this.resize.bind(this);
			},
			
			buildCropper: function () {
				var overlay = document.createElement('div'),
				    overlayStyle = [
					    'background: rgba(0, 0, 0, 0.8)',
					    'position: absolute',
					    'top: 0',
					    'right: 0',
					    'bottom: 0',
					    'left: 0'   
				    ],
				    cropperStyle,
				    cropper,
				    cropperImage,
				    cropperImageStyle,
				    wRatio,
				    hRatio,
				    cropperW,
				    cropperH;
				
				/** Create overlay */
				overlay.style.cssText = overlayStyle.join('; ');
				this.cropperWrapper.style.position = 'relative';
				
				this.cropperWrapper.appendChild(overlay);
				
				/** Create cropper */
				wRatio   = (this.realSize.w > this.settings.size.w) ? this.settings.size.w / this.realSize.w : this.realSize.w / this.settings.size.w;
				hRatio   = (this.realSize.h > this.settings.size.h) ? this.settings.size.h / this.realSize.h : this.realSize.h / this.settings.size.h;
				cropperW = this.settings.size.w * wRatio;
				cropperH = this.settings.size.h * hRatio;
				cropper  = document.createElement('div');
				cropperStyle = [
					'position: absolute',
					'z-index: 2',
					'width: ' + cropperW + 'px',
					'height: ' + cropperH + 'px',
					'top: ' + this.cropper.y + 'px',
					'left: ' + this.cropper.x + 'px',
					'overflow: hidden'
				];
				
				cropper.style.cssText = cropperStyle.join('; ');
				
				/** Create cropper image */
				cropperImage = this.image.cloneNode();
				cropperImageStyle = [
					'position: absolute',
					'width: ' + this.visibleSize.w + 'px',
					'height: ' + this.visibleSize.h + 'px',
					'top: -' + this.cropper.y + 'px',
					'left: -' + this.cropper.x + 'px',
					'max-width: none'
				];
				
				cropperImage.style.cssText = cropperImageStyle.join('; ');
				
				cropper.appendChild(cropperImage);
				this.cropperWrapper.appendChild(cropper);
			},
			
			resize: function () {
				this.setImageSize.call(this, this.fullImage, this.buildPreview);
			}
			
		};
		
		return module;
		
	}());
	
	return SimpleCropper;
	
}));