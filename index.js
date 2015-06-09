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
			this.element.className += ' ' + this.settings.className;
			
			if (!this.element) {
				throw new Error('Element could not be found');
			}
			
			this.cropperWrapper = this.element.querySelector(options.cropper);
			this.cropperWrapper.className += ' ' + this.settings.className + '__wrapper';
			
			if (options.preview) {
				this.preview = this.element.querySelector(options.preview);
				this.preview.className += ' ' + this.settings.className + '__preview';
			}
			
			this.ready = false;
			
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
				
				this.attach();
			},
			
			attach: function () {
				window.onresize = this.resize.bind(this);
			},
			
			zoomOut: function (e) {
				this.cropper.z -= 0.01;
				this.cropper.z = Math.max(0.1, this.cropper.z);
				
				this.build();				
			},
			
			zoomIn: function (e) {
				this.cropper.z += 0.01;
				this.cropper.z = Math.min(1, this.cropper.z);
				
				this.build();
			},
			
			zoom: function (zoom) {
				this.cropper.z = Math.max(0.1, Math.min(1, zoom));
				this.build();
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
				    hRatio = this.settings.size.h / image.height,
				    x      = (this.cropper) ? this.cropper.x : this.settings.position.x,
				    y      = (this.cropper) ? this.cropper.y : this.settings.position.y,
				    z      = (this.cropper) ? this.cropper.z : this.settings.zoom;
				
				this.cropper = {
					w: this.visibleSize.w * wRatio,
					h: this.visibleSize.h * hRatio,
					x: x,
					y: y,
					z: z
				};
				
				this.ratio = (this.settings.size.w > this.settings.size.h) ? this.settings.size.h / this.settings.size.w : this.settings.size.w / this.settings.size.h;
				
				callback.call(this);
			},
			
			build: function () {
				this.buildCropper();
				this.buildPreview();
				
				
				/** Ready */
				if (!this.ready) {
					this.ready = true;
					this.settings.onReady.call(this.element);
				}
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
				    sw,
				    sh,
				    dw,
				    dh,
				    centerX,
				    centerY;
				    
				canvas.className = this.settings.className + '__canvas';
				    
				canvas.width  = previewW;
				canvas.height = previewH;
				
				if (this.settings.size.w > this.settings.size.h) {
					sw    = Math.min(this.realSize.w - this.cropper.x, this.settings.size.w / this.cropper.z);
					sh    = sw * this.ratio;
					dw    = this.settings.size.w * wRatio;
					dh    = dw * this.ratio;
				}
				
				centerX  = (previewW / 2) - (dw / 2);
				centerY  = (previewH / 2) - (dh / 2);
				    
				context.drawImage(this.fullImage, this.cropper.x / previewW * this.realSize.w, this.cropper.y / previewH * this.realSize.h, sw, sh, centerX, centerY, dw, dh);
				
				/** Empty preview */
				while (this.preview.hasChildNodes()) {
				    this.preview.removeChild(this.preview.lastChild);
				}
				
				this.preview.appendChild(canvas);
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
				    cropperH,
				    cropperX,
				    cropperY;
				
				/** Create overlay */
				overlay.style.cssText = overlayStyle.join('; ');
				this.cropperWrapper.style.position = 'relative';
				overlay.className = this.settings.className + '__overlay';
				
				while (this.cropperWrapper.hasChildNodes()) {
				    this.cropperWrapper.removeChild(this.cropperWrapper.lastChild);
				}
				
				this.cropperWrapper.appendChild(this.image);
				this.cropperWrapper.appendChild(overlay);
				
				/** Create cropper */
				cropperW = this.cropper.w / this.cropper.z;
				cropperH = this.cropper.h / this.cropper.z;
				cropperX = Math.min(this.visibleSize.w - cropperW, this.cropper.x);
				cropperY = Math.min(this.visibleSize.h - cropperH, this.cropper.y);
				
				this.cropper.x = cropperX;
				this.cropper.y = cropperY;
				
				cropper  = document.createElement('div');
				cropperStyle = [
					'position: absolute',
					'z-index: 2',
					'width: ' + cropperW + 'px',
					'height: ' + cropperH + 'px',
					'top: ' + cropperY + 'px',
					'left: ' + cropperX + 'px',
					'cursor: move',
					'overflow: hidden'
				];
				
				cropper.style.cssText = cropperStyle.join('; ');
				cropper.className = this.settings.className + '__cropper';
				
				/** Create cropper image */
				cropperImage = this.image.cloneNode();
				cropperImageStyle = [
					'position: absolute',
					'width: ' + this.visibleSize.w + 'px',
					'height: ' + this.visibleSize.h + 'px',
					'top: -' + this.cropper.y + 'px',
					'left: -' + this.cropper.x + 'px',
					'cursor: move',
					'pointer-events: none',
					'max-width: none'
				];
				
				cropperImage.ondragstart = function() { return false; };
				
				this.cropperImage = cropperImage;
				this.cropperImage.className = this.settings.className + '__cropper__image';
				
				this.cropperImage.style.cssText = cropperImageStyle.join('; ');
				this.cropperDOM = cropper;
				
				this.cropperDOM.appendChild(this.cropperImage);
				this.cropperWrapper.appendChild(this.cropperDOM);
				
				this.cropperDOM.addEventListener('mousedown', this.cropperMouseDown.bind(this));
				document.addEventListener('mouseup', this.cropperMouseUp.bind(this));
				document.addEventListener('mousemove', this.cropperMouseMove.bind(this));
			},
			
			resize: function () {
				this.setImageSize.call(this, this.fullImage, this.build);
			},
			
			cropperMouseDown: function (e) {
				this.cropperOffset   = {
					x: this.cropper.x,
					y: this.cropper.y
				};
				this.cropperStartPos = {
					x: e.pageX,
					y: e.pageY
				};
				
				this.mouseDown = true;
			},
			
			cropperMouseUp: function () {
				this.mouseDown = false;
				
				this.cropperStartPos = {
					x: 0,
					y: 0
				};
			},
			
			cropperMouseMove: function (e) {
				if (!this.mouseDown) {
					return false;
				}
				
				var newX = Math.max(0, this.cropperOffset.x + (e.pageX - this.cropperStartPos.x)),
				    newY = Math.max(0, this.cropperOffset.y + (e.pageY - this.cropperStartPos.y));
				    
				newX = Math.min(this.visibleSize.w - (this.cropper.w / this.cropper.z), newX);
				newY = Math.min(this.visibleSize.h - (this.cropper.h / this.cropper.z), newY);
				    
				this.cropper.x = newX;
				this.cropper.y = newY;
				
				this.cropperDOM.style.left = newX + 'px';
				this.cropperDOM.style.top  = newY + 'px';
				this.cropperImage.style.left = -newX + 'px';
				this.cropperImage.style.top  = -newY + 'px';
				
				this.buildPreview();
			}
			
		};
		
		return module;
		
	}());
	
	return SimpleCropper;
	
}));