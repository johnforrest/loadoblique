(function () {
    var r = new RegExp("(^|(.*?\\/))(include-leaflet\.js)(\\?|$)"),
        s = document.getElementsByTagName('script'), targetScript;
    for (var i = 0; i < s.length; i++) {
        var src = s[i].getAttribute('src');
        if (src) {
            var m = src.match(r);
            if (m) {
                targetScript = s[i];
                break;
            }
        }
    }

    function inputScript(url) {
        var script = '<script type="text/javascript" src="' + url + '"><' + '/script>';
        document.writeln(script);
    }

    function inputCSS(url) {
        var css = '<link rel="stylesheet" href="' + url + '">';
        document.writeln(css);
    }

    function inArray(arr, item) {
        for (i in arr) {
            if (arr[i] == item) {
                return true;
            }
        }
        return false;
    }

    function supportES6() {
        var code = "'use strict'; class Foo {}; class Bar extends Foo {};";
        try {
            (new Function(code))();
        } catch (err) {
            return false;
        }
        if (!Array.from) {
            return false;
        }
        return true;
    }

    //加载类库资源文件
    function load() {
        var includes = (targetScript.getAttribute('include') || "").split(",");
        var excludes = (targetScript.getAttribute('exclude') || "").split(",");
        if (!inArray(excludes, 'leaflet')) {
            inputCSS("libs/leaflet/1.3.1/leaflet.css");
            inputScript("libs/leaflet/1.3.1/leaflet.js");
        }
        if (inArray(includes, 'mapv')) {
            inputScript("libs/mapv/2.0.20/mapv.min.js");
        }
        if (inArray(includes, 'turf')) {
            inputScript("libs/turf/5.1.6/turf.min.js");
        }
        if (inArray(includes, 'echarts')) {
            inputScript("libs/echarts/4.1.0/echarts.min.js");
        }
        if (inArray(includes, 'd3')) {
            inputScript("libs/d3/5.5.0/d3.min.js");
        }
        if (inArray(includes, 'd3-hexbin')) {
            inputScript("libs/d3/d3-hexbin.v0.2.min.js");
        }
        if (inArray(includes, 'd3Layer')) {
            inputScript("libs/leaflet/plugins/leaflet.d3Layer/leaflet-d3Layer.min.js");
        }
        if (inArray(includes, 'elasticsearch')) {
            inputScript("libs/elasticsearch/15.0.0/elasticsearch.min.js");
        }
        if (inArray(includes, 'deck')) {
            inputScript("libs/deck.gl/5.1.3/deck.gl.js");
        }
        if (inArray(includes, 'xlsx')) {
            inputScript("libs/xlsx/0.12.13/xlsx.core.min.js");
        }
        if (!inArray(excludes, 'iclient9-leaflet')) {
            if (supportES6()) {
                inputScript("dist/iclient9-leaflet-es6.min.js");
            } else {
                inputScript("dist/iclient9-leaflet.min.js");
            }
        }
        if (inArray(includes, 'iclient9-leaflet-css')) {
            inputCSS("dist/leaflet/iclient9-leaflet.min.css");
        }
        if (inArray(includes, 'iclient9-plot-leaflet')) {
            inputCSS("libs/plotting/leaflet/9.1.1/iclient9-plot-leaflet.css");
            if (supportES6()) {
                inputScript("libs/plotting/leaflet/9.1.1/iclient9-plot-leaflet-es6.min.js");
            } else {
                inputScript("libs/plotting/leaflet/9.1.1/iclient9-plot-leaflet.min.js");
            }
        }
        if (inArray(includes, 'leaflet.heat')) {
            inputScript("libs/leaflet/plugins/leaflet.heat/leaflet-heat.js");
        }
        if (inArray(includes, 'osmbuildings')) {
            inputScript("libs/osmbuildings/OSMBuildings-Leaflet.js");
        }
        if (inArray(includes, 'leaflet.markercluster')) {
            inputCSS("libs/leaflet/plugins/leaflet.markercluster/1.3.0/MarkerCluster.Default.css");
            inputCSS("libs/leaflet/plugins/leaflet.markercluster/1.3.0/MarkerCluster.css");
            inputScript("libs/leaflet/plugins/leaflet.markercluster/1.3.0/leaflet.markercluster.js");
        }
        if (inArray(includes, 'leaflet-icon-pulse')) {
            inputCSS("libs/leaflet/plugins/leaflet-icon-pulse/L.Icon.Pulse.css");
            inputScript("libs/leaflet/plugins/leaflet-icon-pulse/L.Icon.Pulse.js");
        }
        if (inArray(includes, 'leaflet.draw')) {
            inputCSS("libs/leaflet/plugins/leaflet.draw/1.0.2/leaflet.draw.css");
            inputScript("libs/leaflet/plugins/leaflet.draw/1.0.2/leaflet.draw.js");
        }
        if (inArray(includes, 'leaflet.pm')) {
            inputCSS("libs/leaflet/plugins/leaflet.pm/0.25.0/leaflet.pm.css");
            inputScript("libs/leaflet/plugins/leaflet.pm/0.25.0/leaflet.pm.min.js");
        }
        if (inArray(includes, 'leaflet.miniMap')) {
            inputCSS("libs/leaflet/plugins/leaflet-miniMap/3.6.1/dist/Control.MiniMap.min.css");
            inputScript("libs/leaflet/plugins/leaflet-miniMap/3.6.1/dist/Control.MiniMap.min.js");
        }
        if (inArray(includes, 'leaflet.sidebyside')) {
            inputScript("libs/leaflet/plugins/leaflet-side-by-side/leaflet-side-by-side.min.js");
        }
    }

    load();
    window.isLocal = true;
    window.server = document.location.toString().match(/file:\/\//) ? "http://localhost:8090" : document.location.protocol + "//" + document.location.host;
})();
