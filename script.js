class SimpleCropper {
	constructor(element, options) {
		this.settings = options;
		this.element = element;
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
	}

	init() {
		const image = this.element.querySelector('img');

		if (!image) {
			throw new Error('No image found');
		}

		this.image   = image;
		this.cropper = null;
		this.ready   = false;

		const { src } = image;
		const tempImage = new Image();

		tempImage.onload = this.setImageSize.bind(this, tempImage, this.build);
		tempImage.src = src;

		if (tempImage.complete) {
			this.setImageSize(tempImage, this.build);
		}

		this.attach();
	}

	resize() {
		this.setImageSize.call(this, this.fullImage, this.build);
	}

	updatePreview() {
		const build = this.buildCanvas();

		this.context.drawImage(build[0], 0, 0);
		this.settings.onUpdate.call(this, this.element);
	}

	updateCropper() {
		let cropperW = this.cropper.w / this.cropper.z;
		let cropperH = this.cropper.h / this.cropper.z;

		if (cropperW > this.visibleSize.w || cropperH > this.visibleSize.h) {
			this.cropper.z = (this.lastZoom) ? this.lastZoom : 1;

			cropperW = this.cropper.w / this.cropper.z;
			cropperH = this.cropper.h / this.cropper.z;
		}

		const cropperX = Math.min(this.visibleSize.w - cropperW, this.cropper.x);
		const cropperY = Math.min(this.visibleSize.h - cropperH, this.cropper.y);

		this.cropper.x = cropperX;
		this.cropper.y = cropperY;

		this.cropperDOM.style.width  = cropperW + 'px';
		this.cropperDOM.style.height = cropperH + 'px';
		this.cropperDOM.style.top    = cropperY + 'px';
		this.cropperDOM.style.left   = cropperX + 'px';

		this.cropperImage.style.top    = '-' + this.cropper.y + 'px';
		this.cropperImage.style.left   = '-' + this.cropper.x + 'px';
	}

	update() {
		this.updatePreview();
		this.updateCropper();
	}

	cropperMouseUp() {
		this.mouseDown = false;

		this.cropperStartPos = {
			x: 0,
			y: 0
		};
	}

	cropperMouseMove(e) {
		if (!this.mouseDown) {
			return false;
		}

		let newX = Math.max(0, this.cropperOffset.x + (e.pageX - this.cropperStartPos.x));
		let newY = Math.max(0, this.cropperOffset.y + (e.pageY - this.cropperStartPos.y));

		newX = Math.min(this.visibleSize.w - (this.cropper.w / this.cropper.z), newX);
		newY = Math.min(this.visibleSize.h - (this.cropper.h / this.cropper.z), newY);

		this.cropper.x = newX;
		this.cropper.y = newY;

		this.cropperDOM.style.left = newX + 'px';
		this.cropperDOM.style.top  = newY + 'px';
		this.cropperImage.style.left = -newX + 'px';
		this.cropperImage.style.top  = -newY + 'px';

		this.updatePreview();
	}

	cropperMouseDown(e) {
		this.cropperOffset   = {
			x: this.cropper.x,
			y: this.cropper.y
		};
		this.cropperStartPos = {
			x: e.pageX,
			y: e.pageY
		};

		this.mouseDown = true;
	}

	attach() {
		window.onresize = this.resize.bind(this);
	}

	setImageSize(image, callback) {
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

		const wRatio = this.settings.size.w / image.width;
		const hRatio = this.settings.size.h / image.height;
		const x = (this.cropper) ? this.cropper.x : this.settings.position.x;
		const y = (this.cropper) ? this.cropper.y : this.settings.position.y;
		const z = (this.cropper) ? this.cropper.z : this.settings.zoom;

		this.ratio = (this.settings.size.w > this.settings.size.h) ? this.settings.size.h / this.settings.size.w : this.settings.size.w / this.settings.size.h;

		this.cropper = {
			w: this.visibleSize.w * wRatio,
			h: this.visibleSize.h * hRatio,
			x: x,
			y: y,
			z: z
		};

		let minZoom;

		if (this.visibleSize.w > this.visibleSize.h) {
			minZoom = this.settings.size.w / this.realSize.w;

			if ((this.cropper.h / minZoom) > this.visibleSize.h) {
				minZoom = this.settings.size.h / this.realSize.h;
			}
		} else {
			minZoom = this.settings.size.h / this.realSize.h;

			if ((this.cropper.w / minZoom) > this.visibleSize.w) {
				minZoom = this.settings.size.w / this.realSize.w;
			}
		}

		this.cropper.minZoom = minZoom;

		callback.call(this);
	}

	buildCanvas() {
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		const previewW = this.visibleSize.w;
		const previewH = this.visibleSize.h;
		const wRatio = (previewW > this.settings.size.w) ? this.settings.size.w / previewW : previewW / this.settings.size.w;
		let sw;
		let sh;
		let dw;
		let dh;

		canvas.className = this.settings.className + '__canvas';

		canvas.width  = previewW;
		canvas.height = previewH;

		if (this.settings.size.w > this.settings.size.h) {
			sw = Math.min(this.realSize.w - this.cropper.x, this.settings.size.w / this.cropper.z);
			sh = sw * this.ratio;
			dw = this.settings.size.w * wRatio;
			dh = dw * this.ratio;
		}

		const centerX  = (previewW / 2) - (dw / 2);
		const centerY  = (previewH / 2) - (dh / 2);

		context.drawImage(this.fullImage, this.cropper.x / previewW * this.realSize.w, this.cropper.y / previewH * this.realSize.h, sw, sh, centerX, centerY, dw, dh);

		return [canvas, context];
	}

	buildCropper() {
		const overlay = document.createElement('div');
		const overlayStyle = [
			'background: rgba(0, 0, 0, 0.8)',
			'position: absolute',
			'top: 0',
			'right: 0',
			'bottom: 0',
			'left: 0'
		];

		overlay.style.cssText = overlayStyle.join('; ');
		this.cropperWrapper.style.position = 'relative';
		overlay.className = this.settings.className + '__overlay';

		while (this.cropperWrapper.hasChildNodes()) {
			this.cropperWrapper.removeChild(this.cropperWrapper.lastChild);
		}

		this.cropperWrapper.appendChild(this.image);
		this.cropperWrapper.appendChild(overlay);

		/** Create cropper */
		let cropperW = this.cropper.w / this.cropper.z;
		let cropperH = this.cropper.h / this.cropper.z;

		if (cropperW > this.visibleSize.w || cropperH > this.visibleSize.h) {
			this.cropper.z = (this.lastZoom) ? this.lastZoom : 1;

			cropperW = this.cropper.w / this.cropper.z;
			cropperH = this.cropper.h / this.cropper.z;
		}

		const cropperX = Math.min(this.visibleSize.w - cropperW, this.cropper.x);
		const cropperY = Math.min(this.visibleSize.h - cropperH, this.cropper.y);

		this.cropper.x = cropperX;
		this.cropper.y = cropperY;

		const cropper  = document.createElement('div');
		const cropperStyle = [
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
		const cropperImage = this.image.cloneNode();
		const cropperImageStyle = [
			'position: absolute',
			'width: ' + this.visibleSize.w + 'px',
			'height: ' + this.visibleSize.h + 'px',
			'top: -' + this.cropper.y + 'px',
			'left: -' + this.cropper.x + 'px',
			'cursor: move',
			'pointer-events: none',
			'max-width: none'
		];

		cropperImage.ondragstart = () => false;

		this.cropperImage = cropperImage;
		this.cropperImage.className = this.settings.className + '__cropper__image';

		this.cropperImage.style.cssText = cropperImageStyle.join('; ');
		this.cropperDOM = cropper;

		this.cropperDOM.appendChild(this.cropperImage);
		this.cropperWrapper.appendChild(this.cropperDOM);

		this.cropperDOM.addEventListener('mousedown', this.cropperMouseDown.bind(this));

		if (!this.ready) {
			document.addEventListener('mouseup', this.cropperMouseUp.bind(this));
			document.addEventListener('mousemove', this.cropperMouseMove.bind(this));
		}
	}

	buildPreview() {
		if (!this.preview) {
			return false;
		}

		const build = this.buildCanvas();

		/** Empty preview */
		while (this.preview.hasChildNodes()) {
			this.preview.removeChild(this.preview.lastChild);
		}

		this.preview.appendChild(build[0]);

		/** Export */
		this.canvas  = build[0];
		this.context = build[1];
	}

	build() {
		this.buildCropper();
		this.buildPreview();

		if (!this.ready) {
			this.ready = true;
			this.settings.onReady.call(this, this.element);
		} else {
			this.settings.onUpdate.call(this, this.element);
		}
	}

	zoomOut() {
		this.lastZoom  = this.cropper.z;
		this.cropper.z -= this.settings.steps;
		this.cropper.z = Math.max(this.cropper.minZoom, this.cropper.z);

		this.update();
	}

	zoomIn() {
		this.lastZoom  = this.cropper.z;
		this.cropper.z += this.settings.steps;
		this.cropper.z = Math.min(1, this.cropper.z);

		this.update();
	}

	zoom(zoom) {
		this.lastZoom  = this.cropper.z;
		this.cropper.z = Math.max(this.cropper.minZoom, Math.min(1, zoom));

		if (zoom === 0) {
			this.cropper.x = 0;
			this.cropper.y = 0;
		}

		this.update();
	}

	toJSON() {
		const previewW = this.visibleSize.w;
		const previewH = this.visibleSize.h;
		let sw;
		let sh;

		if (this.settings.size.w > this.settings.size.h) {
			sw = Math.min(this.realSize.w - this.cropper.x, this.settings.size.w / this.cropper.z);
			sh = sw * this.ratio;
		}

		return {
			x: this.cropper.x / previewW * this.realSize.w,
			y: this.cropper.y / previewH * this.realSize.h,
			w: sw,
			h: sh
		};
	}
}

const zoomIn  = document.getElementById('zoomIn');
const zoomOut = document.getElementById('zoomOut');
const zoom100 = document.getElementById('zoom100');
const zoom0   = document.getElementById('zoom0');
const currentZoom = document.getElementById('currentZoom');

const cropper = new SimpleCropper(document.getElementById('cropper'), {
	className: 'simple-cropper',
	cropper: '.demo__cropper',
	preview: '.demo__preview',
	position: {
		x: 50,
		y: 50
	},
	size: {
		w: 700,
		h: 466
	},
	zoom: 0.2,
	steps: 0.05,
	onReady: function (element) {
		element.className += ' demo--ready';
		currentZoom.innerHTML = Math.round(this.cropper.z * 100) + '%';
	},
	onUpdate: function () {
		currentZoom.innerHTML = Math.round(this.cropper.z * 100) + '%';

		console.log(this.toJSON());
	}
});

zoomOut.addEventListener('click', function () {
	cropper.zoomOut();
});

zoomIn.addEventListener('click', function () {
	cropper.zoomIn();
});

zoom0.addEventListener('click', function () {
	cropper.zoom(0);
});

zoom100.addEventListener('click', function () {
	cropper.zoom(1);
});
