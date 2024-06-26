const map = L.map('map').setView([48.208, 16.373], 12);

const ortho = [
    ['2023', 'lb', 'farbe'],
    ['2022', 'lb2022', 'farbe'],
    ['2021', 'lb2021', 'farbe'],
    ['2020', 'lb2020', 'farbe'],
    ['2019', 'lb2019', 'farbe'],
    ['2018', 'lb2018', 'farbe'],
    ['2017', 'lb2017', 'farbe'],
    ['2016', 'lb2016', 'farbe'],
    ['2015', 'lb2015', 'farbe'],
    ['2014', 'lb2014', 'farbe'],
    ['1992', 'lb1992', 'grau'],
    ['1986', 'lb1986', 'grau'],
    ['1981', 'lb1981', 'grau'],
    ['1976', 'lb1976', 'grau'],
    ['1971', 'lb1971', 'grau'],
    ['1961', 'lb1961', 'grau'],
    ['1956', 'lb1956', 'grau'],
    ['1938', 'lb1938', 'grau'],
];

const orthoLayers     = ortho.map(_ => _[1]);
const orthoStyle      = ortho.map(_ => _[2]);
const orthoLayerNames = ortho.map(_ => _[0]);

const layers = orthoLayers.map((id, index) => L.tileLayer(
    `https://{s}.wien.gv.at/wmts/${id}/${orthoStyle[index]}/google3857/{z}/{y}/{x}.jpeg`, {
        subdomains: ['maps', 'maps1', 'maps2', 'maps3', 'maps4'],
        attribution: 'Datenquelle: Stadt Wien – <a href="https://data.wien.gv.at">data.wien.gv.at</a>',
        className: `tileLayer tileLayer${id}`
    })
);

let current = 0;
let direction = 1;
let bw = false;
let active = [0, 5];
if (location.hash.length > 1) {
    active = location.hash.substr(1).split(',').map(name => orthoLayerNames.indexOf(name));
}

active.forEach(index => layers[index].addTo(map).setOpacity(0));

function loop() {
    if (!active.length) {
        return;
    }
    layers[active[current]].setOpacity(0);
    current = (current + direction) % active.length;
	if (current < 0) {
		current += active.length;
	}
    layers[active[current]].setOpacity(1);
	layers[active[current]].getContainer().classList[bw ? 'add' : 'remove']('grayscale');
    try {
        document.querySelector('.leaflet-control-layers-base > div.active').classList.remove('active');
    } catch (e) {};
    document.querySelectorAll('.leaflet-control-layers-base > div')[active[current]].classList.add('active');
}

let loopInterval = setInterval(loop, 1000);
requestAnimationFrame(loop);

const layerControl = L.Control.extend({
    onAdd: map => {
        const container = L.DomUtil.create('div', 'leaflet-control-layers leaflet-control-layers-expanded');
		container.style.overflow = 'auto';
		container.style.maxHeight = '80vh';
				
        const list = L.DomUtil.create('section', 'leaflet-control-layers-list', container);
        const base = L.DomUtil.create('div', 'leaflet-control-layers-base', list);

        orthoLayerNames.forEach((name, i) => {
            const div = L.DomUtil.create('div', '', base);
            const label = L.DomUtil.create('label', '', div);
            const innerDiv = L.DomUtil.create('div', '', label);
            const input = L.DomUtil.create('input', 'leaflet-control-layers-selector', innerDiv);
            input.type = 'checkbox';
            input.value = i;
            if (active.includes(i)) {
                input.checked = true;
            }
            L.DomUtil.create('span', '', innerDiv).textContent = name;
        });

        base.addEventListener('change', e => {
            const target = e.target;
            if (!target.classList.contains('leaflet-control-layers-selector')) {
                return;
            }
            if (target.checked) {
                layers[target.value].addTo(map).setOpacity(0);
            } else {
                layers[target.value].remove();
            }
            active = Array.from(base.querySelectorAll('.leaflet-control-layers-selector:checked'))
                .map(el => parseInt(el.value));
            current = 0;

            location.hash = active.map(index => orthoLayerNames[index]).join(',');

            /*
            if (active.includes(6) || active.includes(7)) {
                map.getContainer().classList.add('gray');
            } else {
                map.getContainer().classList.remove('gray');
            }
            */
            requestAnimationFrame(loop);
        });

        L.DomUtil.create('div', 'leaflet-control-layers-separator', list);

        const speedBase = L.DomUtil.create('div', 'leaflet-control-layers-base', list);
        [100, 250, 500, 1000, 3000].forEach(speed => {
            const div = L.DomUtil.create('div', '', speedBase);
            const label = L.DomUtil.create('label', '', div);
            const innerDiv = L.DomUtil.create('div', '', label);
            const input = L.DomUtil.create('input', 'leaflet-control-layers-selector', innerDiv);
            input.type = 'radio';
            input.name = 'speed';
            input.value = speed;
            if (speed == 1000) {
                input.checked = true;
            }
            L.DomUtil.create('span', '', innerDiv).textContent = `${speed / 1000}s`;
        });

        speedBase.addEventListener('change', e => {
            const target = e.target;
            if (!target.classList.contains('leaflet-control-layers-selector')) {
                return;
            }
            clearInterval(loopInterval);
            loopInterval = setInterval(loop, e.target.value);
        });

        L.DomUtil.create('div', 'leaflet-control-layers-separator', list);
        const directionBase = L.DomUtil.create('div', 'leaflet-control-layers-base', list);
        [1, -1].forEach(direction => {
            const div = L.DomUtil.create('div', '', directionBase);
            const label = L.DomUtil.create('label', '', div);
            const innerDiv = L.DomUtil.create('div', '', label);
            const input = L.DomUtil.create('input', 'leaflet-control-layers-selector', innerDiv);
            input.type = 'radio';
            input.name = 'direction';
            input.value = direction;
            if (direction == 1) {
                input.checked = true;
            }
            L.DomUtil.create('span', '', innerDiv).textContent = direction > 0 ? 'backward' : 'forward';
        });

        directionBase.addEventListener('change', e => {
            const target = e.target;
            if (!target.classList.contains('leaflet-control-layers-selector')) {
                return;
            }
			direction = target.value > 0 ? 1 : -1;
        });

        L.DomUtil.create('div', 'leaflet-control-layers-separator', list);
        const bwBase = L.DomUtil.create('div', 'leaflet-control-layers-base', list);
        ['farbe', 'grau'].forEach(color => {
            const div = L.DomUtil.create('div', '', bwBase);
            const label = L.DomUtil.create('label', '', div);
            const innerDiv = L.DomUtil.create('div', '', label);
            const input = L.DomUtil.create('input', 'leaflet-control-layers-selector', innerDiv);
            input.type = 'radio';
            input.name = 'color';
            input.value = color;
            if (color == 'farbe') {
                input.checked = true;
            }
            L.DomUtil.create('span', '', innerDiv).textContent = color;
        });

        bwBase.addEventListener('change', e => {
            const target = e.target;
            if (!target.classList.contains('leaflet-control-layers-selector')) {
                return;
            }
			bw = target.value === 'grau';
        });

        return container;
    },
    onRemove: map => {}
});

(new layerControl()).addTo(map);
