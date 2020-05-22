import SimpleCropper from './SimpleCropper.js';

const zoomIn  = document.getElementById('zoomIn');
const zoomOut = document.getElementById('zoomOut');
const zoom100 = document.getElementById('zoom100');
const zoom0   = document.getElementById('zoom0');
const json    = document.getElementById('json');
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
