import axios from 'axios';

class d23DExplorer{
    var url1 = "http://support.supermap.com.cn:8090/iserver/services/map-world/rest/maps/World";
    var urlMap = "http://localhost:8090/iserver/services/map-DGGW/rest/maps/Map";
    var mapPan;
    var scenePan;
    var viewer;
    var layer, layerMap;

    function onload(Cesium) {
        viewer = new Cesium.Viewer('cesiumContainer');
        viewer.imageryLayers.addImageryProvider(new Cesium.SuperMapImageryProvider({
            url: url1
        }));
        var map, control;
        var scene = viewer.scene;
        var widget = viewer.cesiumWidget;
        // 飞向通过top-down视图表示的位置
        scene.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(114.10, 22.82, 2500.0)
        });

        //TODO：测试5
        var promise = scene.open("http://localhost:8090/iserver/services/3D-Scene2/rest/realspace");
        Cesium.when(promise, function (layers) {
            if (!scene.pickPositionSupported) {
                alert('不支持深度拾取,属性查询功能无法使用!');
            }
            for (var i = 0; i < layers.length; i++) {
                var strLayer = scene.layers.findByIndex(i).name;
                var layer = scene.layers.find(strLayer);
                var str_before = strLayer.split("@")[0];
                //设置属性查询参数
                layer.setQueryParameter({
                    url: 'http://10.219.245.97:8090/iserver/services/data-Scene/rest/data',
                    dataSourceName: 'DGGW',
                    dataSetName: str_before,
                    keyWord: 'SmID'
                });
            }
        }, function (e) {
            if (widget._showRenderLoopErrors) {
                var title = 'An error occurred while rendering.  Rendering has stopped.';
                widget.showErrorPanel(title, undefined, e);
            }
        });

        // //二维地图初始化
        // map = new SuperMap.Map("mapContainer", {
        //     controls: [
        //         new SuperMap.Control.LayerSwitcher(),
        //         new SuperMap.Control.ScaleLine(),
        //         new SuperMap.Control.Zoom(),
        //         new SuperMap.Control.Navigation({
        //             dragPanOptions: {
        //                 enableKinetic: true
        //             }
        //         })]
        // });
        //二维地图初始化
        map = new SuperMap.Map("mapContainer");
        control = new SuperMap.Control.MousePosition();     //该控件显示鼠标移动时，所在点的地理坐标。
        map.addControl(control);  //添加控件

        //TODO:方式1，自带的地图
        // layer = new SuperMap.Layer.TiledDynamicRESTLayer("World", url1, {
        //     transparent: true,
        //     cacheEnabled: true
        // }, {maxResolution: "auto"});
        // layer.events.on({"layerInitialized": addLayer});
        //
        // function addLayer() {
        //     map.addLayers([layer]);
        //     // map.setCenter(new SuperMap.LonLat(0, 0), 0);
        //     map.setCenter(new SuperMap.LonLat(114.10, 22.82), 1);
        // }

        //TODO：方式2，自己的地图
        layer = new SuperMap.Layer.TiledDynamicRESTLayer("Map", urlMap, {
            transparent: true,
            cacheEnabled: true
        }, {maxResolution: "auto"}, {projection: "EPSG:2383"});

        layer.events.on({"layerInitialized": addLayer2});
        layer.setOpacity(0.8);

        function addLayer2() {
            map.addLayers([layer]);
            // map.setCenter(new SuperMap.LonLat(0, 0), 0);
            map.setCenter(new SuperMap.LonLat(114.10, 22.82), 1);
        }

        $('#loadingbar').remove();

        var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);


        //二维联动三维
        mapPan = function () {
            //添加地图监听事件
            layer.events.on({"moveend": MaptoScene});
            //移除场景鼠标事件
            handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.WHEEL);

        };
        //三维联动二维
        scenePan = function () {
            //注销地图监听事件
            layer.events.unregister("moveend", undefined, MaptoScene);
            handler.setInputAction(function (movement) {
                var camera = viewer.scene.camera;
                var cameraPosiion = camera.position;
                var cartographic = Cesium.Cartographic.fromCartesian(cameraPosiion);
                var longitude = Cesium.Math.toDegrees(cartographic.longitude);
                var latitude = Cesium.Math.toDegrees(cartographic.latitude);
                var height = cartographic.height;
                var size = _calculateSizeFromAltitude(height);
                size = size * 0.5;
                //设置地图显示范围
                var bounds = new SuperMap.Bounds(longitude - size, latitude - size, longitude + size, latitude + size);
                map.zoomToExtent(bounds, false);
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            //添加场景鼠标事件
            handler.setInputAction(function (movement) {
                var camera = viewer.scene.camera;
                var cameraPosiion = camera.position;
                var cartographic = Cesium.Cartographic.fromCartesian(cameraPosiion);
                var longitude = Cesium.Math.toDegrees(cartographic.longitude);
                var latitude = Cesium.Math.toDegrees(cartographic.latitude);
                var height = cartographic.height;
                var size = _calculateSizeFromAltitude(height);
                size = size * 0.5;
                //设置地图显示范围
                var bounds = new SuperMap.Bounds(longitude - size, latitude - size, longitude + size, latitude + size);
                map.zoomToExtent(bounds, false);
            }, Cesium.ScreenSpaceEventType.WHEEL);
        };

        function MaptoScene() {
            //地理坐标
            if (!IsNaN(parseFloat(Math.abs(map.getExtent().left.toString()))) && parseFloat(Math.abs(map.getExtent().left.toString())) < 180) { //获取当前地图范围
                var bounds = map.getExtent();
                //根据给定的地图范围计算场景的高度
                var altitude = _calculateAltitudeFromBounds(bounds);

                //TODO:test
                // var leftBottom = L.point(bounds.left, bounds.bottom);
                // let projectPos = CRS_2383.project(leftBottom);
                // console.log(projectPos);

                //获取地图中心点
                var center = map.getCenter();
                //设置场景相机
                viewer.scene.camera.setView({
                    destination: new Cesium.Cartesian3.fromDegrees(center.lon, center.lat, altitude)
                });
            } else {
                //投影坐标
                var bounds = map.getExtent();
                let serurl = "http://10.219.245.97:8090/iserver/services/projectToGeo/rest/domainComponents/ProjectToGeo/projectToGeoResult.json?";
                let tempurl = serurl + 'arg0=' + bounds.left + '&arg1=' + bounds.bottom + '&arg2=2383';
                let tempurl2 = serurl + 'arg0=' + bounds.right + '&arg1=' + bounds.top + '&arg2=2383';

                axios.get(tempurl).then(function (response2) {
                    let res = response2.data;
                    bounds.left = res[0];
                    bounds.bottom = res[1];

                }).catch(function (error) {
                    alert(tempurl + "服务未启动！");
                });

                axios.get(tempurl2).then(function (response2) {
                    let res = response2.data;
                    bounds.right = res[0];
                    bounds.top = res[1];

                }).catch(function (error) {
                    alert(tempurl + "服务未启动！");
                });

                //根据给定的地图范围计算场景的高度
                var altitude = _calculateAltitudeFromBounds(bounds);
                //获取地图中心点
                var center = map.getCenter();
                let tempurl3 = serurl + 'arg0=' + center.x + '&arg1=' + center.y + '&arg2=2383';
                axios.get(tempurl3).then(function (response2) {
                    let res = response2.data;
                    center.x = res[0];
                    center.y = res[1];
                }).catch(function (error) {
                    alert(tempurl + "服务未启动！");
                });
                //设置场景相机
                viewer.scene.camera.setView({
                    destination: new Cesium.Cartesian3.fromDegrees(center.lon, center.lat, altitude)
                });
            }

        }

        function IsNaN(value) {
            return typeof value === 'number' && isNaN(value);
        }

        /*  $("#Explore2D").onclick(function(){
              scenePan();
          });
          $("#Explore3D").onclick(function(){
              mapPan();
          });*/

        //二维map的viewBoundsChanged事件的回调函数
        function viewBoundsChangedHandler() {
            ///<param name="e" type="EventObject"></param>
            ///<returns type="void"></returns>
            var viewBounds = map.get_viewBounds();
            var altitude = _calculateAltitudeFromBounds(viewBounds);
            var camera = sceneControl.get_scene().get_camera();
            camera.set_altitude(altitude);
            sceneControl.get_scene().set_camera(camera);
        }

        /// <summary>
        /// 根据给定的地图范围计算场景的高度
        /// </summary>
        /// <param name="bounds">地图范围</param>
        /// <returns>场景高度</returns>
        function _calculateAltitudeFromBounds(bounds) {
            var _PI = 3.1415926;
            var _earthRadius = 6378137;
            var altitude = _earthRadius;
            var boundsWidth = bounds.right - bounds.left;
            if (boundsWidth >= 120) {
                altitude = _earthRadius * boundsWidth / 60 - _earthRadius;
            } else if (boundsWidth != 0) {
                var angle1 = (boundsWidth / 360) * _PI;
                var height = Math.sin(angle1) * _earthRadius;
                var a = height / Math.tan(angle1);
                var b = height / Math.tan(_PI / 6);
                altitude = a + b - _earthRadius;
            }
            return altitude;
        }


        /// <summary>
        /// 根据给定的场景高度计算地图中显示范围的宽度
        /// </summary>
        /// <param name="altitude">场景高度</param>
        /// <returns>地图显示范围尺寸</returns>
        function _calculateSizeFromAltitude(altitude) {
            var _PI = 3.1415926;
            var _earthRadius = 6378137;
            var size;
            if (altitude >= _earthRadius) {//当场景高度大于可全幅显示整球的高度时
                var ratio = (altitude + _earthRadius) * 0.5;
                size = 120 * ratio / _earthRadius
            } else {//当场景高度小于可全幅显示整球的高度时，即无法看到整球时
                var tan30 = Math.tan(_PI / 6);
                //设置方程组的a,b,c
                var a = (Math.pow(tan30, 2) + 1) * Math.pow(_earthRadius, 2);
                var b = -2 * (_earthRadius + altitude) * _earthRadius * Math.pow(tan30, 2);
                var c = Math.pow(tan30, 2) * Math.pow(_earthRadius + altitude, 2) - Math.pow(_earthRadius, 2.0);
                //解一元二次方程，取锐角，因此余弦值较大
                var cosd = (-b + Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);
                var d = Math.acos(cosd);
                var widthd = 2 * d * _earthRadius;
                size = (widthd / (_PI * _earthRadius)) * 180;
            }
            return size;
        }

    }
}export default d23DExplorer;