/*示范代码说明：
     *分层分户信息查询
     *
     *主要涉及接口：
     *setQueryParameter
     *setPolygonoffset
     *
     * 示范代码：
    */
function onload(Cesium) {
    var viewer = new Cesium.Viewer('cesiumContainer');
    var scene = viewer.scene;
    scene.globe.show = false;

    /* 气泡相关 1/4 start */
    var scenePosition = null; // 记录在场景中点击的笛卡尔坐标点
    var dock = false; // 是否停靠
    var infoboxContainer = document.getElementById("bubble");
    var table = document.getElementById("tab"); // 气泡内的表格

    $("#bubblePosition").click(function () { // 停靠状态切换
        dock = !dock;
        if ($("#bubblePosition").hasClass("fui-export")) {
            $("#bubble").removeClass("bubble").addClass("float");
            $("#bubblePosition").removeClass("fui-export").addClass("fui-bubble");
            $("#bubblePosition")[0].title = "悬浮";
            $("#bubble").css({'left': '82%', 'bottom': '45%'});
            $("#tableContainer").css({'height': '350px'});
        } else if ($("#bubblePosition").hasClass("fui-bubble")) {
            $("#bubble").removeClass("float").addClass("bubble");
            $("#bubblePosition").removeClass("fui-bubble").addClass("fui-export");
            $("#bubblePosition")[0].title = "停靠";
            $("#tableContainer").css({'height': '150px'});
        }
    });

    $("#close").click(function () { // 关闭气泡
        $("#bubble").hide();
    });

    scene.postRender.addEventListener(function () { // 每一帧都去计算气泡的正确位置
        if (scenePosition && !dock) {
            var canvasHeight = scene.canvas.height;
            var windowPosition = new Cesium.Cartesian2();
            Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, scenePosition, windowPosition);
            infoboxContainer.style.bottom = (canvasHeight - windowPosition.y + 45) + 'px';
            infoboxContainer.style.left = (windowPosition.x - 70) + 'px';
            infoboxContainer.style.visibility = "visible";
        }
    });
    /* 气泡相关 1/4 end */

    var camera = scene.camera;
    var lastHouseEntity = null; // 最后一次显示的高亮面

    // 加载倾斜摄影图层
    var promise = scene.addS3MTilesLayerByScp(URL_CONFIG.SCP_FCFH_QX, {
        name: 'oblique photography'
    });

    promise.then(function (obliqueLayers) {
        camera.setView({ // 精确定位
            destination: new Cesium.Cartesian3(-2387685.5300606918, 4546843.024531732, 3782446.1843654616),
            orientation: {
                heading: 3.5848126302038947,
                pitch: -0.38864153252552613,
                roll: 0.000004955793702521305
            }
        });

        var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
        handler.setInputAction(function (e) {
            // 获取点击位置笛卡尔坐标
            var position = scene.pickPosition(e.position);
            if (!position) {
                position = Cesium.Cartesian3.fromDegrees(0, 0, 0);
            }
            scenePosition = position; // 气泡相关 2/4
            // 从笛卡尔坐标获取经纬度
            var cartographic = Cesium.Cartographic.fromCartesian(position);
            var longitude = Cesium.Math.toDegrees(cartographic.longitude);
            var latitude = Cesium.Math.toDegrees(cartographic.latitude);
            var height = cartographic.height;

            // 设置查询条件。Z在本例数据中代表户型面的底部高程，CENGG为层高，SmSdriW为最西边的经度，SmSdriE为最东边的经度，SmSdriS为最南边的纬度，SmSdriN为最北边的纬度
            doSqlQuery(`bottom < ${height} and ${height} < (bottom + LSG) and ${longitude} > SmSdriW and ${longitude} < SmSdriE and ${latitude} > SmSdriS and ${latitude} < SmSdriN`);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // 去除加载动画
        $('#loadingbar').remove();
    });

    function onQueryComplete(queryEventArgs) {
        // 首先移除之前添加标识实体
        if (lastHouseEntity) {
            viewer.entities.remove(lastHouseEntity);
            lastHouseEntity = null;
        }
        var selectedFeature = queryEventArgs.originResult.features[0]; // 选中楼层的楼层面信息对象
        if (!selectedFeature) {
            /* 气泡相关 3/4 start */
            scenePosition = null;
            $("#bubble").hide();
            /* 气泡相关 3/4 end */
            return;
        }
        if (!selectedFeature.geometry.points) {
            return;
        }
        var bottomHeight = Number(selectedFeature.fieldValues[selectedFeature.fieldNames.indexOf('BOTTOM')]); // 底部高程
        var extrudeHeight = Number(selectedFeature.fieldValues[selectedFeature.fieldNames.indexOf('LSG')]); // 层高（拉伸高度）
        Cesium.GroundPrimitive.bottomAltitude = bottomHeight; // 矢量面贴对象的底部高程
        Cesium.GroundPrimitive.extrudeHeight = extrudeHeight; // 矢量面贴对象的拉伸高度
        var points3D = []; // [经度, 纬度, 经度, 纬度, ...]的形式，存放楼层面上的点坐标
        for (var pt of selectedFeature.geometry.points) {
            points3D.push(pt.x, pt.y);
        }
        lastHouseEntity = viewer.entities.add({
            polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(points3D),
                material: new Cesium.Color(223 / 255, 199 / 255, 0 / 255, 0.4)
            },
            clampToS3M: true // 贴在S3M模型表面
        });

        /* 气泡相关 4/4 start */
        $("#bubble").show();
        for (i = table.rows.length - 1; i > -1; i--) {
            table.deleteRow(i);
        }
        for (var index in selectedFeature.fieldNames) {
            var newRow = table.insertRow();
            var cell1 = newRow.insertCell();
            var cell2 = newRow.insertCell();
            cell1.innerHTML = selectedFeature.fieldNames[index];
            cell2.innerHTML = selectedFeature.fieldValues[index];
        }
        /* 气泡相关 4/4 end */
    }

    /**
     * 执行SQL查询
     * @param SQL SQL查询条件
     */
    function doSqlQuery(SQL) {
        var getFeatureParam, getFeatureBySQLService, getFeatureBySQLParams;
        getFeatureParam = new SuperMap.REST.FilterParameter({
            attributeFilter: SQL
        });
        getFeatureBySQLParams = new SuperMap.REST.GetFeaturesBySQLParameters({
            queryParameter: getFeatureParam,
            toIndex: -1,
            datasetNames: ["mian:" + "mian"] // 本例中“户型面”为数据源名称，“专题户型面2D”为楼层面相应的数据集名称
        });
        var url = URL_CONFIG.SCP_FCFH_DATA; // 数据服务地址
        getFeatureBySQLService = new SuperMap.REST.GetFeaturesBySQLService(url, {
            eventListeners: {
                "processCompleted": onQueryComplete, // 查询成功时的回调函数
                "processFailed": processFailed // 查询失败时的回调函数
            }
        });
        getFeatureBySQLService.processAsync(getFeatureBySQLParams);
    }

    function processFailed(queryEventArgs) {
        alert('查询失败！');
        console.log(queryEventArgs);
    }
}
