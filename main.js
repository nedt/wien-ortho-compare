const map = L.map('map').setView([48.208, 16.373], 12);

const orthoLayers = ['lb', 'lb2019', 'lb2018', 'lb2017', 'lb2016', 'lb2015', 'lb2014', 'lb1956', 'lb1938'];
const orthoStyle = ['farbe', 'farbe', 'farbe', 'farbe', 'farbe', 'farbe', 'farbe', 'grau', 'grau'];
const orthoLayerNames = ['2020', '2019', '2018', '2017', '2016', '2015', '2014', '1956', '1938'];


const layers = orthoLayers.map((id, index) => L.tileLayer(
    `https://{s}.wien.gv.at/wmts/${id}/${orthoStyle[index]}/google3857/{z}/{y}/{x}.jpeg`, {
        subdomains: ['maps', 'maps1', 'maps2', 'maps3', 'maps4'],
        attribution: 'Datenquelle: Stadt Wien – <a href="https://data.wien.gv.at">data.wien.gv.at</a>',
        className: `tileLayer tileLayer${id}`
    })
);

let current = 0;
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
    current = (current + 1) % active.length;
    layers[active[current]].setOpacity(1);
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

        return container;
    },
    onRemove: map => {}
});

(new layerControl()).addTo(map);
